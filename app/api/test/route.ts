import { NextResponse } from 'next/server';
import { prisma } from '../../lib/db';

export async function GET() {
  try {
    // Try to fetch one trade from the database
    const trade = await prisma.trade.findFirst();
    return NextResponse.json({ status: 'ok', db: 'connected', sampleTrade: trade });
  } catch (error) {
    return NextResponse.json({ status: 'error', db: 'not connected', error: error instanceof Error ? error.message : error }, { status: 500 });
  }
} 