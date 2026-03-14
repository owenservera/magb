// src/components/layout/CommandPalette.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchStore } from '@/stores/search-store';
import { useAppStore } from '@/stores/app-store';
import { Dialog, DialogContent } from '@/components/common/Modal';
import { Skeleton } from '@/components/common/Skeleton';
import { Search, FileText, Folder, GitGraph, Hammer, Heart, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const quickActions = [
  { label: 'Explore targets', path: '/explore/targets', icon: Folder },
  { label: 'Build something', path: '/build/assemble', icon: Hammer },
  { label: 'Search algorithms', path: '/explore/algorithms', icon: FileText },
  { label: 'View health dashboard', path: '/health', icon: Heart },
  { label: 'Knowledge graph', path: '/explore/graph', icon: GitGraph },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export function CommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, toggleCommandPalette } = useAppStore();
  const { query, setQuery, results, isLoading, setResults, setLoading } = useSearchStore();
  const [activeIndex, setActiveIndex] = useState(0);

  // ⌘K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommandPalette();
      }
      if (e.key === 'Escape') {
        toggleCommandPalette();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleCommandPalette]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!commandPaletteOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prev => (prev + 1) % (quickActions.length + results.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prev => (prev - 1 + quickActions.length + results.length) % (quickActions.length + results.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const allItems = [...quickActions, ...results.map(r => ({ label: r.name, path: getNodePath(r) }))];
        if (allItems[activeIndex]) {
          router.push(allItems[activeIndex].path);
          toggleCommandPalette();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [commandPaletteOpen, activeIndex, results, router, toggleCommandPalette]);

  // Reset active index when query changes
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Search effect
  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    setLoading(true);
    const timeout = setTimeout(() => {
      // Simulated search - in production, this would call the API
      setResults([]);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, setResults, setLoading]);

  const navigate = useCallback((path: string) => {
    router.push(path);
    toggleCommandPalette();
    setQuery('');
  }, [router, toggleCommandPalette, setQuery]);

  const allItems = [
    ...quickActions,
    ...results.map(r => ({
      label: r.name,
      path: getNodePath(r),
      icon: getIconForType(r.type),
      description: r.snippet,
    })),
  ];

  return (
    <Dialog open={commandPaletteOpen} onOpenChange={toggleCommandPalette}>
      <DialogContent className="max-w-xl p-0 gap-0">
        {/* Search Input */}
        <div className="flex items-center border-b px-4 py-3">
          <Search className="mr-3 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search targets, capabilities, algorithms..."
            className="flex-1 bg-transparent outline-none text-base"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs text-muted-foreground">
            <span className="text-xs">ESC</span>
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2">
          {query.length === 0 ? (
            // Show quick actions when no query
            <div>
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Quick Actions
              </div>
              {quickActions.map((action, i) => (
                <button
                  key={action.path}
                  onClick={() => navigate(action.path)}
                  className={cn(
                    'w-full text-left px-2 py-2 rounded-lg flex items-center gap-3 transition',
                    activeIndex === i ? 'bg-muted' : 'hover:bg-muted'
                  )}
                >
                  <action.icon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">{action.label}</span>
                </button>
              ))}
            </div>
          ) : isLoading ? (
            <div className="space-y-2 p-2">
              <Skeleton className="h-10 rounded-lg" />
              <Skeleton className="h-10 rounded-lg" />
              <Skeleton className="h-10 rounded-lg" />
            </div>
          ) : results.length > 0 ? (
            <div>
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Results
              </div>
              {results.map((result, i) => (
                <button
                  key={result.id}
                  onClick={() => navigate(getNodePath(result))}
                  className={cn(
                    'w-full text-left px-2 py-2 rounded-lg flex items-start gap-3 transition',
                    activeIndex === quickActions.length + i ? 'bg-muted' : 'hover:bg-muted'
                  )}
                >
                  {getIconForType(result.type)}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{result.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {result.snippet}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground capitalize shrink-0">
                    {result.type}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              {query.length > 0 ? (
                <p>No results found for "{query}"</p>
              ) : (
                <p>Start typing to search...</p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getNodePath(result: { id: string; type: string }): string {
  switch (result.type) {
    case 'target':
      return `/explore/targets/${result.id.replace('target:', '')}`;
    case 'algorithm':
      return `/explore/algorithms/${encodeURIComponent(result.id)}`;
    case 'concept':
      return `/explore/concepts/${encodeURIComponent(result.id)}`;
    default:
      return `/explore`;
  }
}

function getIconForType(type: string) {
  const icons: Record<string, React.ElementType> = {
    target: Folder,
    algorithm: FileText,
    structure: GitGraph,
    concept: Search,
    blueprint: Hammer,
  };
  const Icon = icons[type] || FileText;
  return <Icon className="h-5 w-5 text-muted-foreground shrink-0" />;
}
