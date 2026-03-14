// src/components/petitions/PetitionStatusFilter.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/common/Button';

interface PetitionStatusFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export default function PetitionStatusFilter({ value, onChange }: PetitionStatusFilterProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (newValue: string) => {
    setAnchorEl(null);
    onChange(newValue);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={handleClick}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        aria-controls={open ? 'petition-status-filter-menu' : undefined}
        id="petition-status-filter-button"
      >
        Filter by Status: {value === 'all' ? 'All' : value.charAt(0).toUpperCase() + value.slice(1)}
      </Button>
      
      {open && (
        <div
          className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white p-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="petition-status-filter-button"
          id="petition-status-filter-menu"
        >
          <Button
            type="button"
            onClick={() => handleClose('all')}
            className={`block w-full text-left px-3 py-2 text-sm text-muted-foreground ${
              value === 'all' ? 'font-medium bg-muted/10' : ''
            }`}
          >
            All Statuses
          </Button>
          <Button
            type="button"
            onClick={() => handleClose('SUBMITTED')}
            className={`block w-full text-left px-3 py-2 text-sm text-muted-foreground ${
              value === 'SUBMITTED' ? 'font-medium bg-muted/10' : ''
            }`}
          >
            Submitted
          </Button>
          <Button
            type="button"
            onClick={() => handleClose('ASSESSING')}
            className={`block w-full text-left px-3 py-2 text-sm text-muted-foreground ${
              value === 'ASSESSING' ? 'font-medium bg-muted/10' : ''
            }`}
          >
            Assessing
          </Button>
          <Button
            type="button"
            onClick={() => handleClose('PLANNING')}
            className={`block w-full text-left px-3 py-2 text-sm text-muted-foreground ${
              value === 'PLANNING' ? 'font-medium bg-muted/10' : ''
            }`}
          >
            Planning
          </Button>
          <Button
            type="button"
            onClick={() => handleClose('IN_PROGRESS')}
            className={`block w-full text-left px-3 py-2 text-sm text-muted-foreground ${
              value === 'IN_PROGRESS' ? 'font-medium bg-muted/10' : ''
            }`}
          >
            In Progress
          </Button>
          <Button
            type="button"
            onClick={() => handleClose('FULFILLED')}
            className={`block w-full text-left px-3 py-2 text-sm text-muted-foreground ${
              value === 'FULFILLED' ? 'font-medium bg-muted/10' : ''
            }`}
          >
            Fulfilled
          </Button>
          <Button
            type="button"
            onClick={() => handleClose('REJECTED')}
            className={`block w-full text-left px-3 py-2 text-sm text-muted-foreground ${
              value === 'REJECTED' ? 'font-medium bg-muted/10' : ''
            }`}
          >
            Rejected
          </Button>
          <Button
            type="button"
            onClick={() => handleClose('CANCELLED')}
            className={`block w-full text-left px-3 py-2 text-sm text-muted-foreground ${
              value === 'CANCELLED' ? 'font-medium bg-muted/10' : ''
            }`}
          >
            Cancelled
          </Button>
        </div>
      )}
    </div>
  );
}