// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { TooltipProvider } from '@/components/common/Tooltip';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { AppShell } from '@/components/layout/AppShell';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'magB Platform - The Universal Knowledge Engine',
  description: 'Complete generative knowledge for programming languages, file formats, and tools. Everything you need to build anything.',
  keywords: ['knowledge base', 'programming', 'file formats', 'algorithms', 'documentation'],
};

// Create a new QueryClient for each request
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    return makeQueryClient();
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = getQueryClient();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <AppShell>
                {children}
              </AppShell>
            </TooltipProvider>
            <ReactQueryDevtools initialIsOpen={false} />
          </QueryClientProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
