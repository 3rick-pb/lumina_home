import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

/**
 * Radar activity endpoint:
 * Presence is now fully handled peer-to-peer via Supabase Realtime Presence (WebSocket cluster),
 * eliminating the need for in-memory serverless Maps or HTTP polling loops.
 */
export async function GET() {
  return NextResponse.json(
    {
      success: true,
      message: 'Radar is powered by Supabase Realtime Presence.',
      clients: [],
      timestamp: Date.now(),
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      },
    }
  );
}

export async function POST() {
  return NextResponse.json({
    success: true,
    message: 'Activity received.',
  });
}

export async function DELETE() {
  return NextResponse.json({
    success: true,
    message: 'Radar sessions reset.',
  });
}

