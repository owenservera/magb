// src/components/petition/PetitionStatus.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Progress } from '@/components/common/Progress';
import { Skeleton } from '@/components/common/Skeleton';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MessageSquare,
  DollarSign,
  Zap,
  Target,
  Brain,
  Search,
  FileText,
} from 'lucide-react';

interface PetitionThread {
  id: string;
  role: string;
  messageType: string;
  content: string;
  data: any;
  createdAt: string;
}

interface PetitionStatusProps {
  petitionId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface PetitionData {
  petition: any;
  threads: PetitionThread[];
  progress: number;
}

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  SUBMITTED: { label: 'Submitted', icon: Clock, color: 'bg-gray-500' },
  DECOMPOSING: { label: 'Decomposing', icon: Brain, color: 'bg-blue-500' },
  ASSESSING: { label: 'Assessing Coverage', icon: Search, color: 'bg-indigo-500' },
  PLANNING: { label: 'Planning', icon: FileText, color: 'bg-purple-500' },
  GENERATING: { label: 'Generating', icon: Loader2, color: 'bg-yellow-500' },
  SYNTHESIZING: { label: 'Synthesizing', icon: Zap, color: 'bg-orange-500' },
  FULFILLED: { label: 'Fulfilled', icon: CheckCircle2, color: 'bg-green-500' },
  PARTIALLY_FULFILLED: { label: 'Partially Fulfilled', icon: AlertCircle, color: 'bg-yellow-600' },
  REJECTED: { label: 'Rejected', icon: AlertCircle, color: 'bg-red-500' },
  CANCELLED: { label: 'Cancelled', icon: AlertCircle, color: 'bg-gray-400' },
};

export function PetitionStatus({
  petitionId,
  autoRefresh = true,
  refreshInterval = 5000,
}: PetitionStatusProps) {
  const [data, setData] = useState<PetitionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const response = await fetch(`/api/v1/petitions?id=${petitionId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch petition status');
      }

      setData(result.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    if (autoRefresh) {
      const interval = setInterval(fetchStatus, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [petitionId, autoRefresh, refreshInterval]);

  if (loading) {
    return <PetitionStatusSkeleton />;
  }

  if (error || !data) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p>{error || 'Failed to load petition status'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { petition, threads, progress } = data;
  const StatusIcon = statusConfig[petition.status]?.icon || Clock;
  const statusColor = statusConfig[petition.status]?.color || 'bg-gray-500';

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Petition Status
            </CardTitle>
            <CardDescription className="line-clamp-2">
              {petition.userQuery}
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className={`${statusColor} text-white border-0`}
          >
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusConfig[petition.status]?.label || petition.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(progress * 100)}%</span>
          </div>
          <Progress value={progress * 100} className="h-2" />
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            icon={DollarSign}
            label="Estimated Cost"
            value={petition.estimatedCostUsd ? `$${petition.estimatedCostUsd.toFixed(2)}` : 'TBD'}
          />
          <StatCard
            icon={Zap}
            label="API Calls"
            value={petition.apiCalls?.toString() || 'TBD'}
          />
          <StatCard
            icon={Clock}
            label="Submitted"
            value={new Date(petition.submittedAt).toLocaleDateString()}
          />
        </div>

        {/* Thread/Activity */}
        {threads.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Activity
            </h4>
            <div className="space-y-3">
              {threads.slice(-5).reverse().map((thread) => (
                <ThreadItem key={thread.id} thread={thread} />
              ))}
            </div>
          </div>
        )}

        {/* Gap Assessment */}
        {petition.gapAssessment && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Search className="h-4 w-4" />
              Knowledge Gaps
            </h4>
            <div className="grid gap-2 md:grid-cols-3 text-sm">
              <div className="p-3 rounded-md bg-green-50 dark:bg-green-950/20">
                <div className="text-green-700 dark:text-green-400 font-medium">
                  {petition.gapAssessment.alreadyExists || 0}
                </div>
                <div className="text-green-600 dark:text-green-500 text-xs">
                  Already Exists
                </div>
              </div>
              <div className="p-3 rounded-md bg-yellow-50 dark:bg-yellow-950/20">
                <div className="text-yellow-700 dark:text-yellow-400 font-medium">
                  {petition.gapAssessment.partiallyExists || 0}
                </div>
                <div className="text-yellow-600 dark:text-yellow-500 text-xs">
                  Needs Refresh
                </div>
              </div>
              <div className="p-3 rounded-md bg-red-50 dark:bg-red-950/20">
                <div className="text-red-700 dark:text-red-400 font-medium">
                  {petition.gapAssessment.missing || 0}
                </div>
                <div className="text-red-600 dark:text-red-500 text-xs">
                  Missing
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="p-4 rounded-lg border bg-card">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        <Icon className="h-4 w-4" />
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function ThreadItem({ thread }: { thread: PetitionThread }) {
  const roleColors: Record<string, string> = {
    system: 'text-blue-600 dark:text-blue-400',
    user: 'text-green-600 dark:text-green-400',
    decomposer: 'text-purple-600 dark:text-purple-400',
    strategist: 'text-orange-600 dark:text-orange-400',
  };

  return (
    <div className="p-3 rounded-md border bg-muted/50">
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-medium ${roleColors[thread.role] || 'text-gray-600'}`}>
          {thread.role}
        </span>
        <span className="text-xs text-muted-foreground">
          {new Date(thread.createdAt).toLocaleString()}
        </span>
      </div>
      <div className="text-sm whitespace-pre-wrap">{thread.content}</div>
    </div>
  );
}

function PetitionStatusSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader>
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-2 w-full" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </CardContent>
    </Card>
  );
}
