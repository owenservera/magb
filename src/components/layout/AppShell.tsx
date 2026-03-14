// src/components/layout/AppShell.tsx
'use client';

import { ReactNode, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { CommandPalette } from './CommandPalette';
import { useAppStore } from '@/stores/app-store';
import { usePreferencesStore } from '@/stores/preferences-store';

interface AppShellProps {
  children: ReactNode;
  className?: string;
}

export function AppShell({ children, className }: AppShellProps) {
  const { darkMode, setDarkMode } = useAppStore();
  const { theme } = usePreferencesStore();

  // Handle theme
  useEffect(() => {
    const root = document.documentElement;
    
    // Check system preference if theme is 'system'
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = theme === 'dark' || (theme === 'system' && prefersDark) || darkMode;
    
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    setDarkMode(isDark);
  }, [theme, darkMode, setDarkMode]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className={cn('transition-all duration-300', 'lg:pl-0')}>
        <TopBar />
        <main className={cn('p-6', className)}>
          {children}
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
