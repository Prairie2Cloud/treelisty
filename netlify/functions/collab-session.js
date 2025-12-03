// Netlify serverless function for managing live collaboration sessions
// Allows hosts to share API keys with collaborators securely
//
// Architecture: Self-contained encrypted tokens (no server-side storage needed)
// - Session data is encrypted and encoded into the token itself
// - Token can be validated without database lookup
// - Keys are never stored on server, only in the encrypted token

const crypto = require('crypto');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, GET, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

// Session duration: 4 hours
const SESSION_DURATION_MS = 4 * 60 * 60 * 1000;

// Encrypt session data into a self-contained token
function createEncryptedToken(data, secret) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secret, 'hex'), iv);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  // Token format: iv:encrypted (both hex encoded)
  return iv.toString('hex') + ':' + encrypted;
}

// Decrypt and validate token
function decryptToken(token, secret) {
  try {
    const [ivHex, encrypted] = token.split(':');
    if (!ivHex || !encrypted) return null;

    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secret, 'hex'), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch (e) {
    return null;
  }
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

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { action } = body;

    // ═══════════════════════════════════════════════════════════════════
    // CREATE SESSION - Host creates a session with their API keys
    // The token contains all session data (self-contained, no DB needed)
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

      const createdAt = Date.now();
      const expiresAt = createdAt + SESSION_DURATION_MS;

      // Create self-contained session data
      const sessionData = {
        hostName,
        apiKeys,
        createdAt,
        expiresAt,
        version: 2  // Token version for future compatibility
      };

      // Encrypt everything into the token
      const sessionToken = createEncryptedToken(sessionData, ENCRYPTION_SECRET);

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
    // VALIDATE SESSION - Check if a session is valid and get API keys
    // Decrypts the token to validate and extract data
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

      const sessionData = decryptToken(sessionToken, ENCRYPTION_SECRET);

      if (!sessionData) {
        return {
          statusCode: 404,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'Invalid or corrupted session token' })
        };
      }

      // Check expiration
      if (Date.now() > sessionData.expiresAt) {
        return {
          statusCode: 410,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'Session expired' })
        };
      }

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          valid: true,
          hostName: sessionData.hostName,
          apiKeys: sessionData.apiKeys,  // Return keys to guest
          expiresAt: sessionData.expiresAt,
          remainingMs: sessionData.expiresAt - Date.now()
        })
      };
    }

    // ═══════════════════════════════════════════════════════════════════
    // GET KEYS - For internal proxy use (validates and returns keys)
    // ═══════════════════════════════════════════════════════════════════
    if (action === 'getKeys') {
      const { sessionToken, internalSecret } = body;

      // Verify this is an internal call from our own proxy
      const INTERNAL_SECRET = process.env.INTERNAL_PROXY_SECRET;
      if (INTERNAL_SECRET && internalSecret !== INTERNAL_SECRET) {
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

      const sessionData = decryptToken(sessionToken, ENCRYPTION_SECRET);

      if (!sessionData) {
        return {
          statusCode: 404,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'Invalid session token' })
        };
      }

      // Check expiration
      if (Date.now() > sessionData.expiresAt) {
        return {
          statusCode: 410,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'Session expired' })
        };
      }

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          apiKeys: sessionData.apiKeys,
          hostName: sessionData.hostName
        })
      };
    }

    // ═══════════════════════════════════════════════════════════════════
    // STATUS - Check session status without returning keys
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

      const sessionData = decryptToken(sessionToken, ENCRYPTION_SECRET);

      if (!sessionData) {
        return {
          statusCode: 404,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'Session not found', active: false })
        };
      }

      const isExpired = Date.now() > sessionData.expiresAt;

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          active: !isExpired,
          hostName: sessionData.hostName,
          createdAt: sessionData.createdAt,
          expiresAt: sessionData.expiresAt,
          remainingMs: isExpired ? 0 : sessionData.expiresAt - Date.now()
        })
      };
    }

    // ═══════════════════════════════════════════════════════════════════
    // REVOKE - With self-contained tokens, revocation is client-side only
    // (Token remains valid until expiry, but client discards it)
    // ═══════════════════════════════════════════════════════════════════
    if (action === 'revoke') {
      // With self-contained tokens, we can't truly revoke server-side
      // The client should discard the token
      console.log('Session revoke requested (client should discard token)');

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: true,
          message: 'Session revoked. Token will expire at scheduled time but should be discarded.'
        })
      };
    }

    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Invalid action. Use: create, validate, status, revoke' })
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
