// src/components/petitions/SubmitPetitionForm.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { Select } from '@/components/common/Select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/common/Card';
import { api } from '@/lib/api-client';

interface SubmitPetitionFormProps {
  onSuccess: () => void;
}

export default function SubmitPetitionForm({ onSuccess }: SubmitPetitionFormProps) {
  const [query, setQuery] = useState('');
  const [userId, setUserId] = useState('');
  const [context, setContext] = useState('');
  const [priority, setPriority] = useState<'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW' | 'BACKGROUND'>('NORMAL');
  const [targetOutputs, setTargetOutputs] = useState<string>('');
  const [maxCostUsd, setMaxCostUsd] = useState<string>('');
  const [maxApiCalls, setMaxApiCalls] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/v1/petitions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          userId: userId || undefined,
          context: context || undefined,
          priority,
          targetOutputs: targetOutputs.split(',').map((t) => t.trim()).filter(Boolean),
          maxCostUsd: maxCostUsd ? parseFloat(maxCostUsd) : undefined,
          maxApiCalls: maxApiCalls ? parseInt(maxApiCalls) : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit petition');
      }

      const data = await response.json();
      setSuccess(data.data.message);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const priorityOptions = [
    { value: 'CRITICAL', label: 'Critical' },
    { value: 'HIGH', label: 'High' },
    { value: 'NORMAL', label: 'Normal' },
    { value: 'LOW', label: 'Low' },
    { value: 'BACKGROUND', label: 'Background' },
  ];

  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle>Submit a Knowledge Petition</CardTitle>
        <CardDescription>
          Request specific knowledge to be generated for any technology, format, or concept.
          The AI will analyze what already exists and generate exactly what you need.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="query">What knowledge do you need?</Label>
            <Textarea
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Example: I want to build a PowerPoint generator that can create charts with exact specifications"
              rows={4}
              required
              className="mt-1 block w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Describe what you want to achieve or what knowledge you're missing.
              Be as specific as possible about the technology and capabilities you need.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={(val) => setPriority(val as any)}
                options={priorityOptions}
                className="mt-1 block w-full"
              />
            </div>

            <div>
              <Label htmlFor="userId">Your User ID (Optional)</Label>
              <Input
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Your user ID for tracking"
                className="mt-1 block w-full"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="context">Context (Optional)</Label>
            <Textarea
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="What are you building? What will you use this knowledge for?"
              rows={3}
              className="mt-1 block w-full"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="targetOutputs">Desired Output Formats (Optional)</Label>
              <Input
                id="targetOutputs"
                value={targetOutputs}
                onChange={(e) => setTargetOutputs(e.target.value)}
                placeholder="svg, html_canvas, png, pdf"
                className="mt-1 block w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Comma-separated list of formats you want the knowledge to support
              </p>
            </div>

            <div>
              <Label htmlFor="maxCostUsd">Maximum Budget (USD, Optional)</Label>
              <Input
                id="maxCostUsd"
                type="number"
                value={maxCostUsd}
                onChange={(e) => setMaxCostUsd(e.target.value)}
                placeholder="e.g., 5.00"
                className="mt-1 block w-full"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setQuery('');
                setUserId('');
                setContext('');
                setPriority('NORMAL');
                setTargetOutputs('');
                setMaxCostUsd('');
                setMaxApiCalls('');
              }}
            >
              Reset
            </Button>
            <Button
              variant={isLoading ? 'default' : 'outline'}
              type="submit"
              disabled={isLoading || !query.trim()}
              className="px-6 py-2"
            >
              {isLoading ? 'Submitting...' : 'Submit Petition'}
            </Button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded">
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-4 p-4 bg-success/10 text-success rounded">
            <p>{success}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-muted-foreground mb-1">
      {children}
    </label>
  );
}