// Color scales for vitality scores (0-1 range)

export interface VitalityStyle {
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
  description: string;
}

export function getVitalityStyle(score: number | null | undefined): VitalityStyle {
  if (score == null || score < 0) {
    return {
      color: 'text-gray-500',
      bgColor: 'bg-gray-400',
      borderColor: 'border-gray-300',
      label: 'Unknown',
      description: 'No vitality data available',
    };
  }

  if (score >= 0.8) {
    return {
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-500',
      borderColor: 'border-green-300',
      label: 'Healthy',
      description: 'Knowledge is current and reliable',
    };
  }
  
  if (score >= 0.6) {
    return {
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-500',
      borderColor: 'border-yellow-300',
      label: 'Fair',
      description: 'Knowledge may need review soon',
    };
  }
  
  if (score >= 0.4) {
    return {
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-500',
      borderColor: 'border-orange-300',
      label: 'Aging',
      description: 'Knowledge is getting stale',
    };
  }
  
  if (score >= 0.2) {
    return {
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-500',
      borderColor: 'border-red-300',
      label: 'Stale',
      description: 'Knowledge likely outdated',
    };
  }
  
  return {
    color: 'text-red-800 dark:text-red-300',
    bgColor: 'bg-red-700',
    borderColor: 'border-red-500',
    label: 'Critical',
    description: 'Knowledge needs immediate attention',
  };
}

export function getVitalityPercentage(score: number | null | undefined): string {
  if (score == null) return '—';
  return `${Math.round(score * 100)}%`;
}

export function getVitalityColorHex(score: number | null | undefined): string {
  if (score == null || score < 0) return '#9CA3AF';
  if (score >= 0.8) return '#22C55E';
  if (score >= 0.6) return '#EAB308';
  if (score >= 0.4) return '#F97316';
  if (score >= 0.2) return '#EF4444';
  return '#DC2626';
}
