import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import { Recommendation, Opportunity, Application } from '../types';
import { OpportunityCard } from '../components/opportunities/OpportunityCard';
import { EligibilityBadge } from '../components/opportunities/EligibilityBadge';
import { Button } from '../components/ui/Button';
import { 
  Sparkles, 
  Briefcase, 
  BookOpen, 
  User, 
  AlertCircle, 
  Clock, 
  ChevronRight,
  TrendingUp,
  Bookmark,
  Calendar,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { formatDate } from '../lib/utils';

export const DashboardPage: React.FC = () => {
  const { user, profile } = useAuth();

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [savedOpportunities, setSavedOpportunities] = useState<Opportunity[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    // Fire all three requests in parallel — eliminates sequential wait time
    const [recResult, savedResult, appResult] = await Promise.allSettled([
      apiRequest<{ recommendations: Recommendation[] }>('/recommendations?limit=6'),
      apiRequest<Opportunity[]>('/saved'),
      apiRequest<Application[]>('/applications'),
    ]);

    // 1. Recommendations
    if (recResult.status === 'fulfilled') {
      setRecommendations(recResult.value.recommendations || []);
    } else {
      const msg = (recResult.reason as Error)?.message || '';
      if (msg.includes('Onboarding incomplete') || msg.includes('Profile not found')) {
        setError('Please complete your profile to unlock personalized AI matches.');
      } else {
        setError(msg || 'Failed to load personalized recommendations.');
      }
    }

    // 2. Saved opportunities
    if (savedResult.status === 'fulfilled') {
      setSavedOpportunities(savedResult.value || []);
    } else {
      console.warn('Saved opportunities fetch note:', savedResult.reason);
    }

    // 3. Applications
    if (appResult.status === 'fulfilled') {
      setApplications(appResult.value || []);
    } else {
      console.warn('Applications fetch note:', appResult.reason);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  // Stage counts for application summary
  const stageCounts = {
    Saved: applications.filter((a) => a.stage === 'Saved').length,
    Planned: applications.filter((a) => a.stage === 'Planned').length,
    Applied: applications.filter((a) => a.stage === 'Applied').length,
    Interview: applications.filter((a) => a.stage === 'Interview').length,
    Offer: applications.filter((a) => a.stage === 'Offer').length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Student Profile Welcome Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-saffron-600 bg-saffron-50 px-2 py-0.5 rounded border border-saffron-100">
                {profile?.degree || 'Student'} • Batch of {profile?.graduation_year || '2027'}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-medium">
                {profile?.branch || 'Engineering & Technology'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
              Welcome back, {profile?.display_name || user?.username || 'Student'}!
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
              {profile?.skills && profile.skills.length > 0 ? (
                <span>
                  Tracking <span className="font-semibold text-navy-900">{profile.skills.length} skills</span> across{' '}
                  <span className="font-semibold text-navy-900">{profile.career_interests?.join(', ') || 'Tech Streams'}</span>.
                </span>
              ) : (
                'Complete your profile to compute precise AI match scores and eligibility audits.'
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link to="/profile">
              <Button variant="outline" size="sm">
                <User className="w-3.5 h-3.5 mr-1" /> Edit Profile
              </Button>
            </Link>
            <Link to="/roadmap">
              <Button variant="primary" size="sm">
                <BookOpen className="w-3.5 h-3.5 mr-1" /> Skill Roadmap
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Application Tracking Overview Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Saved', count: stageCounts.Saved, color: 'text-slate-700 bg-slate-50' },
          { label: 'Planned', count: stageCounts.Planned, color: 'text-amber-700 bg-amber-50' },
          { label: 'Applied', count: stageCounts.Applied, color: 'text-blue-700 bg-blue-50' },
          { label: 'Interview', count: stageCounts.Interview, color: 'text-purple-700 bg-purple-50' },
          { label: 'Offers', count: stageCounts.Offer, color: 'text-emerald-700 bg-emerald-50' },
        ].map((item) => (
          <Link
            key={item.label}
            to="/applications"
            className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all shadow-xs flex flex-col justify-between"
          >
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{item.label}</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-navy-900">{item.count}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.color}`}>
                Active
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* AI RECOMMENDATIONS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-navy-900 flex items-center justify-center text-saffron-500">
              <Sparkles className="w-4 h-4 text-saffron-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-navy-900">Personalized AI Recommendations</h2>
              <p className="text-xs text-slate-500">
                Ranked with 5-factor hybrid scoring (Skills, Semantic, Interests, Preferences, Goals)
              </p>
            </div>
          </div>

          <Link to="/explore">
            <Button variant="ghost" size="sm">
              Explore All <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {error ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
            <h3 className="text-sm font-bold text-amber-900">{error}</h3>
            <p className="text-xs text-amber-700 max-w-md mx-auto">
              Recommendations depend on your declared graduation year and technical skills. Complete onboarding to view real matches.
            </p>
            <Link to="/onboarding">
              <Button variant="saffron" size="sm">Complete Profile Setup</Button>
            </Link>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-64 rounded-xl border border-slate-200 bg-white animate-pulse" />
            ))}
          </div>
        ) : recommendations.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
            <p className="text-sm font-semibold text-slate-600">No high-confidence matches found for your current criteria.</p>
            <p className="text-xs text-slate-400">Try broadening your career interests or adding more skills in your profile.</p>
            <Link to="/profile">
              <Button variant="outline" size="sm">Update Profile Settings</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendations.map((rec) => (
              <OpportunityCard
                key={rec.opportunity.id}
                opportunity={{
                  ...rec.opportunity,
                  match_score: rec.overall_score,
                  eligibility_status: rec.eligibility.status,
                }}
                onSaveToggle={() => loadDashboardData()}
              />
            ))}
          </div>
        )}
      </div>

      {/* SAVED OPPORTUNITIES & QUICK LINKS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Saved opportunities preview */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-saffron-600" />
              <h3 className="text-sm font-bold text-navy-900">Saved Opportunities ({savedOpportunities.length})</h3>
            </div>
            <Link to="/explore" className="text-xs font-semibold text-navy-700 hover:text-saffron-600">
              Browse More
            </Link>
          </div>

          {savedOpportunities.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              You haven't bookmarked any opportunities yet. Click the bookmark icon on any card to save it for later review.
            </div>
          ) : (
            <div className="space-y-3">
              {savedOpportunities.slice(0, 3).map((opp) => (
                <div
                  key={opp.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-0.5 max-w-[70%]">
                    <Link
                      to={`/opportunities/${opp.id}`}
                      className="text-xs font-bold text-navy-900 hover:text-saffron-600 truncate block"
                    >
                      {opp.title}
                    </Link>
                    <div className="text-[11px] text-slate-500">
                      {opp.provider} • {opp.location}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">
                      {opp.stipend_amount ? `₹${opp.stipend_amount.toLocaleString('en-IN')}` : 'Disclosed in Portal'}
                    </span>
                    <Link to={`/opportunities/${opp.id}`} className="text-slate-400 hover:text-navy-900">
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Skill Gap Summary Card */}
        <div className="bg-gradient-to-br from-navy-900 to-navy-950 text-white rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-8 h-8 rounded-lg bg-navy-800 flex items-center justify-center text-saffron-500">
              <BookOpen className="w-4 h-4 text-saffron-500" />
            </div>
            <h3 className="text-base font-bold tracking-tight">Personalized Skill Roadmap</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              We analyze the requirements of target companies and hackathons against your current stack to highlight high-ROI skills.
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-navy-800">
            <Link to="/roadmap">
              <Button variant="saffron" size="sm" className="w-full">
                View My Roadmap <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
