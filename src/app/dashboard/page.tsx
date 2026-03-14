// src/app/dashboard/page.tsx
'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/common/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/common/Card';

export default function DashboardPage() {
  const [generationStats, setGenerationStats] = useState<any>(null);
  const [apiUsageStats, setApiUsageStats] = useState<any>(null);
  const [recentRuns, setRecentRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch generation statistics
      const [genRes, usageRes, runsRes] = await Promise.all([
        fetch('/api/v1/meta/statistics'),
        fetch('/api/v1/meta/statistics'), // In a real app, there might be a specific API usage endpoint
        fetch('/api/v1/petitions') // Using petitions as a proxy for recent activity
      ]);
      
      if (!genRes.ok) throw new Error('Failed to fetch generation statistics');
      if (!usageRes.ok) throw new Error('Failed to fetch API usage statistics');
      if (!runsRes.ok) throw new Error('Failed to fetch recent runs');
      
      const genData = await genRes.json();
      const usageData = await usageRes.json();
      const runsData = await runsRes.json();
      
      setGenerationStats(genData);
      setApiUsageStats(usageData);
      setRecentRuns(Array.isArray(runsData) ? runsData.slice(0, 5) : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="p-4 bg-destructive/10 text-destructive rounded">
            <p>{error}</p>
            <Button
              variant="outline"
              onClick={loadDashboardData}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">User Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your knowledge generation activity and API usage
          </p>
        </div>

        <div className="grid gap-6 mb-8">
          {/* Generation Statistics Card */}
          <Card className="p-6">
            <CardHeader className="mb-4">
              <h2 className="text-xl font-semibold">Generation Statistics</h2>
              <p className="text-muted-foreground">
                Overview of your knowledge generation runs
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                {generationStats ? (
                  <>
                    <div className="text-2xl font-bold">{generationStats.targets_documented || 0}</div>
                    <p className="text-sm text-muted-foreground">Targets Documented</p>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold">-</div>
                    <p className="text-sm text-muted-foreground">Targets Documented</p>
                  </>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Total API Calls</p>
                  <p className="text-muted-foreground">
                    {generationStats?.nodes_algorithm?.total || 0} +
                    {generationStats?.nodes_structure?.total || 0} +
                    {generationStats?.nodes_blueprint?.total || 0}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Estimated Cost</p>
                  <p className="text-muted-foreground">$0.00</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Usage Card */}
          <Card className="p-6">
            <CardHeader className="mb-4">
              <h2 className="text-xl font-semibold">API Usage</h2>
              <p className="text-muted-foreground">
                Monitor your API consumption and rate limits
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Current Hour</span>
                  <span className="font-mono text-lg">0/1000</span>
                </div>
                <div className="w-0 h-0.5 bg-primary/20">
                  <div className="h-full w-1/4 bg-primary"></div>
                </div>
                <div className="text-xs text-muted-foreground">
                  25% of hourly quota used
                </div>
              </div>
              
              <div className="space-y-2 mt-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Today</span>
                  <span className="font-mono text-lg">0/10000</span>
                </div>
                <div className="w-0 h-0.5 bg-primary/20">
                  <div className="h-full w-1/10 bg-primary"></div>
                </div>
                <div className="text-xs text-muted-foreground">
                  1% of daily quota used
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold">Recent Activity</h2>
          <p className="text-muted-foreground mb-4">
            Your latest knowledge generation requests and petitions
          </p>
          
          {recentRuns.length > 0 ? (
            <div className="space-y-4">
              {recentRuns.map((run) => (
                <div key={run.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{run.userQuery || 'Knowledge Request'}</h3>
                    <span className="px-2 py-0.5 text-xs rounded 
                      {run.status === 'FULFILLED' ? 'bg-success/10 text-success' :
                       run.status === 'IN_PROGRESS' ? 'bg-warning/10 text-warning' :
                       run.status === 'REJECTED' ? 'bg-destructive/10 text-destructive' :
                       'bg-muted/10 text-muted-foreground'}">
                      {run.status}
                    </span>
                  </div>
                  {run.context && (
                    <p className="text-sm text-muted-foreground mb-2">{run.context}</p>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Submitted {new Date(run.createdAt).toLocaleDateString()} by{' '}
                    {run.userId || 'Anonymous'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No recent activity yet. Submit your first petition to get started!</p>
              <Link
                href="/petitions?tab=submit"
                className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded"
              >
                Submit Petition
              </Link>
            </div>
          )}
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-semibold">Quick Actions</h2>
          <p className="text-muted-foreground mb-4">
            Common actions to help you get the most out of magB
          </p>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/generate/new"
              className="group p-6 border rounded-lg hover:border-primary/50 transition-border"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="font-semibold">Generate New Knowledge</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Start a new knowledge generation run
                </p>
              </div>
            </Link>
            
            <Link
              href="/database"
              className="group p-6 border rounded-lg hover:border-primary/50 transition-border"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5h7a2 2 0 012 2v12a2 2 0 01-2 2H9a2 2 0 01-2-2V7a2 2 0 012-2z" />
                  </svg>
                </div>
                <h3 className="font-semibold">Explore Database</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Browse existing knowledge entries
                </p>
              </div>
            </Link>
            
            <Link
              href="/petitions?tab=submit"
              className="group p-6 border rounded-lg hover:border-primary/50 transition-border"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2zm0-8c1.105 0 2 .895 2 2s-.895 2-2 2-2-.895-2-2 .895-2 2-2z" />
                  </svg>
                </div>
                <h3 className="font-semibold">Submit Knowledge Request</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Request specific knowledge to be generated
                </p>
              </div>
            </Link>
            
            <Link
              href="/contribute"
              className="group p-6 border rounded-lg hover:border-primary/50 transition-border"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.005 8.005 0 01-14.468-3.74m0 0A8.005 8.005 0 003.532 17.642m11.303 4.329a2 2 0 011.466 0m0 0V16m0-2h2.332l4.665 2.333a2 2 0 002 1.654V5.5a2 2 0 00-2-1.654l-4.665-2.333H19" />
                  </svg>
                </div>
                <h3 className="font-semibold">Contribute Knowledge</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Share your expertise and earn rewards
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}