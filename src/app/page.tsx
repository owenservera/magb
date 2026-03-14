// src/app/page.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { VitalityGauge } from '@/components/vitality/VitalityGauge';
import { Skeleton } from '@/components/common/Skeleton';
import { Compass, Hammer, Bot, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['statistics'],
    queryFn: () => api.meta.statistics(),
  });

  const { data: vitality, isLoading: vitalityLoading } = useQuery({
    queryKey: ['vitality'],
    queryFn: () => api.vitality.overview(),
  });

  const { data: recentDrift } = useQuery({
    queryKey: ['drift', 'recent'],
    queryFn: () => api.vitality.driftEvents({ limit: 5 }),
  });

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Hero Search */}
      <section className="text-center py-12">
        <h1 className="text-4xl font-bold mb-2">
          The Universal Knowledge Engine
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Complete generative knowledge for{' '}
          {statsLoading ? (
            <Skeleton className="inline-block w-20 h-6" />
          ) : (
            stats?.data?.targets_documented ?? '...'
          )}{' '}
          programming languages, file formats, and tools. Everything you need to build anything.
        </p>
        <GlobalSearch
          size="large"
          placeholder="Search algorithms, capabilities, formats... (⌘K)"
          autoFocus
        />
      </section>

      {/* Quick Action Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickActionCard
          icon={Compass}
          title="Explore"
          description="Browse targets, capabilities, and the knowledge graph"
          href="/explore"
          color="blue"
        />
        <QuickActionCard
          icon={Hammer}
          title="Build"
          description="Assemble knowledge for your implementation task"
          href="/build"
          color="green"
        />
        <QuickActionCard
          icon={Bot}
          title="AI Context"
          description="Generate optimal context for your AI coding assistant"
          href="/build/assemble"
          color="purple"
        />
      </section>

      {/* Stats Bar */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          label="Targets"
          value={statsLoading ? undefined : stats?.data?.targets_documented}
        />
        <StatCard
          label="Algorithms"
          value={statsLoading ? undefined : stats?.data?.nodes_algorithm?.total}
        />
        <StatCard
          label="Templates"
          value={statsLoading ? undefined : stats?.data?.nodes_structure?.total}
        />
        <StatCard
          label="Blueprints"
          value={statsLoading ? undefined : stats?.data?.nodes_blueprint?.total}
        />
        <div className="p-4 rounded-lg border bg-card flex flex-col items-center justify-center">
          {vitalityLoading ? (
            <Skeleton className="w-16 h-16 rounded-full" />
          ) : (
            <VitalityGauge
              score={vitality?.data?.overall_vitality}
              size="compact"
              label="Knowledge Health"
            />
          )}
        </div>
      </section>

      {/* Featured Targets */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Documented Targets</h2>
          <Link
            href="/explore/targets"
            className="text-sm text-blue-500 hover:underline inline-flex items-center gap-1"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <TargetGrid limit={12} />
      </section>

      {/* Recent Drift Events */}
      {recentDrift?.data?.length ? (
        <section>
          <h2 className="text-2xl font-semibold mb-4">
            Recent Knowledge Updates
          </h2>
          <div className="space-y-2">
            {recentDrift.data.map((event) => (
              <DriftEventCard key={event.event_id} event={event} compact />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function QuickActionCard({
  icon: Icon,
  title,
  description,
  href,
  color,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  color: 'blue' | 'green' | 'purple';
}) {
  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950 dark:hover:bg-blue-900',
    green: 'border-green-200 bg-green-50 hover:bg-green-100 dark:border-green-800 dark:bg-green-950 dark:hover:bg-green-900',
    purple: 'border-purple-200 bg-purple-50 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950 dark:hover:bg-purple-900',
  };

  return (
    <Link
      href={href}
      className={`block p-6 rounded-lg border transition ${colorClasses[color]}`}
    >
      <Icon className="h-8 w-8 mb-3" />
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </Link>
  );
}

function StatCard({ label, value }: { label: string; value?: number }) {
  return (
    <div className="p-4 rounded-lg border bg-card text-center">
      <div className="text-2xl font-bold">
        {value?.toLocaleString() ?? '—'}
      </div>
      <div className="text-xs text-muted-foreground uppercase tracking-wide">
        {label}
      </div>
    </div>
  );
}

function TargetGrid({ limit = 12 }: { limit?: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ['targets', 'featured'],
    queryFn: () => api.targets.list({ limit }),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: limit }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {data?.data?.map((target) => (
        <Link
          key={target.id}
          href={`/explore/targets/${target.id}`}
          className="p-4 rounded-lg border bg-card hover:bg-muted transition text-center"
        >
          <div className="text-2xl mb-2">
            {target.kind === 'programming_language' ? '📝' : '📦'}
          </div>
          <div className="font-medium text-sm truncate">{target.name}</div>
          <div className="text-xs text-muted-foreground">
            {target.capability_count} capabilities
          </div>
        </Link>
      ))}
    </div>
  );
}

function DriftEventCard({
  event,
  compact,
}: {
  event: {
    event_id: string;
    severity: string;
    title: string;
    affected_nodes: number;
    created_at: string;
  };
  compact?: boolean;
}) {
  const severityIcons: Record<string, string> = {
    low: '📝',
    medium: '⚠️',
    high: '🚨',
    critical: '🔴',
  };

  const date = new Date(event.created_at);
  const daysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border-l-2 border-l-blue-500 bg-blue-50 dark:bg-blue-950">
      <span className="text-lg">{severityIcons[event.severity] || '📝'}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{event.title}</p>
        <p className="text-xs text-muted-foreground">
          {event.affected_nodes.toLocaleString()} nodes affected • {daysAgo}d ago
        </p>
      </div>
    </div>
  );
}
