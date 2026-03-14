// src/components/vitality/VitalityGauge.tsx
'use client';

import { cn } from '@/lib/utils';
import { getVitalityStyle, getVitalityPercentage } from '@/lib/vitality-color';

interface VitalityGaugeProps {
  score: number | null | undefined;
  label?: string;
  description?: string;
  size?: 'compact' | 'medium' | 'large';
  color?: 'auto' | 'blue' | 'green' | 'purple';
  className?: string;
}

export function VitalityGauge({
  score,
  label = 'Vitality',
  description,
  size = 'medium',
  color = 'auto',
  className,
}: VitalityGaugeProps) {
  const percentage = score != null ? Math.round(score * 100) : 0;
  const rotation = percentage * 3.6; // 360 degrees for 100%

  const sizeClasses = {
    compact: {
      container: 'w-16 h-16',
      gauge: 'w-14 h-14',
      text: 'text-xs',
      label: 'text-xs',
    },
    medium: {
      container: 'w-24 h-24',
      gauge: 'w-20 h-20',
      text: 'text-xl',
      label: 'text-sm',
    },
    large: {
      container: 'w-32 h-32',
      gauge: 'w-28 h-28',
      text: 'text-3xl',
      label: 'text-base',
    },
  };

  const getColor = () => {
    if (color !== 'auto') {
      const colors = {
        blue: 'text-blue-500',
        green: 'text-green-500',
        purple: 'text-purple-500',
      };
      return colors[color];
    }
    return getVitalityStyle(score)?.color || 'text-gray-500';
  };

  const strokeColor = color !== 'auto' 
    ? { blue: '#3B82F6', green: '#22C55E', purple: '#A855F7' }[color]
    : getVitalityStyle(score)?.bgColor.replace('bg-', '') === 'bg-green-500' 
      ? '#22C55E' 
      : getVitalityStyle(score)?.bgColor.replace('bg-', '') === 'bg-yellow-500'
        ? '#EAB308'
        : getVitalityStyle(score)?.bgColor.replace('bg-', '') === 'bg-orange-500'
          ? '#F97316'
          : '#EF4444';

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className={cn('relative', sizeClasses[size].container)}>
        {/* Background circle */}
        <svg className={sizeClasses[size].gauge} viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="12"
          />
          {/* Progress arc */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={strokeColor || 'currentColor'}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 40}`}
            strokeDashoffset={`${2 * Math.PI * 40 * (1 - percentage / 100)}`}
            transform="rotate(-90 50 50)"
            className="transition-all duration-500"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('font-bold', sizeClasses[size].text, getColor())}>
            {getVitalityPercentage(score)}
          </span>
        </div>
      </div>
      <div className="mt-2 text-center">
        <div className={cn('font-medium', sizeClasses[size].label)}>
          {label}
        </div>
        {description && (
          <div className="text-xs text-muted-foreground mt-0.5">
            {description}
          </div>
        )}
      </div>
    </div>
  );
}
