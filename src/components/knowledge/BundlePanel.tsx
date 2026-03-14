// src/components/knowledge/BundlePanel.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api-client';
import { CodeBlock } from '@/components/code/CodeBlock';
import { AlgorithmView } from './AlgorithmView';
import { VitalityBadge } from '@/components/vitality/VitalityBadge';
import { SendToAIButton } from '@/components/ai/SendToAIButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/common/Tabs';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { CopyButton } from '@/components/code/CopyButton';
import type { CapabilityBundle } from '@/types';

interface BundlePanelProps {
  targetId: string;
  capabilityId: string;
}

export function BundlePanel({ targetId, capabilityId }: BundlePanelProps) {
  const [language, setLanguage] = useState('python');

  const { data: bundle, isLoading, error } = useQuery({
    queryKey: ['bundle', capabilityId, language],
    queryFn: () => api.capabilities.bundle(capabilityId, {
      implementation_language: language,
      include_prerequisites: true,
      include_edge_cases: true,
    }),
  });

  if (isLoading) return <BundleSkeleton />;
  if (error) return <ErrorDisplay error={error} />;
  if (!bundle?.data) return null;

  const { capability, structural_templates, algorithms,
          coordinate_system, composition_rules, prerequisites } = bundle.data;

  return (
    <div className="space-y-6">
      {/* Capability Header */}
      <div className="border rounded-lg p-6 bg-card">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-1">
              {capability.content?.name || capability.name}
            </h2>
            <p className="text-muted-foreground">
              {capability.content?.description}
            </p>

            {/* Prerequisites */}
            {prerequisites?.length > 0 && (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="text-xs text-muted-foreground">Requires:</span>
                {prerequisites.map(p => (
                  <a
                    key={p.id}
                    href={`/explore/targets/${targetId}/capabilities/${encodeURIComponent(p.id)}`}
                    className="text-xs px-2 py-0.5 bg-muted rounded hover:bg-muted/80 transition"
                  >
                    {p.name}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Language selector */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="text-sm border rounded px-2 py-1 bg-background"
            >
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="rust">Rust</option>
              <option value="go">Go</option>
              <option value="c">C</option>
              <option value="java">Java</option>
            </select>

            <SendToAIButton
              context={{
                type: 'capability_bundle',
                id: capabilityId,
                language,
              }}
            />
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex gap-6 mt-4 pt-4 border-t text-sm flex-wrap">
          <div>
            <span className="text-muted-foreground">Templates: </span>
            <span className="font-medium">{structural_templates.length}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Algorithms: </span>
            <span className="font-medium">{algorithms.length}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Complexity: </span>
            <ComplexityBadge level={capability.content?.complexity} />
          </div>
          <VitalityBadge score={capability.vitality?.overall} showLabel />
        </div>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">
            Templates ({structural_templates.length})
          </TabsTrigger>
          <TabsTrigger value="algorithms">
            Algorithms ({algorithms.length})
          </TabsTrigger>
          {coordinate_system && (
            <TabsTrigger value="coordinates">
              Coordinates
            </TabsTrigger>
          )}
          {composition_rules.length > 0 && (
            <TabsTrigger value="composition">
              Composition Rules ({composition_rules.length})
            </TabsTrigger>
          )}
          <TabsTrigger value="all-code">
            All Code
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-4 space-y-4">
          {structural_templates.map((template, i) => (
            <StructureTemplate
              key={template.id || i}
              template={template}
              language={language}
            />
          ))}
          {structural_templates.length === 0 && (
            <EmptyState message="No structural templates available for this capability." />
          )}
        </TabsContent>

        <TabsContent value="algorithms" className="mt-4 space-y-6">
          {algorithms.map((algo, i) => (
            <AlgorithmView
              key={algo.id || i}
              algorithm={algo}
              preferredLanguage={language}
            />
          ))}
          {algorithms.length === 0 && (
            <EmptyState message="No algorithms required for this capability." />
          )}
        </TabsContent>

        <TabsContent value="coordinates" className="mt-4">
          {coordinate_system && (
            <CoordinateReference data={coordinate_system} compact />
          )}
        </TabsContent>

        <TabsContent value="composition" className="mt-4 space-y-3">
          {composition_rules.map((rule, i) => (
            <CompositionRuleCard key={i} rule={rule} />
          ))}
        </TabsContent>

        <TabsContent value="all-code" className="mt-4">
          <AllCodeView
            templates={structural_templates}
            algorithms={algorithms}
            language={language}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BundleSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-40 rounded-lg" />
      <Skeleton className="h-10 rounded-lg" />
      <Skeleton className="h-64 rounded-lg" />
    </div>
  );
}

function ErrorDisplay({ error }: { error: Error }) {
  return (
    <div className="p-6 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
      <h3 className="font-semibold text-red-800 dark:text-red-200">Error loading bundle</h3>
      <p className="text-sm text-red-600 dark:text-red-300 mt-1">{error.message}</p>
    </div>
  );
}

function ComplexityBadge({ level }: { level?: string }) {
  const colors: Record<string, string> = {
    trivial: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    basic: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    intermediate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    advanced: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    expert: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[level || 'basic']}`}>
      {level || 'unknown'}
    </span>
  );
}

function StructureTemplate({ template, language }: { template: unknown; language: string }) {
  const t = template as { id?: string; name?: string; content?: { purpose?: string; template?: string; assembly_code?: { code: string; language: string } } };
  
  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-semibold">{t.name || t.content?.purpose || 'Template'}</h4>
          {t.content?.purpose && t.name && (
            <p className="text-sm text-muted-foreground mt-1">{t.content.purpose}</p>
          )}
        </div>
        {t.content?.assembly_code && (
          <CopyButton text={t.content.assembly_code.code} variant="inline" />
        )}
      </div>
      {t.content?.assembly_code && (
        <CodeBlock
          code={t.content.assembly_code.code}
          language={t.content.assembly_code.language || language}
          compact
        />
      )}
    </div>
  );
}

function CoordinateReference({ data, compact }: { data: unknown; compact?: boolean }) {
  const coord = data as { name?: string; description?: string; units?: string; axes?: unknown[]; conversion_formulas?: unknown[] };
  
  return (
    <div className="border rounded-lg p-4 bg-card">
      <h4 className="font-semibold mb-2">{coord.name || 'Coordinate System'}</h4>
      {coord.description && <p className="text-sm text-muted-foreground mb-4">{coord.description}</p>}
      {coord.units && <p className="text-sm">Units: {coord.units}</p>}
    </div>
  );
}

function CompositionRuleCard({ rule }: { rule: unknown }) {
  const r = rule as { rule_type?: string; description?: string; correct_implementation?: string };
  
  return (
    <div className="border rounded-lg p-4 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-amber-600">⚠️</span>
        <span className="font-medium text-sm">
          {r.rule_type || 'Composition Rule'}
        </span>
      </div>
      <p className="text-sm">{r.description}</p>
      {r.correct_implementation && (
        <CodeBlock
          code={r.correct_implementation}
          language="python"
          className="mt-3"
          compact
        />
      )}
    </div>
  );
}

function AllCodeView({ templates, algorithms, language }: { templates: unknown[]; algorithms: unknown[]; language: string }) {
  // Concatenate all code from templates and algorithms into one copyable block
  const allCode: string[] = [];

  algorithms.forEach((algo: unknown) => {
    const a = algo as { name?: string; content?: { name?: string; implementations?: Record<string, { code: string }> }; preferred_implementation?: { code: string } };
    const impl = a.preferred_implementation || a.content?.implementations?.[language];
    if (impl?.code) {
      allCode.push(`# === ${a.name || a.content?.name || 'Algorithm'} ===`);
      allCode.push(impl.code);
      allCode.push('');
    }
  });

  templates.forEach((template: unknown) => {
    const t = template as { name?: string; content?: { purpose?: string; assembly_code?: { code: string } } };
    const assembly = t.content?.assembly_code;
    if (assembly?.code) {
      allCode.push(`# === Template: ${t.name || t.content?.purpose || 'Template'} ===`);
      allCode.push(assembly.code);
      allCode.push('');
    }
  });

  if (allCode.length === 0) {
    return <EmptyState message="No code implementations available." />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm text-muted-foreground">
          All code for this capability, combined into one block.
        </p>
        <CopyButton text={allCode.join('\n')} label="Copy all code" variant="inline" />
      </div>
      <CodeBlock
        code={allCode.join('\n')}
        language={language}
        maxHeight={600}
      />
    </div>
  );
}
