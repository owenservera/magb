// src/components/petition/PetitionForm.tsx
'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { Select } from '@/components/common/Select';
import { Badge } from '@/components/common/Badge';
import { Loader2, Send, DollarSign, Zap } from 'lucide-react';

interface PetitionFormData {
  query: string;
  priority: 'NORMAL' | 'HIGH' | 'CRITICAL' | 'LOW' | 'BACKGROUND';
  context: string;
  targetOutputs: string;
  maxCostUsd: string;
  maxApiCalls: string;
}

interface PetitionFormProps {
  onSubmit?: (data: PetitionFormData) => Promise<void>;
  userId?: string;
}

export function PetitionForm({ onSubmit, userId }: PetitionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<PetitionFormData>({
    query: '',
    priority: 'NORMAL',
    context: '',
    targetOutputs: '',
    maxCostUsd: '',
    maxApiCalls: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (onSubmit) {
        await onSubmit(formData);
      } else {
        // Default submission to API
        const response = await fetch('/api/v1/petitions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: formData.query,
            userId,
            priority: formData.priority,
            context: formData.context,
            targetOutputs: formData.targetOutputs
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
            maxCostUsd: formData.maxCostUsd
              ? parseFloat(formData.maxCostUsd)
              : undefined,
            maxApiCalls: formData.maxApiCalls
              ? parseInt(formData.maxApiCalls, 10)
              : undefined,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to submit petition');
        }

        // Reset form on success
        setFormData({
          query: '',
          priority: 'NORMAL',
          context: '',
          targetOutputs: '',
          maxCostUsd: '',
          maxApiCalls: '',
        });
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    field: keyof PetitionFormData,
    value: string,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full max-w-3xl">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Submit a Petition</CardTitle>
          <CardDescription>
            Describe what knowledge you need the database to learn. The AI will
            decompose your request, check existing coverage, and generate exactly
            what's missing.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Query */}
          <div className="space-y-2">
            <label
              htmlFor="query"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              What do you need to know? *
            </label>
            <Textarea
              id="query"
              placeholder="e.g., I want to replicate Photoshop's gradient tool, including linear, radial, and angular gradients with color interpolation in different color spaces..."
              value={formData.query}
              onChange={(e) => handleChange('query', e.target.value)}
              required
              rows={5}
              className="resize-none"
            />
          </div>

          {/* Context */}
          <div className="space-y-2">
            <label
              htmlFor="context"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Context (optional)
            </label>
            <Input
              id="context"
              placeholder="e.g., Building a browser-based design tool"
              value={formData.context}
              onChange={(e) => handleChange('context', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Help the AI understand your use case for better decomposition.
            </p>
          </div>

          {/* Target Outputs */}
          <div className="space-y-2">
            <label
              htmlFor="targetOutputs"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Target Outputs (optional)
            </label>
            <Input
              id="targetOutputs"
              placeholder="e.g., svg, html_canvas, png"
              value={formData.targetOutputs}
              onChange={(e) => handleChange('targetOutputs', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated list of desired output formats.
            </p>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <label
              htmlFor="priority"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Priority
            </label>
            <Select
              id="priority"
              value={formData.priority}
              onValueChange={(value) =>
                handleChange('priority', value as PetitionFormData['priority'])
              }
              options={[
                { value: 'BACKGROUND', label: 'Background', description: 'Process when idle' },
                { value: 'LOW', label: 'Low', description: 'Nice to have' },
                { value: 'NORMAL', label: 'Normal', description: 'Standard priority' },
                { value: 'HIGH', label: 'High', description: 'Important, process soon' },
                { value: 'CRITICAL', label: 'Critical', description: 'Blocking, needs immediate attention' },
              ]}
            />
          </div>

          {/* Budget Constraints */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="maxCostUsd"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Max Cost (USD)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="maxCostUsd"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="5.00"
                  className="pl-8"
                  value={formData.maxCostUsd}
                  onChange={(e) => handleChange('maxCostUsd', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="maxApiCalls"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Max API Calls
              </label>
              <div className="relative">
                <Zap className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="maxApiCalls"
                  type="number"
                  min="0"
                  placeholder="50"
                  className="pl-8"
                  value={formData.maxApiCalls}
                  onChange={(e) => handleChange('maxApiCalls', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            <Badge variant="outline" className="mr-2">AI-Powered</Badge>
            Your petition will be decomposed into structured requirements
          </div>
          <Button type="submit" disabled={isSubmitting || !formData.query.trim()}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit Petition
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
