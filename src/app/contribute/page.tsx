// src/app/contribute/page.tsx
'use client';

import Link from 'next/link';
import { Wallet, BarChart3, ArrowRight } from 'lucide-react';

export default function ContributePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Contribute</h1>
        <p className="text-muted-foreground">
          Help improve the knowledge base. Earn tokens for your contributions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/contribute/wallet"
          className="block p-6 rounded-lg border bg-card hover:bg-muted/50 hover:border-ring transition-all group"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900">
              <Wallet className="h-6 w-6 text-green-600 dark:text-green-300" />
            </div>
            <div>
              <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                Token Wallet
              </h3>
              <p className="text-sm text-muted-foreground">
                Manage your contribution budget
              </p>
            </div>
          </div>
          <div className="flex items-center text-sm text-muted-foreground group-hover:text-primary transition-colors">
            View balance <ArrowRight className="h-4 w-4 ml-1" />
          </div>
        </Link>

        <Link
          href="/contribute/impact"
          className="block p-6 rounded-lg border bg-card hover:bg-muted/50 hover:border-ring transition-all group"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900">
              <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                Impact Metrics
              </h3>
              <p className="text-sm text-muted-foreground">
                Track your contribution impact
              </p>
            </div>
          </div>
          <div className="flex items-center text-sm text-muted-foreground group-hover:text-primary transition-colors">
            View stats <ArrowRight className="h-4 w-4 ml-1" />
          </div>
        </Link>
      </div>

      {/* Contribution Guidelines */}
      <div className="border rounded-lg p-6 bg-card">
        <h3 className="text-lg font-semibold mb-4">How to Contribute</h3>
        <div className="space-y-4 text-sm">
          <ContributionStep
            number={1}
            title="Find knowledge gaps"
            description="Browse targets and identify missing capabilities, outdated algorithms, or incomplete documentation."
          />
          <ContributionStep
            number={2}
            title="Submit improvements"
            description="Add new capabilities, update algorithms, or improve existing documentation through the contribution interface."
          />
          <ContributionStep
            number={3}
            title="Earn tokens"
            description="Your contributions are reviewed and validated. Approved contributions earn tokens based on impact."
          />
          <ContributionStep
            number={4}
            title="Track impact"
            description="Watch your contributions help developers worldwide. Track usage and impact metrics in your dashboard."
          />
        </div>
      </div>
    </div>
  );
}

function ContributionStep({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
        {number}
      </div>
      <div>
        <h4 className="font-medium mb-1">{title}</h4>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
