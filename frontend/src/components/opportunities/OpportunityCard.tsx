import React, { useState, memo } from 'react';
import { Link } from 'react-router-dom';
import { Opportunity } from '../../types';
import { EligibilityBadge } from './EligibilityBadge';
import { formatRupees, formatDate, isDatePassed } from '../../lib/utils';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Building2, 
  MapPin, 
  Calendar, 
  IndianRupee, 
  Bookmark, 
  Sparkles, 
  ArrowUpRight,
  Clock
} from 'lucide-react';

interface OpportunityCardProps {
  opportunity: Opportunity;
  onSaveToggle?: (opportunityId: string, isSaved: boolean) => void;
}

export const OpportunityCard = memo(function OpportunityCard({
  opportunity,
  onSaveToggle,
}: OpportunityCardProps) {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(opportunity.is_saved || false);
  const [saveLoading, setSaveLoading] = useState(false);

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      alert('Please log in to save opportunities to your profile.');
      return;
    }

    setSaveLoading(true);
    try {
      if (isSaved) {
        await apiRequest(`/saved/${opportunity.id}`, { method: 'DELETE' });
        setIsSaved(false);
        onSaveToggle?.(opportunity.id, false);
      } else {
        await apiRequest(`/saved/${opportunity.id}`, { method: 'POST' });
        setIsSaved(true);
        onSaveToggle?.(opportunity.id, true);
      }
    } catch (err) {
      console.error('Failed to toggle save:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  const typeLabels: Record<string, string> = {
    internship: 'Internship',
    entry_level_job: 'Entry-Level Job',
    hackathon: 'Hackathon',
    certification: 'Certification',
    open_source: 'Open Source',
    research: 'Research Project',
    project: 'Practical Project',
  };

  const deadlinePassed = isDatePassed(opportunity.deadline);

  return (
    <div className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-md">
      <div>
        {/* Top Badges & Save action */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-navy-50 text-navy-800 border border-navy-100">
              {typeLabels[opportunity.opportunity_type] || opportunity.opportunity_type}
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 capitalize">
              {opportunity.work_mode.replace('_', ' ')}
            </span>
            {opportunity.application_stage && (
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {opportunity.application_stage}
              </span>
            )}
          </div>

          <button
            onClick={handleBookmark}
            disabled={saveLoading}
            className={`p-1.5 rounded-md transition-colors ${
              isSaved
                ? 'text-saffron-600 bg-saffron-50 hover:bg-saffron-100'
                : 'text-slate-400 hover:text-navy-900 hover:bg-slate-100'
            }`}
            title={isSaved ? 'Remove from saved' : 'Save opportunity'}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-saffron-600' : ''}`} />
          </button>
        </div>

        {/* Opportunity Title & Provider */}
        <Link to={`/opportunities/${opportunity.id}`} className="block group-hover:text-saffron-600 transition-colors">
          <h3 className="font-bold text-base text-navy-900 leading-snug line-clamp-2">
            {opportunity.title}
          </h3>
        </Link>

        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium mt-1.5 mb-3">
          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{opportunity.provider}</span>
        </div>

        {/* Location and Stipend Info */}
        <div className="grid grid-cols-2 gap-2 py-2.5 my-2 border-y border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{opportunity.location}</span>
          </div>
          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
            <IndianRupee className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">
              {opportunity.stipend_amount !== null && opportunity.stipend_amount !== undefined
                ? opportunity.stipend_amount === 0
                  ? 'Free / Unpaid'
                  : `₹${opportunity.stipend_amount.toLocaleString('en-IN')}`
                : 'Stipend Disclosed in Portal'}
            </span>
          </div>
        </div>

        {/* Required skills preview */}
        {opportunity.skills && opportunity.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5">
            {opportunity.skills.slice(0, 3).map((s) => (
              <span
                key={s.id || s.name}
                className="px-2 py-0.5 rounded text-[11px] bg-slate-50 text-slate-600 border border-slate-200/70"
              >
                {s.name}
              </span>
            ))}
            {opportunity.skills.length > 3 && (
              <span className="px-1.5 py-0.5 rounded text-[10px] text-slate-400">
                +{opportunity.skills.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer: Deadline, Eligibility & Match Score */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className={deadlinePassed ? 'text-rose-600 font-semibold' : ''}>
            {deadlinePassed ? 'Closed' : formatDate(opportunity.deadline)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {opportunity.eligibility_status && (
            <EligibilityBadge status={opportunity.eligibility_status} showIcon={false} />
          )}

          {opportunity.match_score !== undefined && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-saffron-50 text-saffron-800 border border-saffron-200 text-xs font-bold">
              <Sparkles className="w-3 h-3 text-saffron-600" />
              <span>{Math.round(opportunity.match_score)}%</span>
            </div>
          )}

          <Link
            to={`/opportunities/${opportunity.id}`}
            className="p-1 rounded text-slate-400 hover:text-navy-900 transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
});
