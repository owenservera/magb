// src/components/petitions/PetitionList.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/common/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { api } from '@/lib/api-client';

interface PetitionListProps {
  statusFilter?: string;
}

export default function PetitionList({ statusFilter = 'all' }: PetitionListProps) {
  const [petitions, setPetitions] = useState<Array<any>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    setLoading(true);
    fetch(`/api/v1/petitions`)
      .then(response => {
        if (!isMounted) return;
        if (!response.ok) {
          throw new Error('Failed to fetch petitions');
        }
        return response.json();
      })
      .then(data => {
        if (!isMounted) return;
        setPetitions(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load petitions');
        console.error('Error fetching petitions:', err);
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [statusFilter]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2 text-muted-foreground">Loading petitions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded">
        <p>{error}</p>
      </div>
    );
  }

  if (petitions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No petitions found. Be the first to submit one!</p>
        <Button
          variant="outline"
          onClick={() => {
            console.log('Would navigate to submit petition page');
          }}
        >
          Submit Petition
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {petitions.map((petition) => (
        <PetitionCard key={petition.id} petition={petition} />
      ))}
    </div>
  );
}

interface PetitionCardProps {
  petition: any;
}

function PetitionCard({ petition }: PetitionCardProps) {
  const statusBadgeMap: Record<string, string> = {
    SUBMITTED: 'bg-muted/10 text-muted-foreground',
    ASSESSING: 'bg-accent/10 text-accent',
    PLANNING: 'bg-primary/10 text-primary',
    IN_PROGRESS: 'bg-warning/10 text-warning',
    FULFILLED: 'bg-success/10 text-success',
    REJECTED: 'bg-destructive/10 text-destructive',
    CANCELLED: 'bg-muted/10 text-muted-foreground',
  };

  return (
    <Card className="p-6 hover:shadow hover:border-primary/20 transition-shadow">
      <CardHeader className="flex items-center justify-between pb-4">
        <div className="flex-1">
          <h3 className="font-semibold">{petition.userQuery}</h3>
          <p className="text-sm text-muted-foreground">
            Submitted {new Date(petition.createdAt).toLocaleDateString()} by{' '}
            {petition.userId || 'Anonymous'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className={statusBadgeMap[petition.status] || 'bg-muted/10 text-muted-foreground'}
          >
            {petition.status}
          </Badge>
          {petition.estimatedCostUsd !== null && (
            <span className="text-xs text-muted-foreground ml-2">
              ~${petition.estimatedCostUsd.toFixed(2)}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {petition.context && (
          <div>
            <p className="font-medium mb-1">Context</p>
            <p className="text-sm text-muted-foreground">{petition.context}</p>
          </div>
        )}
        {petition.targetOutputs && petition.targetOutputs.length > 0 && (
          <div>
            <p className="font-medium mb-1">Target Outputs</p>
            <div className="flex flex-wrap gap-2">
              {petition.targetOutputs.map((output: string) => (
                <span key={output} className="px-2 py-0.5 bg-muted/10 text-xs rounded">
                  {output}
                </span>
              ))}
            </div>
          </div>
        )}
        {petition.gapAssessment && (
          <div>
            <p className="font-medium mb-1">Knowledge Assessment</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>Total Requirements:</div>
              <div className="text-right">{petition.gapAssessment?.totalRequirements || 0}</div>
              <div>Already Exists:</div>
              <div className="text-right">{petition.gapAssessment?.alreadyExists || 0}</div>
              <div>Needs Refresh:</div>
              <div className="text-right">{petition.gapAssessment?.partiallyExists || 0}</div>
              <div>Missing:</div>
              <div className="text-right font-medium">{petition.gapAssessment?.missing || 0}</div>
            </div>
          </div>
        )}
      </CardContent>
      <CardContent className="pt-4 border-t">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              console.log(`Would navigate to petition ${petition.id} details`);
            }}
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}