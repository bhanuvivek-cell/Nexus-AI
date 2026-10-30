import React from 'react';
import { MatchComponents, EligibilityResult } from '../../types';
import { EligibilityBadge } from './EligibilityBadge';
import { Sparkles, Check, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

interface ScoreBreakdownProps {
  overallScore: number;
  components: MatchComponents;
  eligibility: EligibilityResult;
  matchedSkills?: string[];
  missingSkills?: string[];
  reasons?: string[];
  nextSteps?: string;
}

export const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({
  overallScore,
  components,
  eligibility,
  matchedSkills = [],
  missingSkills = [],
  reasons = [],
  nextSteps,
}) => {
  const componentMetrics = [
    { label: 'Structured Skill Match (K)', weight: '35%', score: components.skill_match_K, color: 'bg-saffron-500' },
    { label: 'Semantic Context (M)', weight: '25%', score: components.semantic_relevance_M, color: 'bg-navy-700' },
    { label: 'Career Interests (I)', weight: '15%', score: components.interest_match_I, color: 'bg-blue-600' },
    { label: 'Opportunity Preferences (P)', weight: '15%', score: components.preference_match_P, color: 'bg-emerald-600' },
    { label: 'Goal Growth Synergy (G)', weight: '10%', score: components.goal_alignment_G, color: 'bg-purple-600' },
  ];

  return (
    <div className="space-y-6 bg-slate-50/70 p-5 rounded-xl border border-slate-200">
      {/* Header with Overall Score & Eligibility */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-saffron-600" />
            <h4 className="text-base font-bold text-navy-900">AI Match & Eligibility Breakdown</h4>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Formula: S = 0.35K + 0.25M + 0.15I + 0.15P + 0.10G
          </p>
        </div>

        <div className="flex items-center gap-3">
          <EligibilityBadge status={eligibility.status} />
          <div className="flex items-baseline gap-1 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">Match</span>
            <span className="text-xl font-extrabold text-navy-900">{Math.round(overallScore)}%</span>
          </div>
        </div>
      </div>

      {/* Component progress meters */}
      <div className="space-y-3">
        <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
          Scoring Components
        </h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {componentMetrics.map((item) => (
            <div key={item.label} className="bg-white p-3 rounded-lg border border-slate-200/80">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-700">{item.label}</span>
                <span className="font-bold text-navy-900">{Math.round(item.score)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                  style={{ width: `${Math.min(100, Math.max(0, item.score))}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Weight: {item.weight}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Skills matched vs missing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Matched skills */}
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wide mb-2.5">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Matched Skills ({matchedSkills.length})</span>
          </div>
          {matchedSkills.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {matchedSkills.map((s) => (
                <span
                  key={s}
                  className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"
                >
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No direct matching skills recorded in profile.</p>
          )}
        </div>

        {/* Missing skills */}
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 uppercase tracking-wide mb-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>Missing / Target Skills ({missingSkills.length})</span>
          </div>
          {missingSkills.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {missingSkills.map((s) => (
                <span
                  key={s}
                  className="px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200"
                >
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-emerald-600 font-medium">All required skills are satisfied!</p>
          )}
        </div>
      </div>

      {/* Eligibility reasons & unmet criteria */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-navy-900 uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-navy-700" />
          <span>Eligibility Audit</span>
        </div>
        {eligibility.reasons.length > 0 && (
          <ul className="text-xs text-slate-600 space-y-1 pl-4 list-disc marker:text-emerald-500">
            {eligibility.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        )}
        {eligibility.unmet_criteria.length > 0 && (
          <ul className="text-xs text-rose-700 space-y-1 pl-4 list-disc marker:text-rose-500 font-medium">
            {eligibility.unmet_criteria.map((u, i) => (
              <li key={i}>{u}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Next steps advice */}
      {nextSteps && (
        <div className="flex items-start gap-2.5 bg-saffron-50/70 border border-saffron-200 p-3.5 rounded-lg text-xs text-saffron-900">
          <ArrowRight className="w-4 h-4 text-saffron-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Recommended Next Step: </span>
            <span>{nextSteps}</span>
          </div>
        </div>
      )}
    </div>
  );
};
