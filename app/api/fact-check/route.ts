// // app/api/fact-check/route.ts
// import { NextResponse } from 'next/server';

// export async function POST(request: Request) {
//   try {
//     const body = await request.json();
//     const { text } = body;

//     if (!text || text.trim() === '') {
//       return NextResponse.json(
//         { error: 'Text is required' },
//         { status: 400 }
//       );
//     }

//     const n8nResponse = await fetch(
//       'http://localhost:5678/webhook-test/fact-check',
//       {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ text }),
//       }
//     );

//     if (!n8nResponse.ok) {
//       throw new Error(`n8n webhook failed: ${n8nResponse.status}`);
//     }

//     const data = await n8nResponse.json();
//     return NextResponse.json(data);
//   } catch (error) {
//     console.error('Fact-check API error:', error);
//     return NextResponse.json(
//       {
//         error: 'Failed to process fact-check request',
//         details: error instanceof Error ? error.message : 'Unknown error',
//       },
//       { status: 500 }
//     );
//   }
// }


// app/api/fact-check/route.ts



// import { NextResponse } from 'next/server';

// const N8N_WEBHOOK_URL =
//   process.env.N8N_WEBHOOK_URL ||
//   'http://localhost:5678/webhook/fact-check';

// export async function POST(request: Request) {
//   try {
//     const body = await request.json();
//     const { text } = body;

//     if (!text || text.trim() === '') {
//       return NextResponse.json(
//         { error: 'Text is required' },
//         { status: 400 }
//       );
//     }

//     const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ text }),
//     });

//     if (!n8nResponse.ok) {
//       const errorText = await n8nResponse.text();
//       console.error('n8n error response:', n8nResponse.status, errorText);
//       throw new Error(`n8n webhook failed: ${n8nResponse.status}`);
//     }

//     const data = await n8nResponse.json();
//     const result = data.result ?? data;

//     return NextResponse.json({ result });
//   } catch (error) {
//     console.error('Fact-check API error:', error);
//     return NextResponse.json(
//       {
//         error: 'Failed to process fact-check request',
//         details: error instanceof Error ? error.message : 'Unknown error',
//       },
//       { status: 500 }
//     );
//   }
// }


import { NextResponse } from 'next/server';

const N8N_WEBHOOK_URL =
  process.env.N8N_WEBHOOK_URL ||
  'http://localhost:5678/webhook/fact-check';

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

    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error('n8n error response:', n8nResponse.status, errorText);
      throw new Error(`n8n webhook failed: ${n8nResponse.status}`);
    }

    const raw = await n8nResponse.json();

    // raw is an array with one item
    const item = Array.isArray(raw) ? raw[0] : raw;

    // item.result is a JSON string -> parse it
    let parsedResult: any;
    try {
      parsedResult =
        typeof item.result === 'string'
          ? JSON.parse(item.result)
          : item.result;
    } catch {
      parsedResult = {};
    }

    const result = {
      verdict: parsedResult.verdict ?? 'UNCERTAIN',
      confidence:
        typeof parsedResult.confidence === 'number'
          ? parsedResult.confidence
          : 0.5,
      reason:
        parsedResult.reason ??
        'No explanation provided by the fact-checker.',
      source: parsedResult.source,
    };

    return NextResponse.json({ result });
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
