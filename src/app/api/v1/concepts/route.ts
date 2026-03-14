// src/app/api/v1/concepts/route.ts
import { NextResponse } from 'next/server';
import { UniversalKnowledgeStore } from '@/engine/store';
import { logger, startTimer } from '@/lib/logger';

interface ConceptsQuery {
  domain?: string;
  search?: string;
}

export async function GET(request: Request) {
  const timer = startTimer('GET /api/v1/concepts');
  const { searchParams } = new URL(request.url);
  const query: ConceptsQuery = Object.fromEntries(searchParams);
  
  try {
    const store = new UniversalKnowledgeStore();
    
    const where: any = {};
    
    if (query.domain) {
      where.domain = query.domain;
    }
    
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    
    const concepts = await store.db.concept.findMany({
      where,
      include: {
        _count: {
          select: {
            entries: true,
          },
        },
      },
      take: 50,
    });
    
    await store.disconnect();
    
    timer.end();
    
    return NextResponse.json({
      data: concepts.map((c: any) => ({
        id: c.id,
        name: c.name,
        domain: c.domain,
        description: c.description,
        entry_count: c._count.entries,
      })),
    });
  } catch (error) {
    logger.errorWithStack('Failed to get concepts', error as Error);
    timer.end();
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch concepts',
      },
      { status: 500 }
    );
  }
}
