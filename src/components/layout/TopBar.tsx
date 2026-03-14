// src/components/layout/TopBar.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { Search, Bell, Moon, Sun, Menu } from 'lucide-react';
import { usePreferencesStore } from '@/stores/preferences-store';

interface TopBarProps {
  className?: string;
}

export function TopBar({ className }: TopBarProps) {
  const router = useRouter();
  const { sidebarOpen, toggleSidebar, darkMode, setDarkMode } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6',
        sidebarOpen ? 'ml-60' : 'ml-16',
        'transition-all duration-300',
        className
      )}
    >
      {/* Mobile menu toggle */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Search */}
      <form onSubmit={handleSubmit} className="flex-1">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search targets, capabilities, algorithms... (⌘K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border bg-background pl-10 pr-4 py-2 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
          />
        </div>
      </form>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          title={darkMode ? 'Light mode' : 'Dark mode'}
        >
          {darkMode ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>

        {/* Notifications */}
        <button
          className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
          title="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* User avatar */}
        <div className="ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
          U
        </div>
      </div>
    </header>
  );
}
