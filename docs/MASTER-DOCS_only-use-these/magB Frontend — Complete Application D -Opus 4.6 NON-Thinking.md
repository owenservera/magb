

# magB Platform Frontend Architecture

---

## The Core Interface Problem

Before designing screens, I need to think about who uses this platform and what they're actually doing moment to moment.

There are three fundamentally different modes of engagement:

```
EXPLORER                          BUILDER                         OPERATOR
─────────                         ───────                         ────────
"What's in this database?         "I need to build something      "Is the knowledge
 What can PPTX do?                 with PNG files right now.       base healthy?
 How does this compare             Give me templates, code,        What's drifting?
 to DOCX?"                        and algorithms."                What needs healing?"

Browsing, learning,               Task-focused, urgent,           Monitoring, maintaining,
discovering connections.           needs actionable output.        curating quality.

TIME SPENT: Minutes               TIME SPENT: Hours               TIME SPENT: Daily check-ins
to hours of exploration           deep in one capability          5-10 minute scans
```

The platform needs to serve all three without making any one feel like they're using someone else's tool.

---

## The Design Philosophy

```
PRINCIPLE 1: KNOWLEDGE IS SPATIAL
─────────────────────────────────
Knowledge has shape, proximity, and depth.
Related things should be visually near each other.
The graph isn't just a data structure — it IS the interface.

PRINCIPLE 2: PROGRESSIVE DISCLOSURE
────────────────────────────────────
Show the map first. Let users zoom in.
Never overwhelm. Always let them go deeper.
Summary → Details → Code → Edge Cases

PRINCIPLE 3: COPY-PASTE IS A FEATURE
─────────────────────────────────────
Every code block, every template, every algorithm
has a one-click copy. Every bundle can be downloaded
as a self-contained file. The fastest path from
"I found what I need" to "it's in my project" must
be frictionless.

PRINCIPLE 4: AI-FIRST, HUMAN-READABLE
──────────────────────────────────────
Every view has a "Send to AI" button that assembles
the visible context into an optimal LLM prompt.
But the same content reads beautifully for humans.

PRINCIPLE 5: VITALITY IS VISIBLE
────────────────────────────────
Health isn't hidden in an admin panel.
Every piece of knowledge shows its age,
its confidence, its freshness — like
patina on copper. Users learn to trust
what's bright and question what's faded.
```

---

## Application Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    magB PLATFORM FRONTEND                    │
│                                                             │
│  Framework: Next.js 14+ (App Router)                        │
│  Language:  TypeScript                                      │
│  Styling:   Tailwind CSS + Radix UI primitives              │
│  State:     Zustand (client) + React Query (server)         │
│  Graph Viz: D3.js + custom WebGL renderer                   │
│  Code:      Monaco Editor (syntax highlighting)             │
│  Search:    Instant search with debounced API calls         │
│  Auth:      API key based (simple) / OAuth (future)         │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │  EXPLORE │ │  BUILD   │ │  HEALTH  │ │  CONTRIBUTE  │  │
│  │  mode    │ │  mode    │ │  mode    │ │  mode        │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
│       │            │            │              │            │
│       ▼            ▼            ▼              ▼            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              SHARED COMPONENT LIBRARY                │   │
│  │                                                     │   │
│  │  KnowledgeCard · CodeBlock · VitalityBadge ·        │   │
│  │  GraphViewer · SearchBar · BundlePanel ·            │   │
│  │  CapabilityTree · AlgorithmView · TemplateView ·    │   │
│  │  BlueprintDiagram · DiffViewer · ContextAssembler   │   │
│  └─────────────────────────────────────────────────────┘   │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              API CLIENT LAYER                        │   │
│  │                                                     │   │
│  │  React Query hooks wrapping the Knowledge Engine    │   │
│  │  API. Handles caching, pagination, optimistic       │   │
│  │  updates, and offline capability.                   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
magb-platform/
│
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
│
├── src/
│   ├── app/                              # Next.js App Router
│   │   ├── layout.tsx                    # Root layout (nav, sidebar)
│   │   ├── page.tsx                      # Landing / Dashboard
│   │   ├── globals.css
│   │   │
│   │   ├── explore/                      # EXPLORE mode
│   │   │   ├── page.tsx                  # Target browser / graph overview
│   │   │   ├── targets/
│   │   │   │   ├── page.tsx              # Target listing with filters
│   │   │   │   └── [targetId]/
│   │   │   │       ├── page.tsx          # Target detail + capability tree
│   │   │   │       ├── capabilities/
│   │   │   │       │   └── [capId]/
│   │   │   │       │       └── page.tsx  # Capability detail + bundle
│   │   │   │       ├── algorithms/
│   │   │   │       │   └── page.tsx      # All algorithms for target
│   │   │   │       └── coordinate-system/
│   │   │   │           └── page.tsx      # Coordinate system reference
│   │   │   ├── concepts/
│   │   │   │   ├── page.tsx              # Concept browser
│   │   │   │   └── [conceptId]/
│   │   │   │       └── page.tsx          # Concept detail + manifestations
│   │   │   ├── algorithms/
│   │   │   │   ├── page.tsx              # Algorithm search / browser
│   │   │   │   └── [algoId]/
│   │   │   │       └── page.tsx          # Algorithm detail + implementations
│   │   │   ├── graph/
│   │   │   │   └── page.tsx              # Full knowledge graph explorer
│   │   │   └── compare/
│   │   │       └── page.tsx              # Side-by-side format comparison
│   │   │
│   │   ├── build/                        # BUILD mode
│   │   │   ├── page.tsx                  # Task input / assembly workspace
│   │   │   ├── assemble/
│   │   │   │   └── page.tsx              # Knowledge assembly workspace
│   │   │   ├── blueprints/
│   │   │   │   ├── page.tsx              # Blueprint browser
│   │   │   │   └── [blueprintId]/
│   │   │   │       └── page.tsx          # Blueprint detail + build guide
│   │   │   ├── diagnose/
│   │   │   │   └── page.tsx              # Issue diagnostic tool
│   │   │   └── convert/
│   │   │       └── page.tsx              # Format conversion planner
│   │   │
│   │   ├── health/                       # HEALTH mode
│   │   │   ├── page.tsx                  # Vitality dashboard
│   │   │   ├── drift/
│   │   │   │   └── page.tsx              # Drift events
│   │   │   ├── targets/
│   │   │   │   └── [targetId]/
│   │   │   │       └── page.tsx          # Per-target health detail
│   │   │   └── healing/
│   │   │       └── page.tsx              # Healing queue / history
│   │   │
│   │   ├── contribute/                   # CONTRIBUTE mode
│   │   │   ├── page.tsx                  # Contributor dashboard
│   │   │   ├── wallet/
│   │   │   │   └── page.tsx              # Token budget management
│   │   │   └── impact/
│   │   │       └── page.tsx              # Contribution impact metrics
│   │   │
│   │   ├── settings/
│   │   │   └── page.tsx                  # API keys, preferences
│   │   │
│   │   └── api/                          # API routes (BFF pattern)
│   │       └── proxy/
│   │           └── [...path]/
│   │               └── route.ts          # Proxy to Knowledge Engine API
│   │
│   ├── components/                       # Shared components
│   │   ├── layout/
│   │   │   ├── AppShell.tsx              # Main app shell
│   │   │   ├── Sidebar.tsx               # Navigation sidebar
│   │   │   ├── TopBar.tsx                # Search + mode selector
│   │   │   ├── CommandPalette.tsx        # Cmd+K search
│   │   │   └── Breadcrumbs.tsx
│   │   │
│   │   ├── knowledge/                    # Knowledge display components
│   │   │   ├── KnowledgeCard.tsx         # Generic knowledge node card
│   │   │   ├── CapabilityTree.tsx        # Hierarchical capability view
│   │   │   ├── AlgorithmView.tsx         # Algorithm with math + code
│   │   │   ├── StructureTemplate.tsx     # Structural template with vars
│   │   │   ├── CoordinateReference.tsx   # Coordinate system visualizer
│   │   │   ├── BlueprintDiagram.tsx      # Architecture diagram renderer
│   │   │   ├── BundlePanel.tsx           # Complete capability bundle
│   │   │   ├── ConceptManifestations.tsx # How concept appears across targets
│   │   │   └── MinimalFileView.tsx       # Minimal file template + code
│   │   │
│   │   ├── code/                         # Code display components
│   │   │   ├── CodeBlock.tsx             # Syntax-highlighted code
│   │   │   ├── CodeEditor.tsx            # Editable code (Monaco)
│   │   │   ├── CodeDiff.tsx              # Side-by-side diff
│   │   │   ├── TestVectorRunner.tsx      # Interactive test vector display
│   │   │   └── CopyButton.tsx            # One-click copy
│   │   │
│   │   ├── graph/                        # Graph visualization
│   │   │   ├── GraphCanvas.tsx           # Main graph renderer
│   │   │   ├── GraphControls.tsx         # Zoom, filter, layout controls
│   │   │   ├── NodeTooltip.tsx           # Hover details
│   │   │   └── SubgraphView.tsx          # Focused subgraph display
│   │   │
│   │   ├── vitality/                     # Health visualization
│   │   │   ├── VitalityBadge.tsx         # Small vitality indicator
│   │   │   ├── VitalityGauge.tsx         # Large gauge display
│   │   │   ├── DecayTimeline.tsx         # Freshness over time
│   │   │   ├── DriftEventCard.tsx        # Drift event display
│   │   │   ├── HealthHeatmap.tsx         # Grid heatmap of node health
│   │   │   └── HealingQueueView.tsx      # Priority queue display
│   │   │
│   │   ├── search/                       # Search components
│   │   │   ├── GlobalSearch.tsx          # Main search bar
│   │   │   ├── SearchResults.tsx         # Results display
│   │   │   ├── FilterPanel.tsx           # Search filters
│   │   │   └── AlgorithmSearch.tsx       # Specialized algo search
│   │   │
│   │   ├── ai/                           # AI integration components
│   │   │   ├── ContextAssembler.tsx      # Visualize assembled context
│   │   │   ├── SendToAIButton.tsx        # Export context to clipboard/AI
│   │   │   ├── AIPromptPreview.tsx       # Preview generated prompts
│   │   │   └── SystemPromptBuilder.tsx   # Configure AI expert prompts
│   │   │
│   │   └── common/                       # Shared UI primitives
│   │       ├── Badge.tsx
│   │       ├── Card.tsx
│   │       ├── Tabs.tsx
│   │       ├── Modal.tsx
│   │       ├── Tooltip.tsx
│   │       ├── Progress.tsx
│   │       ├── Skeleton.tsx
│   │       ├── EmptyState.tsx
│   │       └── ErrorBoundary.tsx
│   │
│   ├── hooks/                            # Custom React hooks
│   │   ├── useKnowledgeAPI.ts            # API client hooks
│   │   ├── useSearch.ts                  # Debounced search
│   │   ├── useGraph.ts                   # Graph data management
│   │   ├── useVitality.ts               # Vitality data hooks
│   │   ├── useClipboard.ts              # Copy to clipboard
│   │   ├── useKeyboardShortcuts.ts      # Global shortcuts
│   │   └── usePreferences.ts            # User preferences
│   │
│   ├── lib/                              # Utility libraries
│   │   ├── api-client.ts                 # Knowledge Engine API client
│   │   ├── graph-layout.ts              # Graph layout algorithms
│   │   ├── token-estimator.ts           # Client-side token counting
│   │   ├── code-formatter.ts            # Code formatting utilities
│   │   ├── vitality-color.ts            # Color scales for vitality
│   │   └── constants.ts                 # App-wide constants
│   │
│   ├── stores/                           # Zustand stores
│   │   ├── app-store.ts                 # Global app state
│   │   ├── search-store.ts             # Search state
│   │   ├── graph-store.ts              # Graph exploration state
│   │   ├── build-store.ts              # Build mode workspace state
│   │   └── preferences-store.ts        # User preferences
│   │
│   └── types/                            # TypeScript types
│       ├── api.ts                        # API response types
│       ├── knowledge.ts                 # Knowledge node types
│       ├── graph.ts                     # Graph types
│       └── vitality.ts                  # Vitality types
│
├── public/
│   ├── icons/                           # Format/language icons
│   └── fonts/
│
└── tests/
    ├── components/
    ├── hooks/
    └── e2e/
```

---

## The Key Screens

### 1. The Landing Dashboard

The first thing a user sees. It answers: **"What is this, and what can I do right now?"**

```tsx
// src/app/page.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { VitalityGauge } from '@/components/vitality/VitalityGauge';
import { TargetGrid } from '@/components/knowledge/TargetGrid';
import { QuickActions } from '@/components/layout/QuickActions';

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ['statistics'],
    queryFn: () => api.meta.statistics(),
  });
  
  const { data: vitality } = useQuery({
    queryKey: ['vitality'],
    queryFn: () => api.vitality.overview(),
  });
  
  const { data: recentDrift } = useQuery({
    queryKey: ['drift', 'recent'],
    queryFn: () => api.vitality.driftEvents({ limit: 5 }),
  });

  return (
    <div className="flex flex-col gap-8 p-8 max-w-7xl mx-auto">
      
      {/* Hero Search */}
      <section className="text-center py-12">
        <h1 className="text-4xl font-bold mb-2">
          The Universal Knowledge Engine
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Complete generative knowledge for {stats?.targets_documented ?? '...'} programming 
          languages, file formats, and tools. Everything you need to build anything.
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
          icon="🔍"
          title="Explore"
          description="Browse targets, capabilities, and the knowledge graph"
          href="/explore"
          color="blue"
        />
        <QuickActionCard
          icon="🔨"
          title="Build"
          description="Assemble knowledge for your implementation task"
          href="/build"
          color="green"
        />
        <QuickActionCard
          icon="🤖"
          title="AI Context"
          description="Generate optimal context for your AI coding assistant"
          href="/build/assemble"
          color="purple"
        />
      </section>
      
      {/* Stats Bar */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Targets" value={stats?.targets_documented} />
        <StatCard label="Algorithms" value={stats?.nodes_algorithm?.total} />
        <StatCard label="Templates" value={stats?.nodes_structure?.total} />
        <StatCard label="Blueprints" value={stats?.nodes_blueprint?.total} />
        <VitalityGauge 
          score={vitality?.overall_vitality} 
          size="compact"
          label="Knowledge Health"
        />
      </section>
      
      {/* Featured Targets */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Documented Targets</h2>
          <a href="/explore/targets" className="text-sm text-blue-500 hover:underline">
            View all →
          </a>
        </div>
        <TargetGrid limit={12} />
      </section>
      
      {/* Recent Drift Events */}
      {recentDrift?.data?.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-4">
            Recent Knowledge Updates
          </h2>
          <div className="space-y-2">
            {recentDrift.data.map(event => (
              <DriftEventCard key={event.event_id} event={event} compact />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function QuickActionCard({ icon, title, description, href, color }) {
  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950 dark:hover:bg-blue-900',
    green: 'border-green-200 bg-green-50 hover:bg-green-100 dark:border-green-800 dark:bg-green-950 dark:hover:bg-green-900',
    purple: 'border-purple-200 bg-purple-50 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950 dark:hover:bg-purple-900',
  };
  
  return (
    <a href={href} className={`block p-6 rounded-lg border transition ${colorClasses[color]}`}>
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </a>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="p-4 rounded-lg border bg-card text-center">
      <div className="text-2xl font-bold">{value?.toLocaleString() ?? '—'}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
    </div>
  );
}
```

### 2. Target Detail — The Heart of Exploration

This is where a user understands what a format or language can do. The capability tree is the central element.

```tsx
// src/app/explore/targets/[targetId]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api-client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/common/Tabs';
import { CapabilityTree } from '@/components/knowledge/CapabilityTree';
import { VitalityBadge } from '@/components/vitality/VitalityBadge';
import { CoordinateReference } from '@/components/knowledge/CoordinateReference';
import { MinimalFileView } from '@/components/knowledge/MinimalFileView';
import { SubgraphView } from '@/components/graph/SubgraphView';
import { SendToAIButton } from '@/components/ai/SendToAIButton';

export default function TargetDetail() {
  const { targetId } = useParams();
  const [activeTab, setActiveTab] = useState('capabilities');
  
  const { data: target, isLoading } = useQuery({
    queryKey: ['target', targetId],
    queryFn: () => api.targets.get(targetId as string),
  });
  
  const { data: coordSystem } = useQuery({
    queryKey: ['coordinate-system', targetId],
    queryFn: () => api.targets.coordinateSystem(targetId as string),
    enabled: !!target,
  });

  if (isLoading) return <TargetDetailSkeleton />;
  if (!target) return <NotFound />;
  
  const { data: content } = target;
  const info = content.content;

  return (
    <div className="max-w-7xl mx-auto p-6">
      
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <TargetIcon kind={info.kind} size={48} />
              <div>
                <h1 className="text-3xl font-bold">{content.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground">
                    {formatKind(info.kind)}
                  </span>
                  {info.version && (
                    <span className="text-sm px-2 py-0.5 bg-muted rounded">
                      v{info.version}
                    </span>
                  )}
                  <VitalityBadge 
                    score={content.vitality?.overall} 
                    showLabel 
                  />
                </div>
              </div>
            </div>
            
            {/* Quick facts */}
            <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
              <span>{content.capability_count} capabilities</span>
              {info.extensions?.length > 0 && (
                <span>Extensions: {info.extensions.join(', ')}</span>
              )}
              {info.media_types?.length > 0 && (
                <span>MIME: {info.media_types[0]}</span>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <SendToAIButton 
              context={{ type: 'target', id: targetId }}
              label="Get AI System Prompt"
            />
            <a 
              href={`/build/assemble?target=${targetId}`}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Build with {content.name}
            </a>
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
          <TabsTrigger value="coordinates">Coordinate System</TabsTrigger>
          <TabsTrigger value="graph">Knowledge Graph</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
        </TabsList>
        
        <TabsContent value="capabilities" className="mt-6">
          <CapabilityTreePanel 
            targetId={targetId as string} 
            capabilities={content.capabilities} 
          />
        </TabsContent>
        
        <TabsContent value="start-here" className="mt-6">
          <StartHerePanel targetId={targetId as string} />
        </TabsContent>
        
        <TabsContent value="coordinates" className="mt-6">
          {coordSystem ? (
            <CoordinateReference data={coordSystem.data} />
          ) : (
            <EmptyState message="Coordinate system reference not available for this target." />
          )}
        </TabsContent>
        
        <TabsContent value="graph" className="mt-6">
          <div className="h-[600px] border rounded-lg overflow-hidden">
            <SubgraphView 
              rootId={`target:${targetId}`} 
              depth={2}
              height={600}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="health" className="mt-6">
          <TargetHealthPanel targetId={targetId as string} vitality={content.vitality} />
        </TabsContent>
      </Tabs>
    </div>
  );
}


function CapabilityTreePanel({ targetId, capabilities }) {
  const [searchFilter, setSearchFilter] = useState('');
  const [complexityFilter, setComplexityFilter] = useState<string | null>(null);
  const [selectedCapId, setSelectedCapId] = useState<string | null>(null);
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Tree */}
      <div className="lg:col-span-1">
        <div className="sticky top-4">
          <input
            type="text"
            placeholder="Filter capabilities..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg mb-3 text-sm"
          />
          
          <div className="flex gap-1 mb-4 flex-wrap">
            {['basic', 'intermediate', 'advanced', 'expert'].map(level => (
              <button
                key={level}
                onClick={() => setComplexityFilter(
                  complexityFilter === level ? null : level
                )}
                className={`px-2 py-1 text-xs rounded-full border transition ${
                  complexityFilter === level 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          
          <CapabilityTree
            capabilities={capabilities}
            searchFilter={searchFilter}
            complexityFilter={complexityFilter}
            selectedId={selectedCapId}
            onSelect={setSelectedCapId}
          />
        </div>
      </div>
      
      {/* Right: Selected capability detail */}
      <div className="lg:col-span-2">
        {selectedCapId ? (
          <CapabilityBundlePreview 
            targetId={targetId}
            capabilityId={selectedCapId}
          />
        ) : (
          <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg text-muted-foreground">
            <div className="text-center">
              <p className="text-lg mb-1">Select a capability</p>
              <p className="text-sm">Click any capability in the tree to see its templates, algorithms, and code</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


function StartHerePanel({ targetId }) {
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
        {minimalFile ? (
          <MinimalFileView data={minimalFile.data} />
        ) : (
          <Skeleton className="h-64" />
        )}
      </div>
      
      <div>
        <h3 className="text-xl font-semibold mb-4">
          What To Build Next
        </h3>
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
```

### 3. The Capability Bundle — The Most Important View

When a user clicks on a capability, this is what they see. It's the complete package.

```tsx
// src/components/knowledge/BundlePanel.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api-client';
import { CodeBlock } from '@/components/code/CodeBlock';
import { AlgorithmView } from './AlgorithmView';
import { StructureTemplate } from './StructureTemplate';
import { VitalityBadge } from '@/components/vitality/VitalityBadge';
import { SendToAIButton } from '@/components/ai/SendToAIButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/common/Tabs';

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
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-1">
              {capability.content?.name || capability.name}
            </h2>
            <p className="text-muted-foreground">
              {capability.content?.description}
            </p>
            
            {/* Prerequisites */}
            {prerequisites?.length > 0 && (
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-muted-foreground">Requires:</span>
                {prerequisites.map(p => (
                  <a
                    key={p.id}
                    href={`/explore/targets/${targetId}/capabilities/${encodeURIComponent(p.id)}`}
                    className="text-xs px-2 py-0.5 bg-muted rounded hover:bg-muted/80"
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
              className="text-sm border rounded px-2 py-1"
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
        <div className="flex gap-6 mt-4 pt-4 border-t text-sm">
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


function AllCodeView({ templates, algorithms, language }) {
  // Concatenate all code from templates and algorithms into one copyable block
  const allCode = [];
  
  algorithms.forEach(algo => {
    const impl = algo.preferred_implementation || 
                 algo.content?.implementations?.[language];
    if (impl?.code) {
      allCode.push(`# === ${algo.name || algo.content?.name} ===`);
      allCode.push(impl.code);
      allCode.push('');
    }
  });
  
  templates.forEach(template => {
    const assembly = template.content?.assembly_code;
    if (assembly?.code) {
      allCode.push(`# === Template: ${template.name || template.content?.purpose} ===`);
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
        <CopyButton text={allCode.join('\n')} label="Copy all code" />
      </div>
      <CodeBlock 
        code={allCode.join('\n')} 
        language={language}
        maxHeight={600}
      />
    </div>
  );
}


function ComplexityBadge({ level }) {
  const colors = {
    trivial: 'bg-gray-100 text-gray-700',
    basic: 'bg-green-100 text-green-700',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-orange-100 text-orange-700',
    expert: 'bg-red-100 text-red-700',
  };
  
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[level] || colors.basic}`}>
      {level || 'unknown'}
    </span>
  );
}


function CompositionRuleCard({ rule }) {
  return (
    <div className="border rounded-lg p-4 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-amber-600">⚠️</span>
        <span className="font-medium text-sm">
          {rule.rule_type || 'Composition Rule'}
        </span>
      </div>
      <p className="text-sm">{rule.description}</p>
      {rule.correct_implementation && (
        <CodeBlock 
          code={rule.correct_implementation} 
          language="python" 
          className="mt-3"
          compact
        />
      )}
    </div>
  );
}
```

### 4. The Algorithm View — Math Meets Code

```tsx
// src/components/knowledge/AlgorithmView.tsx
'use client';

import { useState } from 'react';
import { CodeBlock } from '@/components/code/CodeBlock';
import { CopyButton } from '@/components/code/CopyButton';

interface AlgorithmViewProps {
  algorithm: any;
  preferredLanguage: string;
  expanded?: boolean;
}

export function AlgorithmView({ algorithm, preferredLanguage, expanded = true }: AlgorithmViewProps) {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [showOptimizations, setShowOptimizations] = useState(false);
  const [activeImplLang, setActiveImplLang] = useState(preferredLanguage);
  
  const content = algorithm.content || algorithm;
  const impl = algorithm.preferred_implementation || 
               content.implementations?.[activeImplLang] ||
               content.implementations?.[Object.keys(content.implementations || {})[0]];
  
  const availableLanguages = Object.keys(content.implementations || {});
  
  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Algorithm Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 text-left bg-card hover:bg-muted/50 transition flex items-center justify-between"
      >
        <div>
          <h3 className="text-lg font-semibold">
            {content.name || algorithm.name}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {content.purpose}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {content.complexity && (
            <span className="text-xs text-muted-foreground">
              Time: {content.complexity.time} · Space: {content.complexity.space}
            </span>
          )}
          <span className="text-muted-foreground">
            {isExpanded ? '▼' : '▶'}
          </span>
        </div>
      </button>
      
      {isExpanded && (
        <div className="px-6 pb-6 space-y-6">
          
          {/* Mathematical Foundation */}
          {content.mathematical_foundation && (
            <section>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Mathematical Foundation
              </h4>
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                {content.mathematical_foundation.description && (
                  <p className="text-sm">{content.mathematical_foundation.description}</p>
                )}
                {content.mathematical_foundation.formulas?.map((formula, i) => (
                  <div key={i} className="border-l-2 border-blue-400 pl-3">
                    <div className="text-sm font-medium">{formula.name}</div>
                    <code className="text-sm font-mono block mt-1 text-blue-700 dark:text-blue-300">
                      {formula.formula_text || formula.formula}
                    </code>
                    {formula.variables && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {Object.entries(formula.variables).map(([v, meaning]) => (
                          <span key={v} className="mr-3">
                            <code>{v}</code> = {meaning as string}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
          
          {/* Implementation */}
          {impl && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Implementation
                </h4>
                <div className="flex items-center gap-2">
                  {availableLanguages.length > 1 && (
                    <div className="flex rounded-lg border overflow-hidden">
                      {availableLanguages.map(lang => (
                        <button
                          key={lang}
                          onClick={() => setActiveImplLang(lang)}
                          className={`px-3 py-1 text-xs transition ${
                            activeImplLang === lang
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-muted'
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  )}
                  <CopyButton text={impl.code} />
                </div>
              </div>
              <CodeBlock 
                code={impl.code} 
                language={activeImplLang}
                showLineNumbers
                maxHeight={400}
              />
              
              {/* Usage example */}
              {impl.usage_example && (
                <div className="mt-3">
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    Usage:
                  </div>
                  <CodeBlock 
                    code={impl.usage_example} 
                    language={activeImplLang}
                    compact
                  />
                </div>
              )}
            </section>
          )}
          
          {/* Parameters */}
          {content.parameters?.length > 0 && (
            <section>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Parameters
              </h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-4 py-2">Name</th>
                      <th className="text-left px-4 py-2">Type</th>
                      <th className="text-left px-4 py-2">Range</th>
                      <th className="text-left px-4 py-2">Default</th>
                      <th className="text-left px-4 py-2">Effect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {content.parameters.map((param, i) => (
                      <tr key={i} className="hover:bg-muted/30">
                        <td className="px-4 py-2 font-mono text-xs">{param.name}</td>
                        <td className="px-4 py-2 text-xs">{param.type}</td>
                        <td className="px-4 py-2 text-xs">
                          {param.range ? `${param.range.min} – ${param.range.max}` : '—'}
                        </td>
                        <td className="px-4 py-2 text-xs font-mono">{param.default ?? '—'}</td>
                        <td className="px-4 py-2 text-xs text-muted-foreground">{param.effect}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
          
          {/* Test Vectors */}
          {content.test_vectors?.length > 0 && (
            <section>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Test Vectors
              </h4>
              <div className="space-y-2">
                {content.test_vectors.map((tv, i) => (
                  <div key={i} className="border rounded-lg p-3 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                    <div className="text-sm font-medium">{tv.description}</div>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Input:</div>
                        <code className="text-xs font-mono block bg-white dark:bg-black rounded p-2">
                          {JSON.stringify(tv.input)}
                        </code>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Expected Output:</div>
                        <code className="text-xs font-mono block bg-white dark:bg-black rounded p-2">
                          {JSON.stringify(tv.expected_output)}
                        </code>
                      </div>
                    </div>
                    {tv.tolerance && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Tolerance: {tv.tolerance}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
          
          {/* Edge Cases */}
          {content.edge_cases?.length > 0 && (
            <section>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Edge Cases
              </h4>
              <div className="space-y-2">
                {content.edge_cases.map((ec, i) => (
                  <div key={i} className="border rounded-lg p-3 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950">
                    <div className="text-sm font-medium">{ec.case}</div>
                    <p className="text-xs text-muted-foreground mt-1">{ec.problem}</p>
                    <p className="text-xs mt-1"><strong>Solution:</strong> {ec.solution}</p>
                    {ec.code && (
                      <CodeBlock code={ec.code} language={activeImplLang} compact className="mt-2" />
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
          
          {/* Optimizations (collapsible) */}
          {content.optimizations?.length > 0 && (
            <section>
              <button
                onClick={() => setShowOptimizations(!showOptimizations)}
                className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2 hover:text-foreground"
              >
                Optimizations ({content.optimizations.length})
                <span>{showOptimizations ? '▼' : '▶'}</span>
              </button>
              {showOptimizations && (
                <div className="mt-3 space-y-3">
                  {content.optimizations.map((opt, i) => (
                    <div key={i} className="border rounded-lg p-4">
                      <div className="flex justify-between">
                        <h5 className="font-medium text-sm">{opt.name}</h5>
                        {opt.speedup_factor && (
                          <span className="text-xs text-green-600">~{opt.speedup_factor} faster</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{opt.tradeoff}</p>
                      {opt.implementation && (
                        <CodeBlock code={opt.implementation} language={activeImplLang} compact className="mt-2" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
```

### 5. The Build/Assemble Workspace

This is where the **BUILDER** mode lives. Task-focused, action-oriented.

```tsx
// src/app/build/assemble/page.tsx
'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { CodeBlock } from '@/components/code/CodeBlock';
import { BundlePanel } from '@/components/knowledge/BundlePanel';
import { CopyButton } from '@/components/code/CopyButton';

export default function AssembleWorkspace() {
  const [target, setTarget] = useState('');
  const [task, setTask] = useState('');
  const [language, setLanguage] = useState('python');
  const [maxTokens, setMaxTokens] = useState(8000);
  const [mode, setMode] = useState<'bundle' | 'ai-context'>('bundle');
  
  const assembleMutation = useMutation({
    mutationFn: () => api.assemble({
      target,
      task,
      implementation_language: language,
      include_tests: true,
      include_edge_cases: true,
      max_context_tokens: maxTokens,
    }),
  });
  
  const aiContextMutation = useMutation({
    mutationFn: () => api.ai.context({
      target,
      task,
      implementation_language: language,
      max_context_tokens: maxTokens,
    }),
  });
  
  const handleSubmit = () => {
    if (mode === 'bundle') {
      assembleMutation.mutate();
    } else {
      aiContextMutation.mutate();
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      
      <h1 className="text-3xl font-bold mb-2">Build Something</h1>
      <p className="text-muted-foreground mb-8">
        Describe what you want to build. The engine assembles all knowledge 
        you need: templates, algorithms, coordinate systems, and working code.
      </p>
      
      {/* Input Form */}
      <div className="border rounded-lg p-6 bg-card mb-8 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Target Format</label>
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="e.g., pptx, png, python"
              className="w-full px-3 py-2 border rounded-lg"
              list="target-suggestions"
            />
            <datalist id="target-suggestions">
              <option value="pptx" />
              <option value="png" />
              <option value="pdf" />
              <option value="python" />
              <option value="svg" />
              <option value="json" />
            </datalist>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="rust">Rust</option>
              <option value="go">Go</option>
              <option value="c">C</option>
              <option value="java">Java</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Output Mode</label>
            <div className="flex rounded-lg border overflow-hidden">
              <button
                onClick={() => setMode('bundle')}
                className={`flex-1 px-3 py-2 text-sm transition ${
                  mode === 'bundle' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`}
              >
                Knowledge Bundle
              </button>
              <button
                onClick={() => setMode('ai-context')}
                className={`flex-1 px-3 py-2 text-sm transition ${
                  mode === 'ai-context' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`}
              >
                AI Context
              </button>
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            What do you want to build?
          </label>
          <textarea
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="e.g., Create a PPTX slide with a red rectangle at position (2in, 3in) containing centered white text that says 'Hello World'"
            rows={3}
            className="w-full px-3 py-2 border rounded-lg resize-none"
          />
        </div>
        
        {mode === 'ai-context' && (
          <div>
            <label className="block text-sm font-medium mb-1">
              Max Context Tokens: {maxTokens.toLocaleString()}
            </label>
            <input
              type="range"
              min={2000}
              max={32000}
              step={1000}
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>2K (compact)</span>
              <span>32K (exhaustive)</span>
            </div>
          </div>
        )}
        
        <button
          onClick={handleSubmit}
          disabled={!target || !task || assembleMutation.isPending || aiContextMutation.isPending}
          className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {(assembleMutation.isPending || aiContextMutation.isPending)
            ? 'Assembling...'
            : mode === 'bundle' 
              ? '🔨 Assemble Knowledge Bundle'
              : '🤖 Generate AI Context'}
        </button>
      </div>
      
      {/* Results */}
      {mode === 'bundle' && assembleMutation.data && (
        <AssembleBundleResult data={assembleMutation.data} language={language} />
      )}
      
      {mode === 'ai-context' && aiContextMutation.data && (
        <AIContextResult context={aiContextMutation.data} />
      )}
      
      {/* Example queries */}
      {!assembleMutation.data && !aiContextMutation.data && (
        <ExampleQueries onSelect={(example) => {
          setTarget(example.target);
          setTask(example.task);
        }} />
      )}
    </div>
  );
}


function AssembleBundleResult({ data, language }) {
  const result = data.data;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Assembly Result</h2>
        <div className="flex gap-2 text-sm text-muted-foreground">
          <span>{result.structural_templates?.length || 0} templates</span>
          <span>·</span>
          <span>{result.algorithms?.length || 0} algorithms</span>
        </div>
      </div>
      
      {result.usage_guide && (
        <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <h3 className="font-medium text-sm mb-2">Implementation Guide</h3>
          <pre className="text-sm whitespace-pre-wrap">{result.usage_guide}</pre>
        </div>
      )}
      
      {result.structural_templates?.map((t, i) => (
        <StructureTemplate key={i} template={t} language={language} />
      ))}
      
      {result.algorithms?.map((a, i) => (
        <AlgorithmView key={i} algorithm={a} preferredLanguage={language} />
      ))}
      
      {result.coordinate_system && (
        <CoordinateReference data={result.coordinate_system} compact />
      )}
    </div>
  );
}


function AIContextResult({ context }) {
  const text = typeof context === 'string' ? context : context?.data || '';
  const tokenEstimate = text.split(/\s+/).length;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">AI Context Generated</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            ~{tokenEstimate.toLocaleString()} tokens
          </span>
          <CopyButton text={text} label="Copy context" />
        </div>
      </div>
      
      <div className="border rounded-lg p-4 bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
        <p className="text-sm mb-3">
          Paste this context into your AI assistant's system prompt or conversation 
          to give it expert knowledge about your task.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => navigator.clipboard.writeText(text)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
          >
            📋 Copy to Clipboard
          </button>
          <button
            onClick={() => {
              const blob = new Blob([text], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'ai-context.txt';
              a.click();
            }}
            className="px-4 py-2 border rounded-lg text-sm hover:bg-muted"
          >
            💾 Download as File
          </button>
        </div>
      </div>
      
      <CodeBlock 
        code={text} 
        language="markdown"
        maxHeight={500}
        showLineNumbers
      />
    </div>
  );
}


function ExampleQueries({ onSelect }) {
  const examples = [
    {
      target: 'pptx',
      task: 'Create a slide with a red rectangle at position (2in, 3in) with size (4in, 1in) containing centered white text',
      label: 'PPTX: Positioned shape with text',
    },
    {
      target: 'png',
      task: 'Encode raw RGBA pixel data as a PNG file with alpha transparency',
      label: 'PNG: Generate from pixel data',
    },
    {
      target: 'pdf',
      task: 'Create a PDF document with a title, paragraph text, and an embedded image',
      label: 'PDF: Document with image',
    },
    {
      target: 'svg',
      task: 'Generate an SVG with an animated circle that pulses in size using CSS animations',
      label: 'SVG: Animated element',
    },
    {
      target: 'python',
      task: 'Implement a custom async context manager with proper exception handling',
      label: 'Python: Async context manager',
    },
  ];
  
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Example Tasks</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {examples.map((ex, i) => (
          <button
            key={i}
            onClick={() => onSelect(ex)}
            className="text-left p-4 border rounded-lg hover:bg-muted/50 transition"
          >
            <div className="text-sm font-medium">{ex.label}</div>
            <div className="text-xs text-muted-foreground mt-1">{ex.task}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
```

### 6. The Vitality Dashboard

```tsx
// src/app/health/page.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { VitalityGauge } from '@/components/vitality/VitalityGauge';
import { HealthHeatmap } from '@/components/vitality/HealthHeatmap';
import { DecayTimeline } from '@/components/vitality/DecayTimeline';
import { DriftEventCard } from '@/components/vitality/DriftEventCard';
import { HealingQueueView } from '@/components/vitality/HealingQueueView';

export default function HealthDashboard() {
  const { data: vitality } = useQuery({
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
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      
      <header>
        <h1 className="text-3xl font-bold mb-2">Knowledge Vitality</h1>
        <p className="text-muted-foreground">
          Real-time health of the knowledge base across freshness, correctness, and completeness.
        </p>
      </header>
      
      {/* Top-level Gauges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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
      </div>
      
      {/* Node Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Node Health Distribution</h3>
          <div className="space-y-3">
            <DistributionBar 
              label="Healthy" 
              count={v?.healthy_nodes} 
              total={v?.total_nodes}
              color="bg-green-500" 
            />
            <DistributionBar 
              label="Warning" 
              count={(v?.total_nodes || 0) - (v?.healthy_nodes || 0) - (v?.critical_nodes || 0)} 
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
          <div className="mt-4 text-sm text-muted-foreground">
            Total nodes: {v?.total_nodes?.toLocaleString()}
          </div>
        </div>
        
        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Unresolved Drift Events</h3>
          <div className="space-y-2">
            {driftEvents?.data?.slice(0, 5).map(event => (
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
      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">
          Target Health Heatmap
        </h3>
        <HealthHeatmap />
      </div>
    </div>
  );
}

function DistributionBar({ label, count, total, color }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {count?.toLocaleString()} ({pct.toFixed(1)}%)
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
```

---

## Key Shared Components

### The Vitality Badge (Appears Everywhere)

```tsx
// src/components/vitality/VitalityBadge.tsx

interface VitalityBadgeProps {
  score: number | null | undefined;
  showLabel?: boolean;
  size?: 'tiny' | 'small' | 'medium';
}

export function VitalityBadge({ score, showLabel = false, size = 'small' }: VitalityBadgeProps) {
  if (score == null) return null;
  
  const { color, bgColor, label } = getVitalityStyle(score);
  
  const sizeClasses = {
    tiny: 'w-2 h-2',
    small: 'w-3 h-3',
    medium: 'w-4 h-4',
  };
  
  return (
    <div className="flex items-center gap-1.5" title={`Vitality: ${(score * 100).toFixed(1)}%`}>
      <div className={`${sizeClasses[size]} rounded-full ${bgColor}`} />
      {showLabel && (
        <span className={`text-xs ${color}`}>
          {label} ({(score * 100).toFixed(0)}%)
        </span>
      )}
    </div>
  );
}

function getVitalityStyle(score: number) {
  if (score >= 0.8) return { 
    color: 'text-green-600', 
    bgColor: 'bg-green-500', 
    label: 'Healthy' 
  };
  if (score >= 0.6) return { 
    color: 'text-yellow-600', 
    bgColor: 'bg-yellow-500', 
    label: 'Fair' 
  };
  if (score >= 0.4) return { 
    color: 'text-orange-600', 
    bgColor: 'bg-orange-500', 
    label: 'Aging' 
  };
  if (score >= 0.2) return { 
    color: 'text-red-600', 
    bgColor: 'bg-red-500', 
    label: 'Stale' 
  };
  return { 
    color: 'text-red-800', 
    bgColor: 'bg-red-700', 
    label: 'Critical' 
  };
}
```

### The Command Palette (⌘K)

```tsx
// src/components/layout/CommandPalette.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSearch } from '@/hooks/useSearch';

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();
  const { results, isSearching } = useSearch(query, { debounceMs: 200 });
  
  // ⌘K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  
  const navigate = useCallback((path: string) => {
    router.push(path);
    setIsOpen(false);
    setQuery('');
  }, [router]);

  if (!isOpen) return null;
  
  const quickActions = [
    { label: 'Explore targets', path: '/explore/targets', icon: '🔍' },
    { label: 'Build something', path: '/build/assemble', icon: '🔨' },
    { label: 'Search algorithms', path: '/explore/algorithms', icon: '📐' },
    { label: 'View health dashboard', path: '/health', icon: '💚' },
    { label: 'Compare formats', path: '/explore/compare', icon: '⚖️' },
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={() => setIsOpen(false)} 
      />
      
      {/* Modal */}
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-50">
        <div className="bg-card border rounded-xl shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center px-4 border-b">
            <span className="text-muted-foreground mr-2">🔍</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search targets, capabilities, algorithms, concepts..."
              className="w-full py-4 bg-transparent outline-none text-lg"
              autoFocus
            />
            <kbd className="text-xs text-muted-foreground border rounded px-1.5 py-0.5">
              ESC
            </kbd>
          </div>
          
          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {query.length === 0 ? (
              // Show quick actions when no query
              <div className="p-2">
                <div className="text-xs text-muted-foreground px-3 py-1">Quick Actions</div>
                {quickActions.map(action => (
                  <button
                    key={action.path}
                    onClick={() => navigate(action.path)}
                    className="w-full text-left px-3 py-2 hover:bg-muted rounded-lg flex items-center gap-3 transition"
                  >
                    <span>{action.icon}</span>
                    <span className="text-sm">{action.label}</span>
                  </button>
                ))}
              </div>
            ) : isSearching ? (
              <div className="p-8 text-center text-muted-foreground">
                Searching...
              </div>
            ) : results.length > 0 ? (
              <div className="p-2">
                {results.map((result, i) => (
                  <button
                    key={result.id || i}
                    onClick={() => navigate(getNodePath(result))}
                    className="w-full text-left px-3 py-2 hover:bg-muted rounded-lg flex items-start gap-3 transition"
                  >
                    <NodeTypeIcon type={result.type} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{result.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {result.snippet}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground capitalize shrink-0">
                      {result.type}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                No results found for "{query}"
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function NodeTypeIcon({ type }: { type: string }) {
  const icons = {
    target: '📦',
    algorithm: '📐',
    structure: '🧱',
    concept: '💡',
    blueprint: '🏗️',
    artifact: '📄',
  };
  return <span className="text-lg">{icons[type] || '📌'}</span>;
}

function getNodePath(result: any): string {
  switch (result.type) {
    case 'target': return `/explore/targets/${result.id.replace('target:', '')}`;
    case 'algorithm': return `/explore/algorithms/${encodeURIComponent(result.id)}`;
    case 'concept': return `/explore/concepts/${encodeURIComponent(result.id)}`;
    case 'structure': return `/explore/targets/${result.id.split(':')[1]}`;
    default: return `/explore/targets/${result.id.split(':')[1] || ''}`;
  }
}
```

---

## API Client Layer

```typescript
// src/lib/api-client.ts

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class APIClient {
  private apiKey: string;
  
  constructor() {
    this.apiKey = typeof window !== 'undefined' 
      ? localStorage.getItem('uke_api_key') || ''
      : '';
  }
  
  setApiKey(key: string) {
    this.apiKey = key;
    if (typeof window !== 'undefined') {
      localStorage.setItem('uke_api_key', key);
    }
  }
  
  private async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${BASE_URL}${path}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };
    
    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new APIError(response.status, error.detail || 'Unknown error');
    }
    
    // Handle text responses (AI context endpoint)
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('text/plain')) {
      return await response.text() as T;
    }
    
    return response.json();
  }
  
  // ── EXPLORE ──
  
  targets = {
    list: (params?: { kind?: string; search?: string; limit?: number; offset?: number }) => 
      this.fetch('/v1/targets?' + new URLSearchParams(params as any)),
    
    get: (id: string) => 
      this.fetch(`/v1/targets/${id}`),
    
    capabilities: (id: string, params?: { search?: string; complexity?: string }) => 
      this.fetch(`/v1/targets/${id}/capabilities?` + new URLSearchParams(params as any)),
    
    coordinateSystem: (id: string) => 
      this.fetch(`/v1/targets/${id}/coordinate-system`),
    
    minimalFile: (id: string) => 
      this.fetch(`/v1/targets/${id}/minimal-file`),
  };
  
  graph = {
    neighbors: (nodeId: string, params?: { relationship?: string; direction?: string; depth?: number }) =>
      this.fetch(`/v1/graph/neighbors/${encodeURIComponent(nodeId)}?` + new URLSearchParams(params as any)),
  };
  
  concepts = {
    list: (params?: { domain?: string; search?: string }) =>
      this.fetch('/v1/concepts?' + new URLSearchParams(params as any)),
    
    get: (id: string) =>
      this.fetch(`/v1/concepts/${encodeURIComponent(id)}`),
  };
  
  // ── RETRIEVE ──
  
  capabilities = {
    bundle: (id: string, params?: { implementation_language?: string; include_prerequisites?: boolean; include_edge_cases?: boolean; response_format?: string }) =>
      this.fetch(`/v1/capabilities/${encodeURIComponent(id)}/bundle?` + new URLSearchParams(params as any)),
  };
  
  algorithms = {
    get: (id: string, params?: { implementation_language?: string; include_optimizations?: boolean; include_test_vectors?: boolean }) =>
      this.fetch(`/v1/algorithms/${encodeURIComponent(id)}?` + new URLSearchParams(params as any)),
    
    search: (params: { query: string; domain?: string; has_implementation?: string; limit?: number }) =>
      this.fetch('/v1/search/algorithms?' + new URLSearchParams(params as any)),
  };
  
  structures = {
    get: (id: string) =>
      this.fetch(`/v1/structures/${encodeURIComponent(id)}`),
  };
  
  // ── SYNTHESIZE ──
  
  assemble = (body: { target: string; task: string; implementation_language?: string; include_tests?: boolean; max_context_tokens?: number }) =>
    this.fetch('/v1/assemble', { method: 'POST', body: JSON.stringify(body) }),
  
  blueprint = (body: { target: string; application_description: string; implementation_language?: string }) =>
    this.fetch('/v1/blueprint', { method: 'POST', body: JSON.stringify(body) }),
  
  diagnose = (body: { target: string; problem_description: string; code_snippet?: string }) =>
    this.fetch('/v1/diagnose', { method: 'POST', body: JSON.stringify(body) }),
  
  convert = (body: { source_format: string; target_format: string; implementation_language?: string }) =>
    this.fetch('/v1/convert', { method: 'POST', body: JSON.stringify(body) }),
  
  compare = (targets: string[]) =>
    this.fetch('/v1/compare?' + targets.map(t => `targets=${t}`).join('&'), { method: 'POST' }),
  
  // ── SEARCH ──
  
  search = (body: { query: string; node_types?: string[]; targets?: string[]; limit?: number }) =>
    this.fetch('/v1/search', { method: 'POST', body: JSON.stringify(body) }),
  
  // ── AI ──
  
  ai = {
    context: (body: { target: string; task: string; implementation_language?: string; max_context_tokens?: number }) =>
      this.fetch<string>('/v1/ai/context', { method: 'POST', body: JSON.stringify(body) }),
    
    systemPrompt: (targetId: string, params?: { scope?: string }) =>
      this.fetch<string>(`/v1/ai/system-prompt/${targetId}?` + new URLSearchParams(params as any)),
  };
  
  // ── HEALTH ──
  
  vitality = {
    overview: (params?: { target?: string }) =>
      this.fetch('/v1/vitality?' + new URLSearchParams(params as any)),
    
    driftEvents: (params?: { severity?: string; target?: string; limit?: number }) =>
      this.fetch('/v1/vitality/drift-events?' + new URLSearchParams(params as any)),
  };
  
  // ── META ──
  
  meta = {
    statistics: () => this.fetch('/v1/meta/statistics'),
    nodeTypes: () => this.fetch('/v1/meta/node-types'),
    relationshipTypes: () => this.fetch('/v1/meta/relationship-types'),
  };
  
  health = () => this.fetch('/v1/health');
}

class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

export const api = new APIClient();
```

---

## How The Four Modes Map to User Journeys

```
USER JOURNEY: "I need to generate PPTX files"
═══════════════════════════════════════════════

Landing Page
    │
    ├─► Search "pptx" (Command Palette: ⌘K)
    │       │
    │       └─► Target Detail: PPTX
    │               │
    │               ├─► Start Here tab
    │               │       └─► Minimal file code → COPY
    │               │
    │               ├─► Capabilities tab
    │               │       ├─► draw_rectangle → Bundle Panel
    │               │       │       ├─► Template XML → COPY
    │               │       │       ├─► Assembly Code → COPY
    │               │       │       └─► Send to AI → COPY CONTEXT
    │               │       │
    │               │       └─► insert_image → Bundle Panel
    │               │               └─► ... same pattern ...
    │               │
    │               └─► Coordinate System tab
    │                       └─► EMU conversion formulas → COPY
    │
    └─► Build Mode: Assemble
            │
            ├─► Task: "Create a slide with chart and shapes"
            │       └─► Assembled bundle with all pieces
            │
            └─► AI Context mode
                    └─► Copy optimized context to ChatGPT/Claude


USER JOURNEY: "I want to build a Photoshop clone"
════════════════════════════════════════════════════

Build Mode
    │
    └─► Blueprint endpoint
            │
            ├─► Application architecture diagram
            ├─► Component list with responsibilities
            ├─► Build sequence (phase 1: canvas, phase 2: tools, ...)
            ├─► Required algorithms (linked, clickable)
            │       └─► Click: Gaussian Blur algorithm
            │               └─► Full implementation + test vectors
            └─► Minimal implementation code → COPY


USER JOURNEY: "Is our knowledge base healthy?"
════════════════════════════════════════════════

Health Dashboard
    │
    ├─► Four gauges: Overall / Freshness / Correctness / Completeness
    ├─► Heatmap showing per-target health
    ├─► Drift events (Python 3.13 released, 2341 nodes affected)
    └─► Click target → Per-target health detail
            └─► List of stale nodes with regeneration actions
```

---

## What Makes This Frontend Different

Most developer tool frontends are either documentation viewers or dashboard panels. This is neither. It's a **knowledge workbench** — a place where you come with a task and leave with working code.

The three design decisions that make it work:

**1. Every piece of knowledge has a "use it" action.** Code blocks have copy buttons. Bundles have "Send to AI" buttons. Algorithms have language selectors. Nothing is display-only. Everything is actionable.

**2. The capability bundle is the atomic unit of the UI.** Not pages of docs. Not individual API calls. The bundle — templates + algorithms + coordinates + constraints + code — is the thing you grab and take back to your project. The entire UI is organized around making bundles easy to find, easy to understand, and easy to use.

**3. Vitality is ambient, not siloed.** The little green/yellow/red dots appear on every knowledge card, every algorithm, every target. You never have to go to a "health page" to know if something might be stale. Trust is built into every interaction through transparent confidence signals.
