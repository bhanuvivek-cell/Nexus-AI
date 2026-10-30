import React from 'react';
import { ApplicationStage } from '../../types';
import { cn } from '../../lib/utils';
import { Bookmark, Clock, Send, Users, Award, XCircle } from 'lucide-react';

interface StageBadgeProps {
  stage: ApplicationStage;
  className?: string;
}

export const StageBadge: React.FC<StageBadgeProps> = ({ stage, className }) => {
  const configs: Record<ApplicationStage, { label: string; icon: any; style: string }> = {
    Saved: {
      label: 'Saved',
      icon: Bookmark,
      style: 'bg-slate-100 text-slate-800 border-slate-200',
    },
    Planned: {
      label: 'Planned',
      icon: Clock,
      style: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    Applied: {
      label: 'Applied',
      icon: Send,
      style: 'bg-blue-50 text-blue-800 border-blue-200',
    },
    Interview: {
      label: 'Interview',
      icon: Users,
      style: 'bg-purple-50 text-purple-800 border-purple-200',
    },
    Offer: {
      label: 'Offer Received',
      icon: Award,
      style: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold',
    },
    'Rejected/Closed': {
      label: 'Closed / Rejected',
      icon: XCircle,
      style: 'bg-rose-50 text-rose-800 border-rose-200',
    },
  };

  const config = configs[stage] || configs.Saved;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border tracking-tight',
        config.style,
        className
      )}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      {config.label}
    </span>
  );
};
