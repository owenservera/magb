// src/components/common/EmptyState.tsx
'use client';

import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title = 'No results',
  description = 'Nothing to show here yet.',
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center',
        className
      )}
    >
      {icon || (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <span className="text-2xl">📭</span>
        </div>
      )}
      {title && (
        <h3 className="mt-2 text-lg font-semibold">{title}</h3>
      )}
      {description && (
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
