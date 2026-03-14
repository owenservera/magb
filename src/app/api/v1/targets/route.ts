// src/app/api/v1/targets/route.ts
import { NextResponse } from 'next/server';
import { UniversalKnowledgeStore } from '@/engine/store';
import { logger, startTimer } from '@/lib/logger';
import { TargetKind, GenerationStatus } from '@prisma/client';

interface TargetsQuery {
  kind?: string;
  search?: string;
  limit?: string;
  offset?: string;
}

export async function GET(request: Request) {
  const timer = startTimer('GET /api/v1/targets');
  const { searchParams } = new URL(request.url);
  const query: TargetsQuery = Object.fromEntries(searchParams);
  
  try {
    const store = new UniversalKnowledgeStore();
    
    const where: any = {};
    
    // Filter by kind
    if (query.kind) {
      where.kind = query.kind as TargetKind;
    }
    
    // Search by name or description
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    
    const limit = query.limit ? parseInt(query.limit, 10) : 20;
    const offset = query.offset ? parseInt(query.offset, 10) : 0;
    
    const [targets, total] = await Promise.all([
      store.db.target.findMany({
        where,
        take: limit,
        skip: offset,
        include: {
          capabilities: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              capabilities: true,
            },
          },
        },
        orderBy: {
          tier: 'asc',
        },
      }),
      store.db.target.count({ where }),
    ]);
    
    await store.disconnect();
    
    const formattedTargets = targets.map((t: any) => ({
      id: t.id,
      name: t.name,
      kind: t.kind,
      version: t.metadata?.version,
      extensions: t.extensions,
      media_types: t.mediaTypes,
      description: t.description,
      capability_count: t._count.capabilities,
      generation_status: t.generationStatus,
    }));
    
    timer.end();
    
    return NextResponse.json({
      data: formattedTargets,
      meta: {
        total,
        limit,
        offset,
      },
    });
  } catch (error) {
    logger.errorWithStack('Failed to get targets', error as Error);
    timer.end();
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch targets',
      },
      { status: 500 }
    );
  }
}
