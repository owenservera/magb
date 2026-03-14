// src/app/api/v1/capabilities/[id]/bundle/route.ts
import { NextResponse } from 'next/server';
import { UniversalKnowledgeStore } from '@/engine/store';
import { logger, startTimer } from '@/lib/logger';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const timer = startTimer('GET /api/v1/capabilities/[id]/bundle');
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const includePrerequisites = searchParams.get('include_prerequisites') === 'true';
  const includeEdgeCases = searchParams.get('include_edge_cases') === 'true';
  
  try {
    const store = new UniversalKnowledgeStore();
    
    const capability = await store.db.capability.findUnique({
      where: { id },
      include: {
        target: true,
      },
    });
    
    if (!capability) {
      timer.end();
      return NextResponse.json(
        { error: 'Capability not found' },
        { status: 404 }
      );
    }
    
    // Get related atoms (templates)
    const relations = await store.db.relation.findMany({
      where: {
        sourceId: id,
        sourceType: 'capability',
      },
    });
    
    const templateIds = relations
      .filter((r: any) => r.relTargetType === 'atom')
      .map((r: any) => r.relTargetId);
    
    const algorithmIds = relations
      .filter((r: any) => r.relTargetType === 'algorithm')
      .map((r: any) => r.relTargetId);
    
    const [templates, algorithms] = await Promise.all([
      store.db.atom.findMany({
        where: {
          id: { in: templateIds },
        },
      }),
      store.db.algorithm.findMany({
        where: {
          id: { in: algorithmIds },
        },
      }),
    ]);
    
    await store.disconnect();
    
    timer.end();
    
    return NextResponse.json({
      data: {
        capability: {
          id: capability.id,
          name: capability.name,
          description: capability.userDescription,
          complexity: capability.complexity,
          category: capability.category,
        },
        structural_templates: templates.map((t: any) => ({
          id: t.id,
          name: t.elementName,
          purpose: t.semanticMeaning,
          structure: t.structure,
        })),
        algorithms: algorithms.map((a: any) => ({
          id: a.id,
          name: a.name,
          purpose: a.purpose,
          pseudocode: a.pseudocode,
        })),
      },
    });
  } catch (error) {
    logger.errorWithStack('Failed to get capability bundle', error as Error);
    timer.end();
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch capability bundle',
      },
      { status: 500 }
    );
  }
}
