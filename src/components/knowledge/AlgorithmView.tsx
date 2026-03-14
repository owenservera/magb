// src/components/knowledge/AlgorithmView.tsx
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { CodeBlock } from '@/components/code/CodeBlock';
import { CopyButton } from '@/components/code/CopyButton';
import type { Algorithm, AlgorithmContent } from '@/types';

interface AlgorithmViewProps {
  algorithm: Algorithm;
  preferredLanguage?: string;
  expanded?: boolean;
  className?: string;
}

export function AlgorithmView({
  algorithm,
  preferredLanguage = 'python',
  expanded = true,
  className,
}: AlgorithmViewProps) {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [showOptimizations, setShowOptimizations] = useState(false);
  const [activeImplLang, setActiveImplLang] = useState(preferredLanguage);

  const content = (algorithm.content || algorithm) as AlgorithmContent;
  const impl = algorithm.preferred_implementation ||
               content.implementations?.[activeImplLang] ||
               content.implementations?.[Object.keys(content.implementations || {})[0]];

  const availableLanguages = Object.keys(content.implementations || {});

  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      {/* Algorithm Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 text-left bg-card hover:bg-muted/50 transition flex items-center justify-between"
      >
        <div>
          <h3 className="text-lg font-semibold">
            {content.name || algorithm.name}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {content.purpose}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {content.complexity && (
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Time: {content.complexity.time} · Space: {content.complexity.space}
            </span>
          )}
          <span className="text-muted-foreground">
            {isExpanded ? '▼' : '▶'}
          </span>
        </div>
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 space-y-6">
          {/* Mathematical Foundation */}
          {content.mathematical_foundation && (
            <section>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Mathematical Foundation
              </h4>
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                {content.mathematical_foundation.description && (
                  <p className="text-sm">{content.mathematical_foundation.description}</p>
                )}
                {content.mathematical_foundation.formulas?.map((formula, i) => (
                  <div key={i} className="border-l-2 border-blue-400 pl-3">
                    <div className="text-sm font-medium">{formula.name}</div>
                    <code className="text-sm font-mono block mt-1 text-blue-700 dark:text-blue-300">
                      {formula.formula_text || formula.formula}
                    </code>
                    {formula.variables && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {Object.entries(formula.variables).map(([v, meaning]) => (
                          <span key={v} className="mr-3">
                            <code>{v}</code> = {meaning as string}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Implementation */}
          {impl && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Implementation
                </h4>
                <div className="flex items-center gap-2">
                  {availableLanguages.length > 1 && (
                    <div className="flex rounded-lg border overflow-hidden">
                      {availableLanguages.map(lang => (
                        <button
                          key={lang}
                          onClick={() => setActiveImplLang(lang)}
                          className={cn(
                            'px-3 py-1 text-xs transition',
                            activeImplLang === lang
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-muted'
                          )}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  )}
                  <CopyButton text={impl.code} />
                </div>
              </div>
              <CodeBlock
                code={impl.code}
                language={activeImplLang}
                showLineNumbers
                maxHeight={400}
              />

              {/* Usage example */}
              {impl.usage_example && (
                <div className="mt-3">
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    Usage:
                  </div>
                  <CodeBlock
                    code={impl.usage_example}
                    language={activeImplLang}
                    compact
                  />
                </div>
              )}
            </section>
          )}

          {/* Parameters */}
          {content.parameters?.length > 0 && (
            <section>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Parameters
              </h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-4 py-2">Name</th>
                      <th className="text-left px-4 py-2">Type</th>
                      <th className="text-left px-4 py-2">Range</th>
                      <th className="text-left px-4 py-2">Default</th>
                      <th className="text-left px-4 py-2">Effect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {content.parameters.map((param, i) => (
                      <tr key={i} className="hover:bg-muted/30">
                        <td className="px-4 py-2 font-mono text-xs">{param.name}</td>
                        <td className="px-4 py-2 text-xs">{param.type}</td>
                        <td className="px-4 py-2 text-xs">
                          {param.range ? `${param.range.min} – ${param.range.max}` : '—'}
                        </td>
                        <td className="px-4 py-2 text-xs font-mono">{param.default ?? '—'}</td>
                        <td className="px-4 py-2 text-xs text-muted-foreground">{param.effect}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Test Vectors */}
          {content.test_vectors?.length > 0 && (
            <section>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Test Vectors
              </h4>
              <div className="space-y-2">
                {content.test_vectors.map((tv, i) => (
                  <div key={i} className="border rounded-lg p-3 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                    <div className="text-sm font-medium">{tv.description}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Input:</div>
                        <code className="text-xs font-mono block bg-white dark:bg-black rounded p-2">
                          {JSON.stringify(tv.input, null, 2)}
                        </code>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Expected Output:</div>
                        <code className="text-xs font-mono block bg-white dark:bg-black rounded p-2">
                          {JSON.stringify(tv.expected_output, null, 2)}
                        </code>
                      </div>
                    </div>
                    {tv.tolerance && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Tolerance: {tv.tolerance}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Edge Cases */}
          {content.edge_cases?.length > 0 && (
            <section>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Edge Cases
              </h4>
              <div className="space-y-2">
                {content.edge_cases.map((ec, i) => (
                  <div key={i} className="border rounded-lg p-3 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950">
                    <div className="text-sm font-medium">{ec.case}</div>
                    <p className="text-xs text-muted-foreground mt-1">{ec.problem}</p>
                    <p className="text-xs mt-1"><strong>Solution:</strong> {ec.solution}</p>
                    {ec.code && (
                      <CodeBlock code={ec.code} language={activeImplLang} compact className="mt-2" />
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Optimizations (collapsible) */}
          {content.optimizations?.length > 0 && (
            <section>
              <button
                onClick={() => setShowOptimizations(!showOptimizations)}
                className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2 hover:text-foreground"
              >
                Optimizations ({content.optimizations.length})
                <span>{showOptimizations ? '▼' : '▶'}</span>
              </button>
              {showOptimizations && (
                <div className="mt-3 space-y-3">
                  {content.optimizations.map((opt, i) => (
                    <div key={i} className="border rounded-lg p-4">
                      <div className="flex justify-between">
                        <h5 className="font-medium text-sm">{opt.name}</h5>
                        {opt.speedup_factor && (
                          <span className="text-xs text-green-600">~{opt.speedup_factor} faster</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{opt.tradeoff}</p>
                      {opt.implementation && (
                        <CodeBlock code={opt.implementation} language={activeImplLang} compact className="mt-2" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
