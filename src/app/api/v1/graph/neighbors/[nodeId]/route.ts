// src/app/api/v1/graph/neighbors/[nodeId]/route.ts
import { NextResponse } from 'next/server';
import { UniversalKnowledgeStore } from '@/engine/store';
import { logger, startTimer } from '@/lib/logger';

interface NeighborsQuery {
  relationship?: string;
  direction?: 'outgoing' | 'incoming' | 'both';
  depth?: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ nodeId: string }> }
) {
  const timer = startTimer('GET /api/v1/graph/neighbors/[nodeId]');
  const { nodeId } = await params;
  const { searchParams } = new URL(request.url);
  const query: NeighborsQuery = Object.fromEntries(searchParams);
  
  try {
    const store = new UniversalKnowledgeStore();
    
    const direction = (query.direction as any) || 'outgoing';
    const relationship = query.relationship;
    
    const neighbors = await store.getNeighbors(
      nodeId,
      'entry', // Default type, could be made dynamic
      relationship,
      direction
    );
    
    await store.disconnect();
    
    // Build graph data
    const nodes = new Map<string, any>();
    const edges: any[] = [];
    
    // Add source node
    nodes.set(nodeId, {
      id: nodeId,
      type: 'entry',
      name: nodeId,
    });
    
    // Process relations
    for (const relation of neighbors as any[]) {
      const sourceId = relation.sourceId;
      const targetId = relation.relTargetId;
      
      if (!nodes.has(sourceId)) {
        nodes.set(sourceId, {
          id: sourceId,
          type: relation.sourceType,
          name: sourceId,
        });
      }
      
      if (!nodes.has(targetId)) {
        nodes.set(targetId, {
          id: targetId,
          type: relation.relTargetType,
          name: targetId,
        });
      }
      
      edges.push({
        source: sourceId,
        target: targetId,
        relationship: relation.relationType,
      });
    }
    
    timer.end();
    
    return NextResponse.json({
      data: {
        nodes: Array.from(nodes.values()),
        edges,
      },
    });
  } catch (error) {
    logger.errorWithStack('Failed to get graph neighbors', error as Error);
    timer.end();
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch graph data',
      },
      { status: 500 }
    );
  }
}
