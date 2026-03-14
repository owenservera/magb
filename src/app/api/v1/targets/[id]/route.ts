// src/app/api/v1/targets/[id]/route.ts
import { NextResponse } from 'next/server';
import { UniversalKnowledgeStore } from '@/engine/store';
import { logger, startTimer } from '@/lib/logger';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const timer = startTimer('GET /api/v1/targets/[id]');
  const { id } = await params;
  
  try {
    const store = new UniversalKnowledgeStore();
    
    const target = await store.db.target.findUnique({
      where: { id },
      include: {
        capabilities: {
          select: {
            id: true,
            name: true,
            category: true,
            userDescription: true,
            complexity: true,
          },
        },
        entries: {
          select: {
            id: true,
            path: true,
            entryType: true,
          },
          take: 10,
        },
        atoms: {
          select: {
            id: true,
            atomType: true,
            elementName: true,
          },
          take: 10,
        },
      },
    });
    
    await store.disconnect();
    
    if (!target) {
      timer.end();
      return NextResponse.json(
        { error: 'Target not found' },
        { status: 404 }
      );
    }
    
    timer.end();
    
    return NextResponse.json({
      data: {
        id: target.id,
        name: target.name,
        kind: target.kind,
        description: target.description,
        extensions: target.extensions,
        media_types: target.mediaTypes,
        generation_status: target.generationStatus,
        capabilities: target.capabilities,
        recent_entries: target.entries,
        recent_atoms: target.atoms,
      },
    });
  } catch (error) {
    logger.errorWithStack('Failed to get target', error as Error);
    timer.end();
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch target',
      },
      { status: 500 }
    );
  }
}
