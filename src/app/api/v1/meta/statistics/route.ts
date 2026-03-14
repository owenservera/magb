// src/app/api/v1/meta/statistics/route.ts
import { NextResponse } from 'next/server';
import { UniversalKnowledgeStore } from '@/engine/store';
import { logger } from '@/lib/logger';

export async function GET() {
  const timer = logger.startTimer('GET /api/v1/meta/statistics');
  
  try {
    const store = new UniversalKnowledgeStore();
    const stats = await store.getStatistics();
    await store.disconnect();
    
    timer.end();
    
    return NextResponse.json({
      data: stats,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.errorWithStack('Failed to get statistics', error as Error);
    timer.end();
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch statistics',
      },
      { status: 500 }
    );
  }
}
