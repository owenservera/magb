// src/components/code/CodeBlock.tsx
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { CopyButton } from './CopyButton';

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  maxHeight?: number;
  compact?: boolean;
  className?: string;
  title?: string;
}

export function CodeBlock({
  code,
  language = 'text',
  showLineNumbers = false,
  maxHeight,
  compact = false,
  className,
  title,
}: CodeBlockProps) {
  const [isExpanded, setIsExpanded] = useState(!maxHeight);

  const lineCount = code.split('\n').length;
  const isTruncated = maxHeight && lineCount > Math.floor(maxHeight / 24);
  const displayCode = isTruncated && !isExpanded
    ? code.split('\n').slice(0, Math.floor(maxHeight / 24)).join('\n')
    : code;

  return (
    <div className={cn('relative group', className)}>
      {/* Header */}
      {(title || language) && (
        <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b rounded-t-lg">
          <div className="flex items-center gap-2">
            {language && (
              <span className="text-xs font-medium text-muted-foreground uppercase">
                {language}
              </span>
            )}
            {title && (
              <span className="text-sm font-medium">{title}</span>
            )}
          </div>
          <CopyButton text={code} variant="icon" />
        </div>
      )}

      {/* Code content */}
      <div
        className={cn(
          'relative bg-muted overflow-auto',
          !title && 'rounded-lg',
          isTruncated && !isExpanded && 'rounded-b-lg',
          compact ? 'p-2' : 'p-4',
          className
        )}
        style={maxHeight && !isExpanded ? { maxHeight } : {}}
      >
        <pre className="text-sm">
          <code className={cn('font-mono', showLineNumbers ? 'pl-4' : '')}>
            {showLineNumbers ? (
              <div className="flex">
                <div className="flex flex-col items-end pr-4 mr-4 border-r border-muted-foreground/20 select-none">
                  {displayCode.split('\n').map((_, i) => (
                    <span
                      key={i}
                      className="text-xs text-muted-foreground leading-6"
                    >
                      {i + 1}
                    </span>
                  ))}
                </div>
                <div className="flex-1">
                  {displayCode.split('\n').map((line, i) => (
                    <div key={i} className="leading-6">
                      {line || ' '}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              displayCode.split('\n').map((line, i) => (
                <div key={i} className="leading-6">
                  {line || ' '}
                </div>
              ))
            )}
          </code>
        </pre>

        {/* Truncation overlay */}
        {isTruncated && !isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-muted to-transparent flex items-end justify-center pb-4">
            <button
              onClick={() => setIsExpanded(true)}
              className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition"
            >
              Show all {lineCount} lines
            </button>
          </div>
        )}
      </div>

      {/* Copy button (if no header) */}
      {!title && !language && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <CopyButton text={code} variant="icon" />
        </div>
      )}

      {/* Expand button if truncated */}
      {isTruncated && isExpanded && (
        <div className="mt-2 text-center">
          <button
            onClick={() => setIsExpanded(false)}
            className="px-4 py-1.5 text-sm text-muted-foreground hover:text-foreground transition"
          >
            Show less
          </button>
        </div>
      )}
    </div>
  );
}
