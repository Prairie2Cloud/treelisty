// Netlify serverless function to proxy Claude API requests
// This avoids CORS issues and keeps API key secure server-side

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: true })
    };
  }

  // Only allow POST requests for actual calls
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Get API key from environment variable
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  if (!ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY environment variable not set');
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: {
          message: 'API key not configured. Please set ANTHROPIC_API_KEY environment variable in Netlify.'
        }
      })
    };
  }

  try {
    // Parse the request body
    const requestBody = JSON.parse(event.body);

    console.log('Proxying request to Anthropic API...');

    // Forward request to Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    // Return response with CORS headers
    return {
      statusCode: response.status,
      headers: CORS_HEADERS,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('Claude API proxy error:', error);

    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: {
          message: error.message || 'Internal server error'
        }
      })
    };
  }
};
