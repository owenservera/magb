// src/components/ai/SendToAIButton.tsx
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { CopyButton } from '@/components/code/CopyButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/common/Modal';
import { CodeBlock } from '@/components/code/CodeBlock';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Bot } from 'lucide-react';

interface SendToAIButtonProps {
  context: {
    type: string;
    id: string;
    language?: string;
  };
  label?: string;
  className?: string;
}

export function SendToAIButton({
  context,
  label = 'Send to AI',
  className,
}: SendToAIButtonProps) {
  const [open, setOpen] = useState(false);

  const { data: aiContext, isLoading } = useQuery({
    queryKey: ['ai-context', context],
    queryFn: () => {
      if (context.type === 'target') {
        return api.ai.systemPrompt(context.id);
      }
      return api.ai.context({
        target: context.id,
        task: 'Generate implementation code',
        implementation_language: context.language,
      });
    },
    enabled: false,
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className={cn(
            'inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg',
            'bg-purple-100 text-purple-700 hover:bg-purple-200',
            'dark:bg-purple-900 dark:text-purple-300 dark:hover:bg-purple-800',
            'transition-colors',
            className
          )}
        >
          <Bot className="h-4 w-4" />
          {label}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>AI Context</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Copy this context and paste it into your AI assistant (ChatGPT, Claude, etc.) 
            to get expert-level implementation help.
          </p>
          
          {isLoading ? (
            <div className="h-64 rounded-lg bg-muted animate-pulse" />
          ) : aiContext ? (
            <div className="relative">
              <div className="absolute top-2 right-2 z-10">
                <CopyButton text={aiContext} variant="inline" label="Copy context" />
              </div>
              <CodeBlock
                code={aiContext}
                language="markdown"
                maxHeight={400}
              />
            </div>
          ) : (
            <div className="h-64 rounded-lg bg-muted flex items-center justify-center">
              <p className="text-muted-foreground">Click to generate AI context</p>
            </div>
          )}
          
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (aiContext) {
                  navigator.clipboard.writeText(aiContext);
                }
              }}
              disabled={!aiContext}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition"
            >
              Copy to Clipboard
            </button>
            <button
              onClick={() => {
                if (aiContext) {
                  const blob = new Blob([aiContext], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'ai-context.txt';
                  a.click();
                }
              }}
              disabled={!aiContext}
              className="px-4 py-2 border rounded-lg hover:bg-muted transition disabled:opacity-50"
            >
              Download
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
