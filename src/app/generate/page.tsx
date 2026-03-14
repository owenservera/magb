// src/app/generate/page.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/common/Card';
import { ActiveGenerationsList } from '@/components/generate/ActiveGenerationsList';
import { GenerationHistoryList } from '@/components/generate/GenerationHistoryList';

export default function GeneratePage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <h1 className="text-3xl font-bold">Knowledge Generation</h1>
        <div className="flex gap-4">
          <Link
            href="/database"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm font-medium"
          >
            Explore Database
          </Link>
        </div>
      </div>

      <div className="grid gap-6 mb-8">
        <Card className="p-6 border">
          <CardHeader className="mb-4">
            <h2 className="text-xl font-semibold">Generate New Knowledge</h2>
            <p className="text-muted-foreground">
              Start a new knowledge generation run for any target
            </p>
          </CardHeader>
          <CardContent>
            <Link
              href="/generate/new"
              className="w-full px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 text-lg font-medium block text-center"
            >
              Start New Generation
            </Link>
          </CardContent>
        </Card>
        
        <Card className="p-6 border">
          <CardHeader className="mb-4">
            <h2 className="text-xl font-semibold">Active Generations</h2>
            <p className="text-muted-foreground">
              Monitor ongoing knowledge generation processes
            </p>
          </CardHeader>
          <CardContent>
            <ActiveGenerationsList runs={[]} isLoading={true} />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-8">
        <Card className="p-6 border">
          <CardHeader className="mb-4">
            <h2 className="text-xl font-semibold">Generation History</h2>
            <p className="text-muted-foreground">
              Review past generation runs and their results
            </p>
          </CardHeader>
          <CardContent>
            <GenerationHistoryList runs={[]} isLoading={true} />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-8">
        <Card className="p-6 border">
          <CardHeader className="mb-4">
            <h2 className="text-xl font-semibold">Generation History</h2>
            <p className="text-muted-foreground">
              Review past generation runs and their results
            </p>
          </CardHeader>
          <CardContent>
            <GenerationHistoryList runs={[]} isLoading={true} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}