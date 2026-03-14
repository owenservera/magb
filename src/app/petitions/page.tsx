// src/app/petitions/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { Select } from '@/components/common/Select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { api } from '@/lib/api-client';
import SubmitPetitionForm from '@/components/petitions/SubmitPetitionForm';
import PetitionList from '@/components/petitions/PetitionList';
import PetitionStatusFilter from '@/components/petitions/PetitionStatusFilter';

export default function PetitionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'submit' | 'list'>(searchParams.get('tab') === 'list' ? 'list' : 'submit');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const handleTabChange = (tab: 'submit' | 'list') => {
    setActiveTab(tab);
    router.push(`/petitions?tab=${tab}`);
  };

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    // In a real implementation, this would filter the petition list
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Knowledge Petitions</h1>
          <div className="flex items-center gap-4">
            <Button
              variant={activeTab === 'submit' ? 'default' : 'outline'}
              onClick={() => handleTabChange('submit')}
              className="px-4 py-2"
            >
              Submit Petition
            </Button>
            <Button
              variant={activeTab === 'list' ? 'default' : 'outline'}
              onClick={() => handleTabChange('list')}
              className="px-4 py-2"
            >
              View Petitions
            </Button>
          </div>
        </div>

        {activeTab === 'submit' && (
          <SubmitPetitionForm 
            onSuccess={() => {
              setActiveTab('list');
              router.push('/petitions?tab=list');
            }} 
          />
        )}

        {activeTab === 'list' && (
          <>
            <div className="mb-6 flex flex-wrap items-center gap-4">
              <PetitionStatusFilter 
                value={statusFilter} 
                onChange={handleStatusChange} 
              />
            </div>
            <PetitionList statusFilter={statusFilter} />
          </>
        )}
      </div>
    </div>
  );
}