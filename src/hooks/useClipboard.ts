// src/hooks/useClipboard.ts
// Copy to clipboard hook

import { useState, useCallback } from 'react';

interface UseClipboardOptions {
  timeout?: number;
  onCopy?: () => void;
  onError?: (error: Error) => void;
}

export function useClipboard(options: UseClipboardOptions = {}) {
  const { timeout = 2000, onCopy, onError } = options;
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        onCopy?.();
        setError(null);

        setTimeout(() => {
          setCopied(false);
        }, timeout);

        return true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to copy');
        setError(error);
        onError?.(error);
        return false;
      }
    },
    [timeout, onCopy, onError]
  );

  return { copied, error, copy };
}
