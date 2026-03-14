// src/app/explore/page.tsx
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ExplorePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const search = searchParams.get('search');

  useEffect(() => {
    // Redirect to targets page with search query
    if (search) {
      router.push(`/explore/targets?search=${encodeURIComponent(search)}`);
    } else {
      router.push('/explore/targets');
    }
  }, [search, router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Redirecting...</h2>
        <p className="text-muted-foreground">
          Taking you to the explore section
        </p>
      </div>
    </div>
  );
}
