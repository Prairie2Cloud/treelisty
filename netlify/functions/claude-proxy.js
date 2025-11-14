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

    // Extract userApiKey if provided (for users testing with their own key)
    const { userApiKey, ...anthropicRequestBody } = requestBody;

    // Use user's API key if provided, otherwise use server's key
    const apiKeyToUse = userApiKey || ANTHROPIC_API_KEY;

    if (!apiKeyToUse) {
      console.error('No API key available (neither user-provided nor server-side)');
      return {
        statusCode: 401,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: {
            message: 'API key required. Please set your API key in TreeListy (🔑 button) or configure ANTHROPIC_API_KEY environment variable in Netlify.'
          }
        })
      };
    }

    console.log(userApiKey ? 'Using user-provided API key' : 'Using server API key');
    console.log('Proxying request to Anthropic API...');

    // Forward request to Anthropic API (without userApiKey field)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKeyToUse,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(anthropicRequestBody)
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
