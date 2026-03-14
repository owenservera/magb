// src/app/api/v1/search/route.ts
import { NextResponse } from 'next/server';
import { UniversalKnowledgeStore } from '@/engine/store';
import { logger, startTimer } from '@/lib/logger';

interface SearchBody {
  query: string;
  node_types?: string[];
  targets?: string[];
  limit?: number;
}

export async function POST(request: Request) {
  const timer = startTimer('POST /api/v1/search');
  
  try {
    const body: SearchBody = await request.json();
    const { query, node_types = [], targets = [], limit = 20 } = body;
    
    if (!query || query.trim().length === 0) {
      timer.end();
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }
    
    const store = new UniversalKnowledgeStore();
    
    const results: any[] = [];
    
    // Search entries
    if (node_types.length === 0 || node_types.includes('entry')) {
      const entries = await store.db.entry.findMany({
        where: {
          AND: [
            {
              OR: [
                { path: { contains: query, mode: 'insensitive' } },
                { contentStandard: { contains: query, mode: 'insensitive' } },
              ],
            },
            ...(targets.length > 0 ? [{ targetId: { in: targets } }] : []),
          ],
        },
        select: {
          id: true,
          path: true,
          contentMicro: true,
          targetId: true,
        },
        take: limit,
      });
      
      results.push(
        ...entries.map((e: any) => ({
          id: e.id,
          type: 'entry',
          name: e.path,
          snippet: e.contentMicro || e.path,
          target_id: e.targetId,
        }))
      );
    }
    
    // Search capabilities
    if (node_types.length === 0 || node_types.includes('capability')) {
      const capabilities = await store.db.capability.findMany({
        where: {
          AND: [
            {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { userDescription: { contains: query, mode: 'insensitive' } },
              ],
            },
            ...(targets.length > 0 ? [{ targetId: { in: targets } }] : []),
          ],
        },
        select: {
          id: true,
          name: true,
          userDescription: true,
          targetId: true,
        },
        take: limit,
      });
      
      results.push(
        ...capabilities.map((c: any) => ({
          id: c.id,
          type: 'capability',
          name: c.name,
          snippet: c.userDescription || c.name,
          target_id: c.targetId,
        }))
      );
    }
    
    // Search algorithms
    if (node_types.length === 0 || node_types.includes('algorithm')) {
      const algorithms = await store.db.algorithm.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { purpose: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          purpose: true,
          category: true,
        },
        take: limit,
      });
      
      results.push(
        ...algorithms.map((a: any) => ({
          id: a.id,
          type: 'algorithm',
          name: a.name,
          snippet: a.purpose,
        }))
      );
    }
    
    await store.disconnect();
    
    timer.end();
    
    // Sort by relevance (simple: prioritize exact matches)
    const queryLower = query.toLowerCase();
    results.sort((a, b) => {
      const aNameMatch = a.name.toLowerCase().includes(queryLower) ? 1 : 0;
      const bNameMatch = b.name.toLowerCase().includes(queryLower) ? 1 : 0;
      return bNameMatch - aNameMatch;
    });
    
    return NextResponse.json({
      data: results.slice(0, limit),
      meta: {
        total: results.length,
        limit,
      },
    });
  } catch (error) {
    logger.errorWithStack('Failed to search', error as Error);
    timer.end();
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to search',
      },
      { status: 500 }
    );
  }
}
