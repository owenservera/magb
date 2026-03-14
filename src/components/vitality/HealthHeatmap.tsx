// src/components/vitality/HealthHeatmap.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { getVitalityStyle } from '@/lib/vitality-color';
import { Skeleton } from '@/components/common/Skeleton';
import type { Target } from '@/types';

interface TargetHealth {
  id: string;
  name: string;
  vitality: number;
}

export function HealthHeatmap() {
  const { data: targetsData, isLoading } = useQuery({
    queryKey: ['targets', 'health'],
    queryFn: async () => {
      const response = await api.targets.list({ limit: 100 });
      return response.data.map((target: Target) => ({
        id: target.id,
        name: target.name,
        vitality: target.vitality?.overall ?? 0.5,
      }));
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {Array.from({ length: 24 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded" />
        ))}
      </div>
    );
  }

  const targets = targetsData || [];

  return (
    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
      {targets.map((target) => {
        const style = getVitalityStyle(target.vitality);
        return (
          <div
            key={target.id}
            className={cn(
              'aspect-square rounded-lg flex items-center justify-center cursor-pointer transition-transform hover:scale-105',
              style.bgColor
            )}
            title={`${target.name}: ${style.label} (${Math.round(target.vitality * 100)}%)`}
          >
            <span className="text-xs font-medium text-white drop-shadow">
              {target.name.substring(0, 3).toUpperCase()}
            </span>
          </div>
        );
      })}
    </div>
  );
}
