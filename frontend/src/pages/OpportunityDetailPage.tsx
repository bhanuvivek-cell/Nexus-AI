import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Opportunity, ApplicationStage } from '../types';
import { EligibilityBadge } from '../components/opportunities/EligibilityBadge';
import { ScoreBreakdown } from '../components/opportunities/ScoreBreakdown';
import { ApplicationModal } from '../components/tracker/ApplicationModal';
import { StageBadge } from '../components/tracker/StageBadge';
import { Button } from '../components/ui/Button';
import { formatDate, isDatePassed } from '../lib/utils';
import { 
  Building2, 
  MapPin, 
  Calendar, 
  IndianRupee, 
  ExternalLink, 
  Bookmark, 
  ShieldCheck, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft,
  Share2,
  Briefcase
} from 'lucide-react';

export const OpportunityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isTrackerModalOpen, setIsTrackerModalOpen] = useState(false);

  const fetchDetail = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<Opportunity>(`/opportunities/${id}`);
      setOpportunity(data);
      setIsSaved(data.is_saved || false);
    } catch (err: any) {
      setError(err.message || 'Failed to load opportunity details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id, user]);

  const handleSaveToggle = async () => {
    if (!user) {
      alert('Please log in to bookmark opportunities.');
      return;
    }
    if (!opportunity) return;

    try {
      if (isSaved) {
        await apiRequest(`/saved/${opportunity.id}`, { method: 'DELETE' });
        setIsSaved(false);
      } else {
        await apiRequest(`/saved/${opportunity.id}`, { method: 'POST' });
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Failed to toggle save:', err);
    }
  };

  const handleOfficialApplyClick = () => {
    if (!opportunity) return;
    // Log telemetry click
    if (user) {
      apiRequest(`/recommendations`, {
        method: 'POST',
        body: JSON.stringify({ event_type: 'official_apply_click' }),
      }).catch(() => {});
    }
    window.open(opportunity.official_apply_url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="h-96 rounded-2xl bg-white border border-slate-200 animate-pulse" />
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-navy-900">Opportunity Not Found</h2>
        <p className="text-sm text-slate-500">{error || 'The requested opportunity listing could not be found.'}</p>
        <Link to="/explore">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Explore
          </Button>
        </Link>
      </div>
    );
  }

  const deadlinePassed = isDatePassed(opportunity.deadline);
  const mandatoryReqs = opportunity.mandatory_requirements || {};
  const preferredQuals = opportunity.preferred_qualifications || {};
  const matchBreakdown = (opportunity as any).match_breakdown;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/explore"
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-navy-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to All Opportunities
        </Link>
      </div>

      {/* Main Opportunity Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-navy-50 text-navy-800 border border-navy-100">
                {opportunity.opportunity_type.replace('_', ' ')}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 capitalize">
                {opportunity.work_mode.replace('_', ' ')}
              </span>
              {opportunity.verification_status === 'verified' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Source Verified
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight">
              {opportunity.title}
            </h1>

            <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span>{opportunity.provider}</span>
            </div>
          </div>

          {/* Quick actions: Bookmark & Track */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant={isSaved ? 'saffron' : 'outline'}
              size="md"
              onClick={handleSaveToggle}
              title={isSaved ? 'Saved' : 'Save opportunity'}
            >
              <Bookmark className={`w-4 h-4 mr-1 ${isSaved ? 'fill-current' : ''}`} />
              {isSaved ? 'Saved' : 'Save'}
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsTrackerModalOpen(true)}
            >
              <Briefcase className="w-4 h-4 mr-1" />
              {opportunity.application_stage ? (
                <span>Stage: {opportunity.application_stage}</span>
              ) : (
                'Track Application'
              )}
            </Button>
          </div>
        </div>

        {/* Key metadata grid: Location, Stipend, Deadline */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
          <div className="space-y-1">
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Location</span>
            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
              <MapPin className="w-4 h-4 text-slate-500" />
              <span>{opportunity.location}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Stipend / Prize</span>
            <div className="flex items-center gap-1.5 font-bold text-emerald-700 text-sm">
              <IndianRupee className="w-4 h-4 text-emerald-600" />
              <span>
                {opportunity.stipend_amount !== null && opportunity.stipend_amount !== undefined
                  ? opportunity.stipend_amount === 0
                    ? 'Free / Unpaid'
                    : `₹${opportunity.stipend_amount.toLocaleString('en-IN')}`
                  : 'Disclosed in Portal'}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Application Deadline</span>
            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className={deadlinePassed ? 'text-rose-600' : ''}>
                {deadlinePassed ? 'Closed' : formatDate(opportunity.deadline)}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-navy-900">
            About This Opportunity
          </h3>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {opportunity.description}
          </p>
        </div>

        {/* Structured Requirements & Qualifications */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-navy-700" />
              Mandatory Requirements
            </h4>
            <ul className="text-xs text-slate-700 space-y-2">
              {mandatoryReqs.degrees && (
                <li>
                  <span className="font-semibold text-slate-900">Eligible Degrees: </span>
                  {mandatoryReqs.degrees.join(', ')}
                </li>
              )}
              {mandatoryReqs.graduation_years && (
                <li>
                  <span className="font-semibold text-slate-900">Eligible Batches: </span>
                  {mandatoryReqs.graduation_years.join(', ')}
                </li>
              )}
              {mandatoryReqs.min_academic_year && (
                <li>
                  <span className="font-semibold text-slate-900">Minimum Academic Year: </span>
                  Year {mandatoryReqs.min_academic_year}+
                </li>
              )}
              {mandatoryReqs.min_cgpa && (
                <li>
                  <span className="font-semibold text-slate-900">Minimum CGPA / Percentage: </span>
                  {mandatoryReqs.min_cgpa} CGPA or equivalent 65%
                </li>
              )}
              {mandatoryReqs.mandatory_skills && mandatoryReqs.mandatory_skills.length > 0 && (
                <li>
                  <span className="font-semibold text-slate-900">Non-Negotiable Skills: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {mandatoryReqs.mandatory_skills.map((s: string) => (
                      <span key={s} className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                        {s}
                      </span>
                    ))}
                  </div>
                </li>
              )}
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy-900 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Preferred Qualifications & Skills
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {opportunity.skills && opportunity.skills.length > 0 ? (
                opportunity.skills.map((s) => (
                  <span
                    key={s.id || s.name}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                      s.requirement_type === 'mandatory'
                        ? 'bg-navy-50 text-navy-900 border-navy-200 font-semibold'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {s.name} {s.requirement_type === 'mandatory' ? '(Mandatory)' : '(Preferred)'}
                  </span>
                ))
              ) : (
                <p className="text-xs text-slate-400">See description for preferred profile details.</p>
              )}
            </div>
          </div>
        </div>

        {/* Source attribution and last checked audit */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            <span>Verified Source: </span>
            <a
              href={opportunity.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-navy-900 font-semibold underline hover:text-saffron-600"
            >
              {opportunity.source_name}
            </a>
            <span className="ml-2 text-slate-400">| Last verified: {formatDate(opportunity.last_checked)}</span>
          </div>

          {/* Official apply button */}
          <Button
            variant="saffron"
            size="md"
            onClick={handleOfficialApplyClick}
            className="w-full sm:w-auto shadow-sm"
          >
            Apply on Official Portal <ExternalLink className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      </div>

      {/* AI MATCH & ELIGIBILITY BREAKDOWN (IF USER PROFILE EVALUATED) */}
      {matchBreakdown ? (
        <ScoreBreakdown
          overallScore={matchBreakdown.overall_score}
          components={matchBreakdown.components}
          eligibility={(opportunity as any).eligibility || { status: 'Eligible', reasons: [], unmet_criteria: [] }}
          matchedSkills={matchBreakdown.matched_skills}
          missingSkills={matchBreakdown.missing_skills}
          reasons={matchBreakdown.reasons}
          nextSteps={matchBreakdown.next_steps}
        />
      ) : user ? (
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center space-y-2">
          <p className="text-xs text-slate-600">
            AI match scoring is calculated automatically against your active profile.
          </p>
          <Link to="/onboarding">
            <Button variant="outline" size="sm">
              Update Profile Details
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-navy-50 border border-navy-200 p-6 rounded-xl text-center space-y-2">
          <h3 className="text-sm font-bold text-navy-900">Want to know if you are eligible?</h3>
          <p className="text-xs text-navy-700 max-w-md mx-auto">
            Log in to evaluate your graduation batch, degree, and coding skills with our transparent AI matcher.
          </p>
          <Link to="/login">
            <Button variant="primary" size="sm">Log In to View Eligibility</Button>
          </Link>
        </div>
      )}

      {/* Application Tracking Modal */}
      {isTrackerModalOpen && (
        <ApplicationModal
          isOpen={isTrackerModalOpen}
          onClose={() => setIsTrackerModalOpen(false)}
          opportunity={opportunity}
          currentStage={opportunity.application_stage}
          onSuccess={() => fetchDetail()}
        />
      )}
    </div>
  );
};
