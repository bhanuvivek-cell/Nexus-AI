import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import { Opportunity } from '../types';
import { OpportunityCard } from '../components/opportunities/OpportunityCard';
import { Button } from '../components/ui/Button';
import { 
  Target, 
  Sparkles, 
  ShieldCheck, 
  Compass, 
  BookOpen, 
  CheckCircle, 
  ArrowRight,
  TrendingUp,
  MapPin,
  Award
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const [featuredOpportunities, setFeaturedOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch initial preview opportunities
    apiRequest<{ items: Opportunity[] }>('/opportunities?page_size=3')
      .then((res) => {
        setFeaturedOpportunities(res.items || []);
      })
      .catch((err) => {
        console.warn('Could not fetch featured opportunities:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200 py-16 sm:py-24">
        {/* Subtle geometric background accents */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-navy-50 text-navy-900 border border-navy-100 mb-6">
            <span className="w-2 h-2 rounded-full bg-saffron-500 animate-pulse" />
            <span>Built for Indian Engineering & Tech Students</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-600">B.Tech, B.E., BCA, MCA</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl font-black text-navy-950 tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
            Where Skills Meet <span className="text-saffron-600 underline decoration-saffron-300 decoration-wavy decoration-2">Opportunity</span>.
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Stop searching across scattered portals. Nexus AI matches your actual academic batch, degree, and coding skills with verified Indian internships, hackathons, open-source programs, and entry-level tech roles.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            {user ? (
              <Link to="/dashboard">
                <Button variant="primary" size="lg" className="w-full sm:w-auto shadow-md">
                  Go to Student Dashboard <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto shadow-md bg-navy-900 hover:bg-navy-800">
                    Get Started Free <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
                <Link to="/explore">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    <Compass className="w-4 h-4 mr-1 text-slate-500" /> Explore Opportunities
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Transparent Trust Metrics */}
          <div className="mt-12 pt-8 border-t border-slate-100 max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
            <div>
              <div className="text-2xl font-black text-navy-900">100%</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Verified Official Links</div>
            </div>
            <div>
              <div className="text-2xl font-black text-navy-900">5-Factor</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Transparent AI Engine</div>
            </div>
            <div>
              <div className="text-2xl font-black text-navy-900">INR (₹)</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Localized Stipends</div>
            </div>
            <div>
              <div className="text-2xl font-black text-navy-900">Zero</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Fabricated Placement Claims</div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
              How Nexus AI Works
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Designed specifically for the Indian college graduation system, eliminating guesswork from early tech careers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-navy-50 text-navy-900 flex items-center justify-center font-bold text-sm mb-4">
                01
              </div>
              <h3 className="text-base font-bold text-navy-900 mb-2">Build Your Academic Profile</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Enter your degree (BTech, BCA, MCA, etc.), graduating year, and current coding skills with accurate proficiency levels. No mandatory resume parsing hurdles.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-saffron-50 text-saffron-700 flex items-center justify-center font-bold text-sm mb-4">
                02
              </div>
              <h3 className="text-base font-bold text-navy-900 mb-2">Multi-Factor AI Ranking</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Nexus AI evaluates your profile using a deterministic eligibility checker alongside sentence embeddings (<code className="text-[11px] bg-slate-100 px-1 py-0.5 rounded">all-MiniLM-L6-v2</code>) and structured skill matching.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm mb-4">
                03
              </div>
              <h3 className="text-base font-bold text-navy-900 mb-2">Bridge Gaps & Track Applications</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Identify exact missing skills, access verified free courses from AWS Skill Builder, Microsoft Learn, and NPTEL, and manage application stages in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED OPPORTUNITIES PREVIEW */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold text-saffron-600 uppercase tracking-wider">
                Live Opportunity Feed
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight mt-1">
                Verified Indian & Global Tech Opportunities
              </h2>
            </div>
            <Link to="/explore">
              <Button variant="outline" size="sm">
                View All Opportunities <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-64 rounded-xl border border-slate-200 bg-slate-50 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredOpportunities.map((opp) => (
                <OpportunityCard key={opp.id} opportunity={opp} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="py-16 bg-navy-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to find opportunities tailored to your real skills?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            Create your student profile in under 3 minutes. Unlock transparent eligibility audits, personalized rankings, and verified learning roadmaps.
          </p>
          <div className="pt-2">
            <Link to="/register">
              <Button variant="saffron" size="lg" className="shadow-lg">
                Create Student Account <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
