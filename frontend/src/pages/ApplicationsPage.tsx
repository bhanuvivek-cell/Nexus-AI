import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../lib/api';
import { Application, ApplicationStage } from '../types';
import { StageBadge } from '../components/tracker/StageBadge';
import { ApplicationModal } from '../components/tracker/ApplicationModal';
import { Button } from '../components/ui/Button';
import { formatDate } from '../lib/utils';
import { 
  Briefcase, 
  Plus, 
  ExternalLink, 
  Calendar, 
  FileText, 
  Building2, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

export const ApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOpportunity, setSelectedOpportunity] = useState<any | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeStageFilter, setActiveStageFilter] = useState<string>('All');

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<Application[]>('/applications');
      setApplications(data || []);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const stages: ApplicationStage[] = [
    'Saved',
    'Planned',
    'Applied',
    'Interview',
    'Offer',
    'Rejected/Closed',
  ];

  const filteredApps = activeStageFilter === 'All'
    ? applications
    : applications.filter((a) => a.stage === activeStageFilter);

  const handleEditClick = (app: Application) => {
    setSelectedApp(app);
    setSelectedOpportunity(app.opportunity);
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-saffron-600" />
            My Application Tracker
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track your pipeline from bookmark to offer letter with notes and interview dates.
          </p>
        </div>

        <Link to="/explore">
          <Button variant="primary" size="sm">
            <Plus className="w-4 h-4 mr-1" /> Discover New Opportunities
          </Button>
        </Link>
      </div>

      {/* Stage Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white rounded-xl border border-slate-200 shadow-xs">
        <button
          onClick={() => setActiveStageFilter('All')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeStageFilter === 'All'
              ? 'bg-navy-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-navy-900'
          }`}
        >
          All ({applications.length})
        </button>

        {stages.map((stg) => {
          const count = applications.filter((a) => a.stage === stg).length;
          return (
            <button
              key={stg}
              onClick={() => setActiveStageFilter(stg)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeStageFilter === stg
                  ? 'bg-navy-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-navy-900'
              }`}
            >
              {stg} ({count})
            </button>
          );
        })}
      </div>

      {/* Application Cards List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 rounded-xl bg-white border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Briefcase className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-navy-900">
            No applications in {activeStageFilter === 'All' ? 'tracker' : `"${activeStageFilter}" stage`}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Browse verified opportunities and click "Track Application" to organize your recruitment journey.
          </p>
          <Link to="/explore">
            <Button variant="outline" size="sm">
              Explore Opportunities
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <StageBadge stage={app.stage} />
                  {app.applied_date && (
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      Applied: {formatDate(app.applied_date)}
                    </span>
                  )}
                </div>

                <Link
                  to={`/opportunities/${app.opportunity_id}`}
                  className="font-bold text-base text-navy-900 hover:text-saffron-600 transition-colors block"
                >
                  {app.opportunity?.title || 'Opportunity Listing'}
                </Link>

                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{app.opportunity?.provider}</span>
                  <span>•</span>
                  <span>{app.opportunity?.location}</span>
                </div>

                {app.notes && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-md border border-slate-100 mt-2 font-mono">
                    <span className="font-semibold text-slate-700">Note: </span>
                    {app.notes}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditClick(app)}
                >
                  Update Stage
                </Button>

                {app.opportunity?.official_apply_url && (
                  <a
                    href={app.opportunity.official_apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-md text-slate-400 hover:text-navy-900 hover:bg-slate-100"
                    title="Open official application portal"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Update Stage Modal */}
      {isModalOpen && selectedOpportunity && (
        <ApplicationModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedApp(null);
            setSelectedOpportunity(null);
          }}
          opportunity={selectedOpportunity}
          currentStage={selectedApp?.stage}
          currentNotes={selectedApp?.notes}
          currentAppliedDate={selectedApp?.applied_date}
          onSuccess={() => fetchApplications()}
        />
      )}
    </div>
  );
};
