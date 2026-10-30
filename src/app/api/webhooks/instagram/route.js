import { NextResponse } from 'next/server';

// 1. Handles the initial verification handshake from Meta
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Use the secret verify token you choose
  const MY_VERIFY_TOKEN = 'apblitz_secure_token_123'; 

  if (mode === 'subscribe' && token === MY_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  } else {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
}

// 2. Handles incoming notifications (like new comments) from Instagram
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Check if it's an Instagram event
    if (body.object === 'instagram') {
      for (const entry of body.entry) {
        // Here is where you handle comments or messages!
        console.log('Webhook entry received:', entry);
      }
      return NextResponse.json({ status: 'EVENT_RECEIVED' }, { status: 200 });
    }

    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
  }
}
