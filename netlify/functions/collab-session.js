// Netlify serverless function for managing live collaboration sessions
// Allows hosts to share API keys with collaborators securely
// Keys are stored encrypted in Netlify Blobs, never exposed to clients

const { getStore } = require('@netlify/blobs');
const crypto = require('crypto');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, GET, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

// Session duration: 4 hours
const SESSION_DURATION_MS = 4 * 60 * 60 * 1000;

// Generate a secure random token
function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Simple encryption for API keys (using a server-side secret)
function encryptKeys(keys, secret) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secret, 'hex'), iv);
  let encrypted = cipher.update(JSON.stringify(keys), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

// Decrypt API keys
function decryptKeys(encryptedData, secret) {
  const [ivHex, encrypted] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secret, 'hex'), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
}

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: true })
    };
  }

  // Get encryption secret from environment
  const ENCRYPTION_SECRET = process.env.COLLAB_ENCRYPTION_SECRET;
  if (!ENCRYPTION_SECRET || ENCRYPTION_SECRET.length !== 64) {
    console.error('COLLAB_ENCRYPTION_SECRET not set or invalid (must be 64 hex chars)');
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Server configuration error' })
    };
  }

  const store = getStore('collab-sessions');

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { action } = body;

    // ═══════════════════════════════════════════════════════════════════
    // CREATE SESSION - Host creates a session with their API keys
    // ═══════════════════════════════════════════════════════════════════
    if (action === 'create') {
      const { hostName, apiKeys } = body;

      if (!hostName || !apiKeys) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'hostName and apiKeys required' })
        };
      }

      // Generate session token
      const sessionToken = generateSessionToken();
      const expiresAt = Date.now() + SESSION_DURATION_MS;

      // Encrypt the API keys
      const encryptedKeys = encryptKeys(apiKeys, ENCRYPTION_SECRET);

      // Store session data
      const sessionData = {
        hostName,
        encryptedKeys,
        createdAt: Date.now(),
        expiresAt,
        guestCount: 0,
        lastActivity: Date.now()
      };

      await store.set(sessionToken, JSON.stringify(sessionData));

      console.log(`Session created by ${hostName}, expires in 4 hours`);

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: true,
          sessionToken,
          expiresAt,
          expiresIn: '4 hours'
        })
      };
    }

    // ═══════════════════════════════════════════════════════════════════
    // VALIDATE SESSION - Check if a session is valid (for guests)
    // ═══════════════════════════════════════════════════════════════════
    if (action === 'validate') {
      const { sessionToken } = body;

      if (!sessionToken) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'sessionToken required' })
        };
      }

      const sessionDataStr = await store.get(sessionToken);

      if (!sessionDataStr) {
        return {
          statusCode: 404,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'Session not found or expired' })
        };
      }

      const sessionData = JSON.parse(sessionDataStr);

      // Check expiration
      if (Date.now() > sessionData.expiresAt) {
        // Clean up expired session
        await store.delete(sessionToken);
        return {
          statusCode: 410,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'Session expired' })
        };
      }

      // Update last activity
      sessionData.lastActivity = Date.now();
      sessionData.guestCount = (sessionData.guestCount || 0) + 1;
      await store.set(sessionToken, JSON.stringify(sessionData));

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          valid: true,
          hostName: sessionData.hostName,
          expiresAt: sessionData.expiresAt,
          remainingMs: sessionData.expiresAt - Date.now()
        })
      };
    }

    // ═══════════════════════════════════════════════════════════════════
    // GET KEYS - Internal use only (called by claude-proxy with session)
    // Returns decrypted keys for proxying AI requests
    // ═══════════════════════════════════════════════════════════════════
    if (action === 'getKeys') {
      const { sessionToken, internalSecret } = body;

      // Verify this is an internal call from our own proxy
      if (internalSecret !== process.env.INTERNAL_PROXY_SECRET) {
        return {
          statusCode: 403,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'Forbidden' })
        };
      }

      if (!sessionToken) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'sessionToken required' })
        };
      }

      const sessionDataStr = await store.get(sessionToken);

      if (!sessionDataStr) {
        return {
          statusCode: 404,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'Session not found' })
        };
      }

      const sessionData = JSON.parse(sessionDataStr);

      // Check expiration
      if (Date.now() > sessionData.expiresAt) {
        await store.delete(sessionToken);
        return {
          statusCode: 410,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'Session expired' })
        };
      }

      // Decrypt and return keys
      const apiKeys = decryptKeys(sessionData.encryptedKeys, ENCRYPTION_SECRET);

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          apiKeys,
          hostName: sessionData.hostName
        })
      };
    }

    // ═══════════════════════════════════════════════════════════════════
    // REVOKE SESSION - Host ends the session early
    // ═══════════════════════════════════════════════════════════════════
    if (action === 'revoke') {
      const { sessionToken } = body;

      if (!sessionToken) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'sessionToken required' })
        };
      }

      await store.delete(sessionToken);

      console.log('Session revoked');

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: true, message: 'Session revoked' })
      };
    }

    // ═══════════════════════════════════════════════════════════════════
    // SESSION STATUS - Host checks session status
    // ═══════════════════════════════════════════════════════════════════
    if (action === 'status') {
      const { sessionToken } = body;

      if (!sessionToken) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'sessionToken required' })
        };
      }

      const sessionDataStr = await store.get(sessionToken);

      if (!sessionDataStr) {
        return {
          statusCode: 404,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'Session not found', active: false })
        };
      }

      const sessionData = JSON.parse(sessionDataStr);
      const isExpired = Date.now() > sessionData.expiresAt;

      if (isExpired) {
        await store.delete(sessionToken);
      }

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          active: !isExpired,
          hostName: sessionData.hostName,
          createdAt: sessionData.createdAt,
          expiresAt: sessionData.expiresAt,
          guestCount: sessionData.guestCount || 0,
          lastActivity: sessionData.lastActivity,
          remainingMs: isExpired ? 0 : sessionData.expiresAt - Date.now()
        })
      };
    }

    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Invalid action. Use: create, validate, revoke, status' })
    };

  } catch (error) {
    console.error('Collab session error:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: error.message || 'Internal server error' })
    };
  }
};
