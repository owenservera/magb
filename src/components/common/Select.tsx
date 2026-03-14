// src/components/common/Select.tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

export interface SelectProps {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ id, value, onValueChange, options, className }, ref) => {
    return (
      <select
        id={id}
        ref={ref}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
            {option.description ? ` - ${option.description}` : ''}
          </option>
        ))}
      </select>
    );
  },
);
Select.displayName = 'Select';

export { Select };
