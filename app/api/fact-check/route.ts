// app/api/fact-check/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text || text.trim() === '') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const n8nResponse = await fetch(
      'http://localhost:5678/webhook-test/fact-check',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      }
    );

    if (!n8nResponse.ok) {
      throw new Error(`n8n webhook failed: ${n8nResponse.status}`);
    }

    const data = await n8nResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Fact-check API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process fact-check request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
