import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (Array.isArray(body?.logs)) {
      for (const logLine of body.logs) {
        console.warn('[Apple PassKit Device Log]:', logLine);
      }
    }
    return new NextResponse(null, { status: 200 });
  } catch (err) {
    console.error('[PassKit Log Route] Error:', err);
    return new NextResponse(null, { status: 500 });
  }
}
