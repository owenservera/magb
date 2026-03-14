// src/app/explore/targets/page.tsx
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { VitalityBadge } from '@/components/vitality/VitalityBadge';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Search, Filter } from 'lucide-react';

export default function TargetsPage() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const kindFilter = searchParams.get('kind') || '';

  const [localSearch, setLocalSearch] = useState(searchQuery);

  const { data, isLoading, error } = useQuery({
    queryKey: ['targets', { search: searchQuery, kind: kindFilter }],
    queryFn: () =>
      api.targets.list({
        search: searchQuery || undefined,
        kind: kindFilter || undefined,
        limit: 100,
      }),
  });

  const targets = data?.data || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Explore Targets</h1>
        <p className="text-muted-foreground">
          Browse documented programming languages, file formats, and tools
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                window.location.href = `/explore/targets?search=${encodeURIComponent(localSearch)}`;
              }
            }}
            placeholder="Search targets..."
            className="w-full rounded-lg border bg-background pl-10 pr-4 py-2 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
          />
        </div>
        <select
          value={kindFilter}
          onChange={(e) => {
            const kind = e.target.value;
            window.location.href = `/explore/targets${kind ? `?kind=${kind}` : ''}`;
          }}
          className="rounded-lg border bg-background px-4 py-2 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
        >
          <option value="">All Types</option>
          <option value="file_format">File Formats</option>
          <option value="programming_language">Programming Languages</option>
          <option value="protocol">Protocols</option>
          <option value="api">APIs</option>
          <option value="tool">Tools</option>
        </select>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          title="Error loading targets"
          description={(error as Error).message}
        />
      ) : targets.length === 0 ? (
        <EmptyState
          title="No targets found"
          description={
            searchQuery
              ? `No results for "${searchQuery}". Try a different search term.`
              : 'No targets available yet.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {targets.map((target) => (
            <TargetCard key={target.id} target={target} />
          ))}
        </div>
      )}
    </div>
  );
}

function TargetCard({
  target,
}: {
  target: {
    id: string;
    name: string;
    kind: string;
    description?: string;
    capability_count: number;
    vitality?: { overall?: number };
    extensions?: string[];
  };
}) {
  const kindIcons: Record<string, string> = {
    file_format: '📦',
    programming_language: '📝',
    protocol: '🔌',
    api: '🔗',
    tool: '🔧',
  };

  return (
    <Link
      href={`/explore/targets/${target.id}`}
      className="block p-4 rounded-lg border bg-card hover:bg-muted/50 hover:border-ring transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">
            {kindIcons[target.kind] || '📄'}
          </span>
          <div>
            <h3 className="font-semibold group-hover:text-primary transition-colors">
              {target.name}
            </h3>
            <p className="text-xs text-muted-foreground capitalize">
              {target.kind.replace('_', ' ')}
            </p>
          </div>
        </div>
        <VitalityBadge score={target.vitality?.overall} size="medium" />
      </div>

      {target.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {target.description}
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{target.capability_count} capabilities</span>
        {target.extensions?.length ? (
          <span className="truncate max-w-[150px]">
            {target.extensions.slice(0, 3).join(', ')}
            {target.extensions.length > 3 && '...'}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
