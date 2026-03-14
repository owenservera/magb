// src/app/contribute/wallet/page.tsx
'use client';

export default function WalletPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Token Wallet</h1>
        <p className="text-muted-foreground">
          Manage your contribution tokens and budget
        </p>
      </div>

      <div className="border rounded-lg p-6 bg-card text-center">
        <p className="text-muted-foreground mb-2">Available Balance</p>
        <p className="text-4xl font-bold">0</p>
        <p className="text-sm text-muted-foreground mt-1">tokens</p>
      </div>

      <div className="text-center text-muted-foreground">
        <p>Start contributing to earn tokens!</p>
      </div>
    </div>
  );
}
