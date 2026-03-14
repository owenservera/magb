// src/app/generate/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/common/Card';
import { api } from '@/lib/api-client';
import { Target } from '@/types';

interface WizardStep {
  id: number;
  title: string;
  content: React.ReactNode;
}

export default function GenerateNewPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [target, setTarget] = useState<string>('');
  const [targetType, setTargetType] = useState<'DATA_FORMAT' | 'PROGRAMMING_LANGUAGE' | 'FILE_FORMAT'>('DATA_FORMAT');
  const [depth, setDepth] = useState<'LAYER_1' | 'LAYER_2' | 'LAYER_3'>('LAYER_1');
  const [budget, setBudget] = useState<number>(10);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Target[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const steps: WizardStep[] = [
    {
      id: 1,
      title: "Select Target",
      content: (
        <>
          <div className="mb-4">
            <Input
              placeholder="Search for a target (e.g., python, json, pptx)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                // Debounce search
                clearTimeout((window as any).searchTimeout);
                (window as any).searchTimeout = setTimeout(() => {
                  if (e.target.value.length >= 2) {
                    searchTargets(e.target.value);
                  } else {
                    setSearchResults([]);
                  }
                }, 300);
              }}
              className="mb-2"
            />
            {searchQuery.length >= 2 && (
              <div className="max-h-60 overflow-y-auto border rounded">
                {searchResults.length > 0 ? (
                  <div className="space-y-1">
                    {searchResults.map((t) => (
                      <Button
                        key={t.id}
                        variant="outline"
                        onClick={() => {
                          setTarget(t.id);
                          setTargetType(t.kind as any);
                          setSearchResults([]);
                          setSearchQuery('');
                        }}
                        className="w-full text-left p-3 hover:bg-primary/10"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: t.kind === 'PROGRAMMING_LANGUAGE' ? '#3b82f6' : '#10b981' }}
                          />
                          <div>
                            <div className="font-medium">{t.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {t.kind} • {t.capability_count} capabilities
                            </div>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground py-4">No targets found. Try a different search.</p>
                )}
              </div>
            )}
          </div>
           <div className="flex items-center gap-3">
             <Select
               value={targetType}
               onValueChange={(val) => setTargetType(val as 'DATA_FORMAT' | 'PROGRAMMING_LANGUAGE' | 'FILE_FORMAT')}
               options={[
                 { value: 'PROGRAMMING_LANGUAGE', label: 'Programming Language' },
                 { value: 'DATA_FORMAT', label: 'Data Format' },
                 { value: 'FILE_FORMAT', label: 'File Format' },
               ]}
             />
           </div>
        </>
      )
    },
    {
      id: 2,
      title: "Select Depth",
      content: (
        <>
          <div className="space-y-4">
            <div className="space-y-3">
              <p className="font-medium">Layer 1: Capability Knowledge</p>
              <p className="text-sm text-muted-foreground">
                What can this technology do? Complete feature inventory.
              </p>
            </div>
            <div className="space-y-3">
              <p className="font-medium">Layer 2: Implementation Knowledge</p>
              <p className="text-sm text-muted-foreground">
                How does each feature actually work? Exact templates and algorithms.
              </p>
            </div>
            <div className="space-y-3">
              <p className="font-medium">Layer 3: Integration Knowledge</p>
              <p className="text-sm text-muted-foreground">
                How do I build complete applications with this? Architecture blueprints.
              </p>
            </div>
          </div>
          <div className="mt-6">
            <Select
              value={depth}
              onValueChange={(val) => setDepth(val as 'LAYER_1' | 'LAYER_2' | 'LAYER_3')}
              options={[
                { value: 'LAYER_1', label: 'Layer 1: Capability Knowledge' },
                { value: 'LAYER_2', label: 'Layer 2: Implementation Knowledge' },
                { value: 'LAYER_3', label: 'Layer 3: Integration Knowledge' },
              ]}
            />
          </div>
        </>
      )
    },
    {
      id: 3,
      title: "Configure Budget",
      content: (
        <>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Maximum Budget (USD)</span>
              <span className="font-mono text-lg">${budget}</span>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              value={budget}
              onChange={(e) => setBudget(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>$1</span>
              <span>$100</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Higher budgets allow for more comprehensive generation and deeper analysis.
            </p>
          </div>
        </>
      )
    }
  ];

  const currentStep = steps.find((s) => s.id === step);

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleNext = () => {
    if (step < steps.length) {
      setStep(step + 1);
    } else {
      handleGenerate();
    }
  };

  const handleGenerate = async () => {
    if (!target) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.generate.start({
        target,
        targetType,
        budgetUsd: budget
      });
      
      if (response.data) {
        router.push(`/generate/runs/${response.data.runId}`);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to start generation');
    } finally {
      setIsLoading(false);
    }
  };

  const searchTargets = async (query: string) => {
    try {
      // Use the existing targets API
      const response = await fetch(`/api/v1/targets?search=${encodeURIComponent(query)}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.data || []);
      }
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">New Generation</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Step {step} of {steps.length}</span>
              <div className="w-2 h-2 rounded-full bg-primary" />
            </div>
          </div>
        </div>

        {currentStep && (
          <Card className="p-6">
            <CardHeader className="mb-4">
              <h2 className="text-xl font-semibold">{currentStep.title}</h2>
              <p className="text-muted-foreground">
                Configure your knowledge generation parameters
              </p>
            </CardHeader>
            <CardContent>
              {currentStep.content}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between pt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={step === 1}
            className="px-4 py-2"
          >
            Previous
          </Button>
          
          <Button
            variant={step === steps.length ? 'default' : 'outline'}
            onClick={handleNext}
            disabled={isLoading || (step === steps.length && !target)}
            className="px-6 py-3"
          >
            {isLoading ? 'Generating...' : step === steps.length ? 'Start Generation' : 'Next'}
          </Button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded">
            <p className="text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}