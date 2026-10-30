import React from 'react';
import { EligibilityStatus } from '../../types';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EligibilityBadgeProps {
  status: EligibilityStatus;
  className?: string;
  showIcon?: boolean;
}

export const EligibilityBadge: React.FC<EligibilityBadgeProps> = ({
  status,
  className,
  showIcon = true,
}) => {
  const configs = {
    Eligible: {
      label: 'Eligible',
      icon: CheckCircle2,
      style: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    'Potentially eligible': {
      label: 'Potentially Eligible',
      icon: AlertTriangle,
      style: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    'Not eligible': {
      label: 'Not Eligible',
      icon: XCircle,
      style: 'bg-rose-50 text-rose-800 border-rose-200',
    },
  };

  const config = configs[status] || configs['Potentially eligible'];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border tracking-tight',
        config.style,
        className
      )}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      {config.label}
    </span>
  );
};
