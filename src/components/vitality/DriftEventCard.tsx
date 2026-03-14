// src/components/vitality/DriftEventCard.tsx
'use client';

import { cn } from '@/lib/utils';
import type { DriftEvent } from '@/types';

interface DriftEventCardProps {
  event: DriftEvent;
  compact?: boolean;
  onResolve?: (eventId: string) => void;
}

export function DriftEventCard({ event, compact = false, onResolve }: DriftEventCardProps) {
  const severityStyles = {
    low: 'border-l-blue-500 bg-blue-50 dark:bg-blue-950',
    medium: 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950',
    high: 'border-l-orange-500 bg-orange-50 dark:bg-orange-950',
    critical: 'border-l-red-500 bg-red-50 dark:bg-red-950',
  };

  const severityIcons = {
    low: '📝',
    medium: '⚠️',
    high: '🚨',
    critical: '🔴',
  };

  const date = new Date(event.created_at);
  const daysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border-l-2',
          severityStyles[event.severity]
        )}
      >
        <span className="text-lg">{severityIcons[event.severity]}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{event.title}</p>
          <p className="text-xs text-muted-foreground">
            {event.affected_nodes.toLocaleString()} nodes affected • {daysAgo}d ago
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'p-4 rounded-lg border-l-4',
        severityStyles[event.severity]
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{severityIcons[event.severity]}</span>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">{event.title}</h4>
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium capitalize',
                  event.severity === 'low' && 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
                  event.severity === 'medium' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
                  event.severity === 'high' && 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
                  event.severity === 'critical' && 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
                )}
              >
                {event.severity}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {event.description}
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span>{event.affected_nodes.toLocaleString()} nodes affected</span>
              <span>•</span>
              <span>{daysAgo} days ago</span>
              {event.target_id && (
                <>
                  <span>•</span>
                  <span>Target: {event.target_id}</span>
                </>
              )}
            </div>
          </div>
        </div>
        {onResolve && (
          <button
            onClick={() => onResolve(event.event_id)}
            className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
          >
            Mark resolved
          </button>
        )}
      </div>
    </div>
  );
}
