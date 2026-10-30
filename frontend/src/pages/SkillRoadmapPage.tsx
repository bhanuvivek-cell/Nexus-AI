import React, { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';
import { SkillGapItem, SkillRoadmapResponse } from '../types';
import { Button } from '../components/ui/Button';
import { 
  BookOpen, 
  CheckCircle2, 
  Sparkles, 
  ExternalLink, 
  Award, 
  Layers, 
  Flame,
  ArrowRight,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';

export const SkillRoadmapPage: React.FC = () => {
  const [roadmap, setRoadmap] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest('/learning/roadmap')
      .then((data) => {
        setRoadmap(data);
      })
      .catch((err) => {
        setError(err.message || 'Failed to generate personalized skill roadmap.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="h-96 rounded-2xl bg-white border border-slate-200 animate-pulse" />
      </div>
    );
  }

  const matchedSkills: string[] = roadmap?.matched_skills || [];
  const prioritizedGaps: SkillGapItem[] = roadmap?.prioritized_missing_skills || [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-saffron-50 text-saffron-800 border border-saffron-200 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-saffron-600" />
            AI Gap Analysis & Verified Curriculum
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Your Personalized Skill Roadmap
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            We evaluate the exact prerequisite skills across top Indian internships, hackathons, and global open source programs against your current profile. Master these high-demand skills to maximize your qualification index.
          </p>
        </div>
      </div>

      {/* Matched skills summary bar */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Verified Skills in Your Profile ({matchedSkills.length})</span>
          </div>
          <span className="text-xs text-emerald-700 font-semibold">Active & Scored</span>
        </div>

        {matchedSkills.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {matchedSkills.map((sk) => (
              <span
                key={sk}
                className="px-2.5 py-1 rounded-md text-xs font-medium bg-white text-emerald-900 border border-emerald-200 shadow-2xs"
              >
                ✓ {sk}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-emerald-800 italic">
            No technical skills recorded yet. Complete onboarding or update your profile to calculate gaps.
          </p>
        )}
      </div>

      {/* Prioritized Missing Skills and Official Courses */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
              <Flame className="w-5 h-5 text-saffron-600" />
              Prioritized Skill Gaps & Verified Free Courses
            </h2>
            <p className="text-xs text-slate-500">
              Ranked by frequency of demand in verified listings. Official learning providers only.
            </p>
          </div>
        </div>

        {prioritizedGaps.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-navy-900">No Critical Skill Gaps Detected!</h3>
            <p className="text-xs text-slate-500">
              Your profile satisfies the technical requirements for all currently indexed opportunities.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {prioritizedGaps.map((gap, index) => (
              <div
                key={gap.skill_name}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Skill title & demand tag */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-navy-900 text-white flex items-center justify-center text-[10px] font-bold">
                          {index + 1}
                        </span>
                        <h3 className="font-bold text-base text-navy-900">
                          {gap.skill_name}
                        </h3>
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Category: {gap.category}
                      </span>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-saffron-50 text-saffron-800 border border-saffron-200 whitespace-nowrap">
                      Required in {gap.frequency} opportunities
                    </span>
                  </div>

                  {/* Verified learning resources for this skill */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Verified Official Learning Path
                    </span>

                    {gap.learning_resources && gap.learning_resources.length > 0 ? (
                      gap.learning_resources.map((res) => (
                        <div
                          key={res.id}
                          className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-xs font-bold text-navy-900">{res.title}</h4>
                              <span className="text-[11px] text-slate-500 block font-medium">
                                Provided by {res.provider}
                              </span>
                            </div>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              {res.cost_details || 'Free'}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-600 line-clamp-2">
                            {res.description}
                          </p>

                          <a
                            href={res.official_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-xs font-bold text-navy-900 hover:text-saffron-600 pt-1 transition-colors"
                          >
                            <span>Open Official Course</span>
                            <ExternalLink className="w-3.5 h-3.5 ml-1" />
                          </a>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-500">
                        Official sandbox tutorial being linked. Recommended practice: build a mini project using official documentation.
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-50 flex items-center justify-between">
                  <span>Priority Rank #{index + 1}</span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> Official Link Verified
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
