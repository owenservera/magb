// src/components/layout/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import {
  Compass,
  Hammer,
  Heart,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const navItems = [
  {
    section: 'Modes',
    items: [
      { icon: Compass, label: 'Explore', href: '/explore' },
      { icon: Hammer, label: 'Build', href: '/build' },
      { icon: Heart, label: 'Health', href: '/health' },
      { icon: Users, label: 'Contribute', href: '/contribute' },
    ],
  },
  {
    section: 'Settings',
    items: [
      { icon: Settings, label: 'Settings', href: '/settings' },
    ],
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useAppStore();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r bg-background transition-all duration-300',
        sidebarOpen ? 'w-60' : 'w-16',
        className
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              M
            </div>
            {sidebarOpen && (
              <span className="text-lg font-semibold">magB</span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          {navItems.map((section) => (
            <div key={section.section} className="mb-6">
              {sidebarOpen && (
                <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.section}
                </h3>
              )}
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname?.startsWith(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                          !sidebarOpen && 'justify-center'
                        )}
                        title={!sidebarOpen ? item.label : undefined}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        {sidebarOpen && <span>{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Collapse toggle */}
        <div className="border-t p-2">
          <button
            onClick={toggleSidebar}
            className="flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
