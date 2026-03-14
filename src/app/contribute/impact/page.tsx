// src/app/contribute/impact/page.tsx
'use client';

export default function ImpactPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Impact Metrics</h1>
        <p className="text-muted-foreground">
          Track the impact of your contributions
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Contributions" value="0" />
        <StatCard label="Approved" value="0" />
        <StatCard label="Views" value="0" />
        <StatCard label="Token Earned" value="0" />
      </div>

      <div className="text-center text-muted-foreground py-12">
        <p>No contributions yet. Start contributing to see your impact!</p>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-lg border bg-card text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-wide">
        {label}
      </div>
    </div>
  );
}
