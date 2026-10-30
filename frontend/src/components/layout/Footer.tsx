import React from 'react';
import { Link } from 'react-router-dom';
import { Target, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-navy-950 text-slate-300 border-t border-navy-900 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-navy-800 border border-navy-700 flex items-center justify-center text-saffron-500">
                <Target className="w-4 h-4 text-saffron-500" />
              </div>
              <span className="font-bold text-lg text-white tracking-tight">Nexus AI</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-saffron-500/20 text-saffron-400 uppercase">
                India
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              AI-Powered Career & Opportunity Intelligence for Indian college students. Discover verified internships, hackathons, open-source programs, and entry-level engineering roles matched to your actual skills and graduation timeline.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Transparent AI scoring & verified official application links. Zero fabricated statistics.</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/explore" className="hover:text-white transition-colors">
                  Explore Opportunities
                </Link>
              </li>
              <li>
                <Link to="/roadmap" className="hover:text-white transition-colors">
                  Skill Roadmaps
                </Link>
              </li>
              <li>
                <Link to="/applications" className="hover:text-white transition-colors">
                  Application Tracker
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">
                  AI Recommendations
                </Link>
              </li>
            </ul>
          </div>

          {/* Standards & Transparency */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Transparency & Legal
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="hover:text-slate-200 cursor-pointer">Official Source Verification</li>
              <li className="hover:text-slate-200 cursor-pointer">Privacy & Data Protection</li>
              <li className="hover:text-slate-200 cursor-pointer">Terms of Service</li>
              <li className="hover:text-slate-200 cursor-pointer">Contact Support</li>
            </ul>
            <div className="mt-4 pt-3 border-t border-navy-800 text-xs text-slate-400">
              Supporting all Indian degrees: B.Tech, B.E., BCA, B.Sc, M.Tech, MCA, & Polytechnic.
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-navy-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} Nexus AI. Built for Indian College Students.</p>
          <div className="flex items-center gap-1">
            <span>Engineered with integrity</span>
            <Heart className="w-3.5 h-3.5 text-saffron-500 fill-saffron-500 inline mx-0.5" />
            <span>for genuine student career advancement.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
