// src/components/code/CopyButton.tsx
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Check, Copy } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
  variant?: 'default' | 'icon' | 'inline';
}

export function CopyButton({
  text,
  label = 'Copy',
  className,
  variant = 'icon',
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleCopy}
        className={cn(
          'p-2 rounded-md hover:bg-muted transition-colors',
          'text-muted-foreground hover:text-foreground',
          className
        )}
        title={copied ? 'Copied!' : label}
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>
    );
  }

  if (variant === 'inline') {
    return (
      <button
        onClick={handleCopy}
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-md',
          'bg-muted hover:bg-muted/80 transition-colors',
          className
        )}
      >
        {copied ? (
          <>
            <Check className="h-3 w-3 text-green-500" />
            <span className="text-green-500">Copied!</span>
          </>
        ) : (
          <>
            <Copy className="h-3 w-3" />
            <span>{label}</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'px-4 py-2 rounded-lg font-medium transition-colors',
        copied
          ? 'bg-green-500 text-white'
          : 'bg-primary text-primary-foreground hover:bg-primary/90',
        className
      )}
    >
      {copied ? 'Copied!' : label}
    </button>
  );
}
