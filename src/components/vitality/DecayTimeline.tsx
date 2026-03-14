// src/components/vitality/DecayTimeline.tsx
'use client';

import { cn } from '@/lib/utils';

interface DecayTimelineProps {
  createdAt?: string;
  lastUpdated?: string;
  nextReview?: string;
  className?: string;
}

export function DecayTimeline({
  createdAt,
  lastUpdated,
  nextReview,
  className,
}: DecayTimelineProps) {
  const now = new Date();
  const created = createdAt ? new Date(createdAt) : null;
  const updated = lastUpdated ? new Date(lastUpdated) : null;
  const review = nextReview ? new Date(nextReview) : null;

  // Calculate days since last update
  const daysSinceUpdate = updated
    ? Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Calculate days until review
  const daysUntilReview = review
    ? Math.floor((review.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-muted" />
        
        {/* Created point */}
        {created && (
          <div className="relative flex items-center gap-3 pl-10 py-2">
            <div className="absolute left-3 w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-sm text-muted-foreground">
              Created {created.toLocaleDateString()}
            </span>
          </div>
        )}

        {/* Updated point */}
        {updated && (
          <div className="relative flex items-center gap-3 pl-10 py-2">
            <div className="absolute left-3 w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm">
              Last updated {updated.toLocaleDateString()}
              {daysSinceUpdate != null && (
                <span className="text-muted-foreground ml-1">
                  ({daysSinceUpdate} days ago)
                </span>
              )}
            </span>
          </div>
        )}

        {/* Review point */}
        {review && (
          <div className="relative flex items-center gap-3 pl-10 py-2">
            <div
              className={cn(
                'absolute left-3 w-2 h-2 rounded-full',
                daysUntilReview != null && daysUntilReview < 0
                  ? 'bg-red-500'
                  : daysUntilReview != null && daysUntilReview < 7
                    ? 'bg-yellow-500'
                    : 'bg-gray-400'
              )}
            />
            <span className="text-sm">
              Review due {review.toLocaleDateString()}
              {daysUntilReview != null && (
                <span
                  className={cn(
                    'ml-1',
                    daysUntilReview < 0
                      ? 'text-red-500'
                      : daysUntilReview < 7
                        ? 'text-yellow-500'
                        : 'text-muted-foreground'
                  )}
                >
                  ({daysUntilReview < 0 ? `${Math.abs(daysUntilReview)} days overdue` : `in ${daysUntilReview} days`})
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Decay indicator */}
      {daysSinceUpdate != null && (
        <div className="mt-4 p-3 rounded-lg bg-muted/50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Knowledge decay</span>
            <span
              className={cn(
                'text-sm font-medium',
                daysSinceUpdate < 30
                  ? 'text-green-600'
                  : daysSinceUpdate < 90
                    ? 'text-yellow-600'
                    : daysSinceUpdate < 180
                      ? 'text-orange-600'
                      : 'text-red-600'
              )}
            >
              {daysSinceUpdate < 30
                ? 'Fresh'
                : daysSinceUpdate < 90
                  ? 'Aging'
                  : daysSinceUpdate < 180
                    ? 'Stale'
                    : 'Critical'}
            </span>
          </div>
          <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all',
                daysSinceUpdate < 30
                  ? 'bg-green-500'
                  : daysSinceUpdate < 90
                    ? 'bg-yellow-500'
                    : daysSinceUpdate < 180
                      ? 'bg-orange-500'
                      : 'bg-red-500'
              )}
              style={{ width: `${Math.min((daysSinceUpdate / 365) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
