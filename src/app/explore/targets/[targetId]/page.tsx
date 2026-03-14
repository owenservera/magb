// src/app/explore/targets/[targetId]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/common/Tabs';
import { CapabilityTree } from '@/components/knowledge/CapabilityTree';
import { VitalityBadge } from '@/components/vitality/VitalityBadge';
import { BundlePanel } from '@/components/knowledge/BundlePanel';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { SendToAIButton } from '@/components/ai/SendToAIButton';
import { ArrowLeft, FileCode, GitGraph, Heart } from 'lucide-react';

export default function TargetDetail() {
  const { targetId } = useParams();
  const [activeTab, setActiveTab] = useState('capabilities');
  const [selectedCapId, setSelectedCapId] = useState<string | null>(null);

  const { data: target, isLoading } = useQuery({
    queryKey: ['target', targetId],
    queryFn: () => api.targets.get(targetId as string),
  });

  if (isLoading) return <TargetDetailSkeleton />;
  if (!target?.data) return <NotFound />;

  const { data: content } = target;
  const info = content;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Back link */}
      <Link
        href="/explore/targets"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to targets
      </Link>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <TargetIcon kind={info.kind} size={48} />
              <div>
                <h1 className="text-3xl font-bold">{content.name}</h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-sm text-muted-foreground capitalize">
                    {info.kind?.replace('_', ' ')}
                  </span>
                  {info.version && (
                    <span className="text-sm px-2 py-0.5 bg-muted rounded">
                      v{info.version}
                    </span>
                  )}
                  <VitalityBadge score={content.vitality?.overall} showLabel />
                </div>
              </div>
            </div>

            {/* Quick facts */}
            <div className="flex gap-4 mt-4 text-sm text-muted-foreground flex-wrap">
              <span>{content.capability_count} capabilities</span>
              {info.extensions?.length ? (
                <span>Extensions: {info.extensions.join(', ')}</span>
              ) : null}
              {info.media_types?.length ? (
                <span>MIME: {info.media_types[0]}</span>
              ) : null}
            </div>
          </div>

          <div className="flex gap-2">
            <SendToAIButton
              context={{ type: 'target', id: targetId as string }}
              label="Get AI System Prompt"
            />
            <Link
              href={`/build/assemble?target=${targetId}`}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
            >
              Build with {content.name}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="capabilities">
            Capabilities ({content.capability_count})
          </TabsTrigger>
          <TabsTrigger value="start-here">Start Here</TabsTrigger>
          <TabsTrigger value="graph">Knowledge Graph</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
        </TabsList>

        <TabsContent value="capabilities" className="mt-6">
          <CapabilityTreePanel
            targetId={targetId as string}
            capabilities={content.capabilities || []}
            selectedCapId={selectedCapId}
            onSelect={setSelectedCapId}
          />
        </TabsContent>

        <TabsContent value="start-here" className="mt-6">
          <StartHerePanel targetId={targetId as string} />
        </TabsContent>

        <TabsContent value="graph" className="mt-6">
          <div className="h-[600px] border rounded-lg overflow-hidden flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <GitGraph className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Knowledge graph visualization</p>
              <p className="text-sm mt-1">Coming soon</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="health" className="mt-6">
          <TargetHealthPanel targetId={targetId as string} vitality={content.vitality} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TargetDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-32 rounded-lg" />
      <Skeleton className="h-10 rounded-lg" />
      <Skeleton className="h-96 rounded-lg" />
    </div>
  );
}

function NotFound() {
  return (
    <EmptyState
      icon={null}
      title="Target not found"
      description="The requested target does not exist or has been removed."
      action={
        <Link
          href="/explore/targets"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
        >
          Browse all targets
        </Link>
      }
    />
  );
}

function TargetIcon({ kind, size = 32 }: { kind?: string; size?: number }) {
  const icons: Record<string, string> = {
    file_format: '📦',
    programming_language: '📝',
    protocol: '🔌',
    api: '🔗',
    tool: '🔧',
  };

  return (
    <div
      className="flex items-center justify-center rounded-lg bg-muted"
      style={{ width: size, height: size }}
    >
      <span style={{ fontSize: size * 0.6 }}>
        {icons[kind || 'file_format'] || '📄'}
      </span>
    </div>
  );
}

function CapabilityTreePanel({
  targetId,
  capabilities,
  selectedCapId,
  onSelect,
}: {
  targetId: string;
  capabilities: unknown[];
  selectedCapId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Tree */}
      <div className="lg:col-span-1">
        <div className="sticky top-4">
          <CapabilityTree
            capabilities={capabilities}
            selectedId={selectedCapId}
            onSelect={onSelect}
          />
        </div>
      </div>

      {/* Right: Selected Capability Bundle */}
      <div className="lg:col-span-2">
        {selectedCapId ? (
          <BundlePanel targetId={targetId} capabilityId={selectedCapId} />
        ) : (
          <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg text-muted-foreground">
            <div className="text-center">
              <FileCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-1">Select a capability</p>
              <p className="text-sm">
                Click any capability in the tree to see its templates, algorithms, and code
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StartHerePanel({ targetId }: { targetId: string }) {
  const { data: minimalFile } = useQuery({
    queryKey: ['minimal-file', targetId],
    queryFn: () => api.targets.minimalFile(targetId),
  });

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold mb-4">
          Quick Start: Your First File
        </h3>
        <p className="text-muted-foreground mb-6">
          Start with the smallest valid file. This code produces a file that
          opens without errors in standard software. Build from here.
        </p>
        {minimalFile?.data ? (
          <div className="border rounded-lg p-4 bg-card">
            <pre className="text-sm overflow-x-auto">
              <code>{JSON.stringify(minimalFile.data, null, 2)}</code>
            </pre>
          </div>
        ) : (
          <Skeleton className="h-64 rounded-lg" />
        )}
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4">What To Build Next</h3>
        <p className="text-muted-foreground mb-4">
          After generating a minimal file, add capabilities one at a time.
          Each capability page gives you exact templates and code.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SuggestedNextStep
            title="Add basic content"
            description="Text, shapes, or data depending on format type"
            complexity="basic"
          />
          <SuggestedNextStep
            title="Apply styling"
            description="Colors, fonts, borders, effects"
            complexity="intermediate"
          />
          <SuggestedNextStep
            title="Position elements"
            description="Use the coordinate system reference"
            complexity="intermediate"
          />
          <SuggestedNextStep
            title="Build a generator"
            description="See blueprints for full application architectures"
            complexity="advanced"
          />
        </div>
      </div>
    </div>
  );
}

function SuggestedNextStep({
  title,
  description,
  complexity,
}: {
  title: string;
  description: string;
  complexity: string;
}) {
  return (
    <div className="p-4 border rounded-lg bg-card">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium">{title}</h4>
        <span className="text-xs px-2 py-0.5 rounded-full bg-muted capitalize">
          {complexity}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function TargetHealthPanel({
  targetId,
  vitality,
}: {
  targetId: string;
  vitality?: { overall?: number; freshness?: number; correctness?: number; completeness?: number };
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <HealthStatCard
          label="Overall"
          score={vitality?.overall}
          color="primary"
        />
        <HealthStatCard
          label="Freshness"
          score={vitality?.freshness}
          color="blue"
        />
        <HealthStatCard
          label="Correctness"
          score={vitality?.correctness}
          color="green"
        />
        <HealthStatCard
          label="Completeness"
          score={vitality?.completeness}
          color="purple"
        />
      </div>

      <div className="border rounded-lg p-6">
        <h4 className="font-semibold mb-4">Target Health Details</h4>
        <p className="text-sm text-muted-foreground">
          Health metrics for target: {targetId}
        </p>
        {/* More detailed health info would go here */}
      </div>
    </div>
  );
}

function HealthStatCard({
  label,
  score,
  color,
}: {
  label: string;
  score?: number;
  color: 'primary' | 'blue' | 'green' | 'purple';
}) {
  const colors = {
    primary: 'bg-primary',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
  };

  return (
    <div className="p-4 border rounded-lg bg-card text-center">
      <div className="flex items-center justify-center mb-2">
        <VitalityBadge score={score} size="large" />
      </div>
      <div className="text-sm font-medium">{label}</div>
      <div className="text-xs text-muted-foreground">
        {score != null ? `${Math.round(score * 100)}%` : 'N/A'}
      </div>
    </div>
  );
}
