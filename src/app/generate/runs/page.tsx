// src/app/generate/runs/page.tsx
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from '@/components/common/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/common/Card';
import { Skeleton } from '@/components/common/Skeleton';
import { api } from '@/lib/api-client';
import type { GenerationRun } from '@/types';

export default function GenerateRunsPage() {
  const [runs, setRuns] = useState<GenerationRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchRuns = async () => {
      if (!isMounted) return;
      setIsLoading(true);
      setError(null);
      try {
        // For now, we'll fetch an empty array since the runs endpoint doesn't exist yet
        // In a full implementation, this would be: await api.generate.getRuns();
        setRuns([]);
      } catch (err: any) {
        if (!isMounted) return;
        setError(err?.message || 'Failed to fetch runs');
        setRuns([]);
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    };

    fetchRuns();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <h1 className="text-3xl font-bold">Generation Runs</h1>
        <div className="flex gap-4">
          <Link
            href="/generate/new"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm font-medium"
          >
            New Generation
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={`run-list-${index}`} className="h-16" />
          ))}
        </div>
      ) : error ? (
        <div className="p-4 bg-destructive/10 text-destructive rounded">
          <p className="text-sm">{error}</p>
        </div>
      ) : runs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No generation runs found</p>
          <Link href="/generate/new" className="mt-4 inline-block text-primary hover:underline">
            Start your first generation
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {runs.map((run) => (
            <Card key={run.id} className="border-l-4 border-l-primary hover:bg-muted/50 transition">
              <CardContent className="space-y-3 p-6 cursor-pointer"
                onClick={() => {
                  // Navigate to run detail
                  // We'll use router.push but need to import useRouter
                  // For now, we'll just simulate with a link wrapper
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{run.targetId}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      Target: {run.targetId}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span className="px-2 py-0.5 rounded 
                      {run.status === 'RUNNING' ? 'bg-primary/20 text-primary' :
                       run.status === 'COMPLETED' ? 'bg-green-200 text-green-800' :
                       run.status === 'FAILED' ? 'bg-destructive/20 text-destructive' :
                       run.status === 'CANCELLED' ? 'bg-yellow-200 text-yellow-800' :
                       'bg-muted/50'}
                    ">
                      {run.status}
                    </span>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  {run.startedAt && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs">Started:</span>
                      <span className="font-mono">{new Date(run.startedAt).toLocaleString()}</span>
                    </div>
                  )}
                  {run.completedAt && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs">Completed:</span>
                      <span className="font-mono">{new Date(run.completedAt).toLocaleString()}</span>
                    </div>
                  )}
                  {run.totalCostUsd !== undefined && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs">Cost:</span>
                      <span className="font-mono">$${run.totalCostUsd.toFixed(2)}</span>
                    </div>
                  )}
                  {run.totalApiCalls !== undefined && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs">API Calls:</span>
                      <span className="font-mono">{run.totalApiCalls.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}