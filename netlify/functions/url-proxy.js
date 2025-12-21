// Netlify serverless function to proxy URL fetches
// Avoids CORS issues when fetching web pages for RAG import
// Build 519: Created for RAG Phase 1 URL import feature

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'text/html; charset=utf-8'
};

// Rate limiting to prevent abuse
const RATE_LIMIT = {
  requestsPerMinute: 10,
  windowMs: 60 * 1000
};

const rateLimitStore = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  let ipData = rateLimitStore.get(ip);

  if (!ipData || now > ipData.resetAt) {
    ipData = { count: 0, resetAt: now + RATE_LIMIT.windowMs };
    rateLimitStore.set(ip, ipData);
  }

  ipData.count++;

  if (ipData.count > RATE_LIMIT.requestsPerMinute) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: RATE_LIMIT.requestsPerMinute - ipData.count };
}

// Allowed domains (prevent abuse for arbitrary proxying)
const ALLOWED_PATTERNS = [
  // Allow most common content sites
  /^https?:\/\//,  // Any HTTPS/HTTP URL for now (can restrict later)
];

// Blocked domains (security/abuse prevention)
const BLOCKED_PATTERNS = [
  /localhost/i,
  /127\.0\.0\.1/,
  /192\.168\./,
  /10\.\d+\.\d+\.\d+/,
  /172\.(1[6-9]|2\d|3[01])\./,
  /\.local$/i,
  /\.internal$/i,
];

function isUrlAllowed(url) {
  // Check blocked patterns first
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(url)) {
      return false;
    }
  }

  // Check allowed patterns
  for (const pattern of ALLOWED_PATTERNS) {
    if (pattern.test(url)) {
      return true;
    }
  }

  return false;
}

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: ''
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Get URL from query parameter
  const url = event.queryStringParameters?.url;

  if (!url) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Missing url parameter' })
    };
  }

  // Validate URL
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch (e) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Invalid URL format' })
    };
  }

  // Check if URL is allowed
  if (!isUrlAllowed(url)) {
    return {
      statusCode: 403,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'URL not allowed (internal/blocked domain)' })
    };
  }

  // Rate limiting
  const clientIP = event.headers['x-forwarded-for']?.split(',')[0] ||
                   event.headers['client-ip'] ||
                   'unknown';

  const rateCheck = checkRateLimit(clientIP);
  if (!rateCheck.allowed) {
    return {
      statusCode: 429,
      headers: {
        ...CORS_HEADERS,
        'Retry-After': '60'
      },
      body: JSON.stringify({ error: 'Rate limit exceeded. Try again in a minute.' })
    };
  }

  // Fetch the URL
  try {
    console.log(`[url-proxy] Fetching: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'TreeListy-RAG/1.0 (URL Import)',
        'Accept': 'text/html,text/plain,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000) // 15 second timeout
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: `Failed to fetch URL: ${response.status} ${response.statusText}`
        })
      };
    }

    const contentType = response.headers.get('content-type') || '';

    // Only allow text/html content
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
      return {
        statusCode: 415,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: `Unsupported content type: ${contentType}. Only HTML/text pages are supported.`
        })
      };
    }

    const html = await response.text();

    // Limit response size (500KB max)
    if (html.length > 500000) {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: html.substring(0, 500000)
      };
    }

    console.log(`[url-proxy] Success: ${url} (${html.length} bytes)`);

    return {
      statusCode: 200,
      headers: {
        ...CORS_HEADERS,
        'X-Fetched-URL': url,
        'X-Content-Length': html.length.toString()
      },
      body: html
    };

  } catch (error) {
    console.error(`[url-proxy] Error fetching ${url}:`, error.message);

    // Handle specific error types
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return {
        statusCode: 504,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Request timed out. The page took too long to load.' })
      };
    }

    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: `Failed to fetch URL: ${error.message}` })
    };
  }
};
