// src/components/vitality/HealingQueueView.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/common/Skeleton';
import { VitalityBadge } from './VitalityBadge';

interface HealingItem {
  id: string;
  name: string;
  type: string;
  vitality: number;
  daysStale: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export function HealingQueueView() {
  const { data: queueData, isLoading } = useQuery({
    queryKey: ['healing', 'queue'],
    queryFn: async () => {
      // This would typically come from a dedicated healing queue endpoint
      // For now, we'll simulate with drift events
      const response = await api.vitality.driftEvents({ limit: 10 });
      return response.data.map((event) => ({
        id: event.event_id,
        name: event.title,
        type: 'drift_event',
        vitality: event.severity === 'critical' ? 0.1 : event.severity === 'high' ? 0.3 : event.severity === 'medium' ? 0.5 : 0.7,
        daysStale: Math.floor((Date.now() - new Date(event.created_at).getTime()) / (1000 * 60 * 60 * 24)),
        priority: event.severity,
      }));
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    );
  }

  const queue = queueData || [];

  if (queue.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <div className="text-3xl mb-2">✅</div>
        <p>No items in the healing queue</p>
        <p className="text-sm mt-1">All knowledge is up to date!</p>
      </div>
    );
  }

  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sortedQueue = [...queue].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  return (
    <div className="space-y-2">
      {sortedQueue.map((item) => (
        <div
          key={item.id}
          className={cn(
            'flex items-center gap-4 p-3 rounded-lg border',
            item.priority === 'critical' && 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950',
            item.priority === 'high' && 'border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950',
            item.priority === 'medium' && 'border-yellow-300 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950',
            item.priority === 'low' && 'border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950',
          )}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{item.name}</span>
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium capitalize',
                  item.priority === 'critical' && 'bg-red-100 text-red-700',
                  item.priority === 'high' && 'bg-orange-100 text-orange-700',
                  item.priority === 'medium' && 'bg-yellow-100 text-yellow-700',
                  item.priority === 'low' && 'bg-blue-100 text-blue-700',
                )}
              >
                {item.priority}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span>{item.type}</span>
              <span>•</span>
              <span>{item.daysStale} days stale</span>
            </div>
          </div>
          <VitalityBadge score={item.vitality} size="medium" showLabel />
          <button className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition">
            Heal
          </button>
        </div>
      ))}
    </div>
  );
}
