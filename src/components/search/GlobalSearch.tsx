// src/components/search/GlobalSearch.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';

interface GlobalSearchProps {
  size?: 'small' | 'medium' | 'large';
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

export function GlobalSearch({
  size = 'medium',
  placeholder = 'Search...',
  autoFocus = false,
  className,
}: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/explore?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const sizeClasses = {
    small: 'max-w-xs',
    medium: 'max-w-md',
    large: 'max-w-2xl',
  };

  const inputSizeClasses = {
    small: 'py-2 text-sm',
    medium: 'py-2.5 text-base',
    large: 'py-4 text-lg',
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('relative w-full', sizeClasses[size], className)}
    >
      <Search
        className={cn(
          'absolute left-4 text-muted-foreground',
          size === 'small' ? 'h-4 w-4 top-1/2 -translate-y-1/2' : 'h-5 w-5 top-1/2 -translate-y-1/2'
        )}
      />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn(
          'w-full rounded-lg border bg-background outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all',
          inputSizeClasses[size],
          'pl-12 pr-4'
        )}
      />
    </form>
  );
}
