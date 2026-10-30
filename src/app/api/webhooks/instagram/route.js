import { NextResponse } from 'next/server';

export async function GET(request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  // Must match what you typed in the Meta dashboard ("AP_Blitz_Is_Cool")
  const MY_VERIFY_TOKEN = 'AP_Blitz_Is_Cool';

  if (mode === 'subscribe' && token === MY_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (body.object === 'instagram') {
      return new Response('EVENT_RECEIVED', { status: 200 });
    }
    return new Response('Not Found', { status: 404 });
  } catch (error) {
    return new Response('Bad Request', { status: 400 });
  }
}
