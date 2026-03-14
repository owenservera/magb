// src/app/database/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/common/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/common/Card';
import DatabaseStats from '@/components/database/DatabaseStats';
import { EntryList } from '@/components/database/EntryList';
import { AlgorithmList } from '@/components/database/AlgorithmList';
import { CapabilityList } from '@/components/database/CapabilityList';
import { BlueprintList } from '@/components/database/BlueprintList';

export default function DatabasePage() {
  const [activeTab, setActiveTab] = useState<'entries' | 'algorithms' | 'capabilities' | 'blueprints'>('entries');

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <h1 className="text-3xl font-bold">Database Explorer</h1>
        <div className="flex gap-4">
          <Link
            href="/generate"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm font-medium"
          >
            Generate Knowledge
          </Link>
        </div>
      </div>

      <div className="grid gap-6 mb-8">
        <DatabaseStats />
      </div>

      <div className="flex gap-4">
        <Button
          variant={activeTab === 'entries' ? 'default' : 'outline'}
          onClick={() => setActiveTab('entries')}
        >
          Entries
        </Button>
        <Button
          variant={activeTab === 'algorithms' ? 'default' : 'outline'}
          onClick={() => setActiveTab('algorithms')}
        >
          Algorithms
        </Button>
        <Button
          variant={activeTab === 'capabilities' ? 'default' : 'outline'}
          onClick={() => setActiveTab('capabilities')}
        >
          Capabilities
        </Button>
        <Button
          variant={activeTab === 'blueprints' ? 'default' : 'outline'}
          onClick={() => setActiveTab('blueprints')}
        >
          Blueprints
        </Button>
      </div>

      <div className="space-y-8">
        {activeTab === 'entries' && <EntryList entries={[]} isLoading={true} />}
        {activeTab === 'algorithms' && <AlgorithmList algorithms={[]} isLoading={true} />}
        {activeTab === 'capabilities' && <CapabilityList capabilities={[]} isLoading={true} />}
        {activeTab === 'blueprints' && <BlueprintList blueprints={[]} isLoading={true} />}
      </div>
    </div>
  );
}