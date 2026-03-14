// src/app/api/v1/vitality/route.ts
import { NextResponse } from 'next/server';
import { UniversalKnowledgeStore } from '@/engine/store';
import { logger, startTimer } from '@/lib/logger';

interface VitalityQuery {
  target?: string;
}

export async function GET(request: Request) {
  const timer = startTimer('GET /api/v1/vitality');
  const { searchParams } = new URL(request.url);
  const query: VitalityQuery = Object.fromEntries(searchParams);
  
  try {
    const store = new UniversalKnowledgeStore();
    
    // Calculate vitality metrics
    const stats = await store.getStatistics();
    
    // Calculate freshness (based on lastGenerated timestamps)
    const targets = await store.db.target.findMany({
      select: {
        lastGenerated: true,
        generationStatus: true,
      },
    });
    
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const sevenDays = 7 * oneDay;
    
    let freshnessScore = 0;
    let completedTargets = 0;
    
    for (const target of targets) {
      if (target.generationStatus === 'COMPLETED') {
        completedTargets++;
        if (target.lastGenerated) {
          const age = now - target.lastGenerated.getTime();
          if (age < oneDay) freshnessScore += 1.0;
          else if (age < sevenDays) freshnessScore += 0.7;
          else freshnessScore += 0.3;
        }
      }
    }
    
    const avgFreshness = completedTargets > 0 ? freshnessScore / completedTargets : 0;
    
    // Calculate completeness (ratio of expected vs actual content)
    const expectedEntriesPerTarget = 100; // Baseline expectation
    const actualEntries = stats.total_entries || 0;
    const expectedEntries = stats.targets_documented * expectedEntriesPerTarget;
    const completeness = expectedEntries > 0 ? Math.min(1, actualEntries / expectedEntries) : 0;
    
    // Calculate correctness (based on validation confidence)
    const entries = await store.db.entry.findMany({
      select: {
        confidence: true,
      },
      take: 1000,
    });
    
    const avgConfidence = entries.length > 0
      ? entries.reduce((sum, e) => sum + e.confidence, 0) / entries.length
      : 0;
    
    // Overall vitality is weighted average
    const overallVitality = (avgFreshness * 0.3 + completeness * 0.4 + avgConfidence * 0.3);
    
    await store.disconnect();
    
    timer.end();
    
    return NextResponse.json({
      data: {
        overall_vitality: Math.round(overallVitality * 100),
        freshness: Math.round(avgFreshness * 100),
        correctness: Math.round(avgConfidence * 100),
        completeness: Math.round(completeness * 100),
        healthy_nodes: Math.round((stats.total_entries || 0) * overallVitality),
        critical_nodes: Math.round((stats.total_entries || 0) * (1 - overallVitality)),
        total_nodes: stats.total_entries || 0,
      },
      meta: {
        timestamp: new Date().toISOString(),
        target: query.target || 'all',
      },
    });
  } catch (error) {
    logger.errorWithStack('Failed to get vitality metrics', error as Error);
    timer.end();
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch vitality metrics',
      },
      { status: 500 }
    );
  }
}
