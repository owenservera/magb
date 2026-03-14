// src/components/knowledge/CapabilityTree.tsx
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Capability } from '@/types';

interface CapabilityTreeProps {
  capabilities: Capability[];
  searchFilter?: string;
  complexityFilter?: string | null;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}

export function CapabilityTree({
  capabilities,
  searchFilter = '',
  complexityFilter = null,
  selectedId = null,
  onSelect,
}: CapabilityTreeProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    basic: true,
    intermediate: true,
    advanced: true,
    expert: true,
  });

  // Group capabilities by complexity
  const grouped = capabilities.reduce((acc, cap) => {
    const complexity = cap.complexity || 'basic';
    if (!acc[complexity]) acc[complexity] = [];
    acc[complexity].push(cap);
    return acc;
  }, {} as Record<string, Capability[]>);

  // Filter capabilities
  const filterCapability = (cap: Capability) => {
    // Search filter
    if (searchFilter) {
      const search = searchFilter.toLowerCase();
      const matchesName = cap.name.toLowerCase().includes(search);
      const matchesDesc = cap.description.toLowerCase().includes(search);
      if (!matchesName && !matchesDesc) return false;
    }

    // Complexity filter
    if (complexityFilter && cap.complexity !== complexityFilter) {
      return false;
    }

    return true;
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  const complexityOrder = ['trivial', 'basic', 'intermediate', 'advanced', 'expert'];
  const complexityIcons: Record<string, string> = {
    trivial: '🟢',
    basic: '🟢',
    intermediate: '🟡',
    advanced: '🟠',
    expert: '🔴',
  };

  return (
    <div className="space-y-4">
      {complexityOrder.map(complexity => {
        const caps = grouped[complexity]?.filter(filterCapability) || [];
        if (caps.length === 0) return null;

        const isExpanded = expandedGroups[complexity];

        return (
          <div key={complexity}>
            {/* Group Header */}
            <button
              onClick={() => toggleGroup(complexity)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/50 transition"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{complexityIcons[complexity] || '⚪'}</span>
                <span className="text-sm font-semibold capitalize">{complexity}</span>
                <span className="text-xs text-muted-foreground">({caps.length})</span>
              </div>
              <span className="text-muted-foreground">
                {isExpanded ? '▼' : '▶'}
              </span>
            </button>

            {/* Capabilities */}
            {isExpanded && (
              <div className="mt-1 space-y-1 pl-4">
                {caps.map(cap => (
                  <button
                    key={cap.id}
                    onClick={() => onSelect?.(cap.id)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-lg text-sm transition',
                      selectedId === cap.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    )}
                  >
                    <div className="font-medium truncate">{cap.name}</div>
                    <div
                      className={cn(
                        'text-xs truncate',
                        selectedId === cap.id
                          ? 'text-primary-foreground/80'
                          : 'text-muted-foreground'
                      )}
                    >
                      {cap.description}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* No results */}
      {Object.values(grouped).flat().filter(filterCapability).length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No capabilities match your filters</p>
        </div>
      )}
    </div>
  );
}
