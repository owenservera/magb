// src/app/health/page.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { VitalityGauge } from '@/components/vitality/VitalityGauge';
import { HealthHeatmap } from '@/components/vitality/HealthHeatmap';
import { DriftEventCard } from '@/components/vitality/DriftEventCard';
import { HealingQueueView } from '@/components/vitality/HealingQueueView';
import { Skeleton } from '@/components/common/Skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/common/Tabs';
import { RefreshCw } from 'lucide-react';

export default function HealthDashboard() {
  const { data: vitality, isLoading: vitalityLoading, refetch } = useQuery({
    queryKey: ['vitality', 'overview'],
    queryFn: () => api.vitality.overview(),
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: driftEvents } = useQuery({
    queryKey: ['drift-events'],
    queryFn: () => api.vitality.driftEvents({ limit: 20 }),
  });

  const v = vitality?.data;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Knowledge Vitality</h1>
          <p className="text-muted-foreground">
            Real-time health of the knowledge base across freshness, correctness, and completeness.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 rounded-lg border hover:bg-muted transition"
          title="Refresh"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {/* Top-level Gauges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {vitalityLoading ? (
          <>
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
          </>
        ) : (
          <>
            <VitalityGauge
              score={v?.overall_vitality}
              label="Overall Vitality"
              size="large"
            />
            <VitalityGauge
              score={v?.freshness}
              label="Freshness"
              size="large"
              color="blue"
              description="How current is the knowledge?"
            />
            <VitalityGauge
              score={v?.correctness}
              label="Correctness"
              size="large"
              color="green"
              description="How accurate is the knowledge?"
            />
            <VitalityGauge
              score={v?.completeness}
              label="Completeness"
              size="large"
              color="purple"
              description="How much do we cover?"
            />
          </>
        )}
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="drift">Drift Events</TabsTrigger>
          <TabsTrigger value="healing">Healing Queue</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Node Distribution */}
            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">
                Node Health Distribution
              </h3>
              {vitalityLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-8 rounded" />
                  <Skeleton className="h-8 rounded" />
                  <Skeleton className="h-8 rounded" />
                </div>
              ) : (
                <div className="space-y-3">
                  <DistributionBar
                    label="Healthy"
                    count={v?.healthy_nodes}
                    total={v?.total_nodes}
                    color="bg-green-500"
                  />
                  <DistributionBar
                    label="Warning"
                    count={
                      (v?.total_nodes || 0) -
                      (v?.healthy_nodes || 0) -
                      (v?.critical_nodes || 0)
                    }
                    total={v?.total_nodes}
                    color="bg-yellow-500"
                  />
                  <DistributionBar
                    label="Critical"
                    count={v?.critical_nodes}
                    total={v?.total_nodes}
                    color="bg-red-500"
                  />
                </div>
              )}
              <div className="mt-4 text-sm text-muted-foreground">
                Total nodes:{' '}
                {vitalityLoading ? (
                  <Skeleton className="inline-block w-16 h-4" />
                ) : (
                  v?.total_nodes?.toLocaleString()
                )}
              </div>
            </div>

            {/* Recent Drift Events */}
            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">
                Unresolved Drift Events
              </h3>
              <div className="space-y-2">
                {driftEvents?.data?.slice(0, 5).map((event) => (
                  <DriftEventCard key={event.event_id} event={event} compact />
                ))}
                {(!driftEvents?.data || driftEvents.data.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="text-3xl mb-2">✅</div>
                    <p>No unresolved drift events</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Health Heatmap */}
          <div className="border rounded-lg p-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">
              Target Health Heatmap
            </h3>
            <HealthHeatmap />
          </div>
        </TabsContent>

        <TabsContent value="drift" className="mt-6">
          <div className="space-y-4">
            {driftEvents?.data?.map((event) => (
              <DriftEventCard key={event.event_id} event={event} />
            ))}
            {(!driftEvents?.data || driftEvents.data.length === 0) && (
              <EmptyState
                title="No drift events"
                description="All knowledge is up to date!"
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="healing" className="mt-6">
          <HealingQueueView />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DistributionBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count?: number;
  total?: number;
  color: string;
}) {
  const pct = total && total > 0 ? (count || 0) / total * 100 : 0;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {count?.toLocaleString() ?? 0} ({pct.toFixed(1)}%)
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="text-center py-12">
      <div className="text-4xl mb-4">📭</div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
