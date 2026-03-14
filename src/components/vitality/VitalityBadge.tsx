// src/components/vitality/VitalityBadge.tsx
'use client';

import { cn } from '@/lib/utils';
import { getVitalityStyle, getVitalityPercentage } from '@/lib/vitality-color';

interface VitalityBadgeProps {
  score: number | null | undefined;
  showLabel?: boolean;
  size?: 'tiny' | 'small' | 'medium' | 'large';
  className?: string;
}

export function VitalityBadge({
  score,
  showLabel = false,
  size = 'small',
  className,
}: VitalityBadgeProps) {
  if (score == null) return null;

  const style = getVitalityStyle(score);

  const sizeClasses = {
    tiny: 'w-2 h-2',
    small: 'w-3 h-3',
    medium: 'w-4 h-4',
    large: 'w-6 h-6',
  };

  return (
    <div
      className={cn('flex items-center gap-1.5', className)}
      title={`${style.label}: ${(score * 100).toFixed(1)}% - ${style.description}`}
    >
      <div
        className={cn(
          'rounded-full',
          sizeClasses[size],
          style.bgColor
        )}
      />
      {showLabel && (
        <span className={cn('text-xs font-medium', style.color)}>
          {style.label} ({getVitalityPercentage(score)})
        </span>
      )}
    </div>
  );
}
