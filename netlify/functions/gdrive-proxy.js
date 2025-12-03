// Netlify serverless function to proxy Google Drive file downloads
// This avoids CORS issues when loading shared JSON files from Google Drive

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Get file ID from query parameter
  const fileId = event.queryStringParameters?.id;

  if (!fileId) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Missing file ID. Use ?id=FILE_ID' })
    };
  }

  // Validate file ID format (alphanumeric, dashes, underscores)
  if (!/^[a-zA-Z0-9_-]{10,}$/.test(fileId)) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Invalid file ID format' })
    };
  }

  try {
    // Google Drive direct download URL
    const gdriveUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

    console.log('Fetching Google Drive file:', fileId);

    const response = await fetch(gdriveUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TreeListy/1.0)'
      },
      redirect: 'follow'
    });

    if (!response.ok) {
      throw new Error(`Google Drive returned ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();

    // Check if we got the virus scan warning page instead of the file
    if (text.includes('Google Drive - Virus scan warning') || text.includes('confirm=')) {
      // Extract the confirm token and retry
      const confirmMatch = text.match(/confirm=([a-zA-Z0-9_-]+)/);
      if (confirmMatch) {
        const confirmUrl = `https://drive.google.com/uc?export=download&confirm=${confirmMatch[1]}&id=${fileId}`;
        console.log('Retrying with confirm token...');

        const retryResponse = await fetch(confirmUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; TreeListy/1.0)'
          },
          redirect: 'follow'
        });

        if (!retryResponse.ok) {
          throw new Error(`Google Drive retry returned ${retryResponse.status}`);
        }

        const retryText = await retryResponse.text();

        // Try to parse as JSON
        try {
          const jsonData = JSON.parse(retryText);
          return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify(jsonData)
          };
        } catch (parseError) {
          throw new Error('File is not valid JSON. Make sure you shared a TreeListy JSON file.');
        }
      }

      throw new Error('File requires confirmation. Make sure the file is publicly shared.');
    }

    // Check if response looks like HTML (error page)
    if (contentType.includes('text/html') && text.includes('<!DOCTYPE')) {
      throw new Error('File not accessible. Make sure the file is publicly shared with "Anyone with the link".');
    }

    // Try to parse as JSON
    try {
      const jsonData = JSON.parse(text);
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify(jsonData)
      };
    } catch (parseError) {
      throw new Error('File is not valid JSON. Make sure you shared a TreeListy JSON file.');
    }

  } catch (error) {
    console.error('Google Drive proxy error:', error);

    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: error.message || 'Failed to fetch file from Google Drive'
      })
    };
  }
};
