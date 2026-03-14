// src/app/api/v1/health/route.ts
import { NextResponse } from 'next/server';
import { UniversalKnowledgeStore } from '@/engine/store';

export async function GET() {
  try {
    const store = new UniversalKnowledgeStore();
    await store.db.$queryRaw`SELECT 1`;
    await store.disconnect();
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
