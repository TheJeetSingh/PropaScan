import { NextRequest, NextResponse } from 'next/server';

// Note: Rate limiting is handled by Hack Club AI API itself
// Vercel serverless functions are stateless, so in-memory rate limiting won't work
// For production rate limiting, consider using Vercel's Edge Config or Upstash Redis

// Get API key from environment variable
function getAPIKey(): string {
  const key = process.env.HACK_CLUB_AI_API_KEY;
  if (!key) {
    throw new Error('API key not configured on server');
  }
  return key;
}

// Validate request payload
function validateRequest(body: any): { valid: boolean; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return { valid: false, error: 'Messages array is required' };
  }

  // Check content size (limit to ~10MB for images + text)
  const bodyString = JSON.stringify(body);
  if (bodyString.length > 10 * 1024 * 1024) {
    return { valid: false, error: 'Request payload too large (max 10MB)' };
  }

  return { valid: true };
}

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    // CORS headers - allow requests from extension
    const origin = request.headers.get('origin');
    const corsHeaders = {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate request
    const validation = validateRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get API key
    let apiKey: string;
    try {
      apiKey = getAPIKey();
    } catch (e) {
      console.error('API key not configured:', e);
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Forward request to Hack Club AI
    const hackClubUrl = 'https://ai.hackclub.com/proxy/v1/chat/completions';
    
    const response = await fetch(hackClubUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    // Get response data (handle both JSON and text responses)
    let responseData;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      // Non-JSON response (likely an error)
      const text = await response.text();
      try {
        responseData = JSON.parse(text);
      } catch {
        responseData = { error: text || 'Unknown error occurred' };
      }
    }

    // Forward the response with CORS headers
    // Rate limit headers from Hack Club AI will be passed through if present
    return NextResponse.json(responseData, {
      status: response.status,
      headers: corsHeaders,
    });
  } catch (error: any) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message || 'An unexpected error occurred',
      },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': request.headers.get('origin') || '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  }
}

