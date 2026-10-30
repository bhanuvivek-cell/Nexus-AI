import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiRequest } from '../lib/api';
import { Opportunity, OpportunityType, WorkMode } from '../types';
import { OpportunityCard } from '../components/opportunities/OpportunityCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { 
  Search, 
  Filter, 
  X, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  MapPin,
  Calendar,
  IndianRupee
} from 'lucide-react';

export const ExplorePage: React.FC = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(9);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedWorkMode, setSelectedWorkMode] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [stipendFilter, setStipendFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Debounce timer ref — prevents rapid filter changes from firing many requests
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchOpportunities = useCallback(async (overrideQuery?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('page_size', pageSize.toString());
      const q = overrideQuery !== undefined ? overrideQuery : searchQuery;
      if (q.trim()) params.append('query', q.trim());
      if (selectedType) params.append('type', selectedType);
      if (selectedWorkMode) params.append('work_mode', selectedWorkMode);
      if (selectedLocation.trim()) params.append('location', selectedLocation.trim());
      if (stipendFilter) params.append('stipend', stipendFilter);
      if (sortBy) params.append('sort_by', sortBy);

      const res = await apiRequest<{ total: number; page: number; items: Opportunity[] }>(
        `/opportunities?${params.toString()}`
      );
      setOpportunities(res.items || []);
      setTotalCount(res.total || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch opportunities');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchQuery, selectedType, selectedWorkMode, selectedLocation, stipendFilter, sortBy]);

  // Debounced fetch — fires 300 ms after the last filter change
  const debouncedFetch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchOpportunities();
    }, 300);
  }, [fetchOpportunities]);

  useEffect(() => {
    debouncedFetch();
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [page, selectedType, selectedWorkMode, stipendFilter, sortBy]);

  // Stable callback for OpportunityCard — avoids re-renders on save toggle
  const handleSaveToggle = useCallback(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOpportunities();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedType('');
    setSelectedWorkMode('');
    setSelectedLocation('');
    setStipendFilter('');
    setSortBy('recent');
    setPage(1);
  };

  const opportunityTypes = [
    { value: '', label: 'All Opportunities' },
    { value: 'internship', label: 'Internships' },
    { value: 'hackathon', label: 'Hackathons' },
    { value: 'open_source', label: 'Open Source Programs' },
    { value: 'certification', label: 'Certifications & Training' },
    { value: 'research', label: 'Research Projects' },
    { value: 'entry_level_job', label: 'Entry-Level Jobs' },
  ];

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Title & Search Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight">
            Explore Opportunities
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse verified listings across Indian tech hubs and remote open source initiatives.
          </p>
        </div>

        {/* Mobile Filter Toggle Button */}
        <div className="sm:hidden w-full flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="flex-1"
          >
            <Filter className="w-3.5 h-3.5 mr-1.5" /> Filters
          </Button>
          {(selectedType || selectedWorkMode || stipendFilter || searchQuery) && (
            <Button variant="ghost" size="sm" onClick={handleResetFilters}>
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Search and Sort Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by role, company (e.g. Cisco, Google), or skill (e.g. Python, React)..."
            className="w-full rounded-md border border-slate-300 pl-9 pr-20 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-navy-900 focus:outline-none"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 px-3 py-1 bg-navy-900 text-white rounded text-xs font-semibold hover:bg-navy-800"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-500 whitespace-nowrap hidden sm:block">
            Sort by:
          </label>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 bg-white focus:border-navy-900 focus:outline-none w-full sm:w-auto"
          >
            <option value="recent">Recently Added / Verified</option>
            <option value="deadline">Upcoming Deadline</option>
          </select>
        </div>
      </div>

      {/* Main layout: Filter Sidebar + Opportunity Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Desktop Filter Sidebar */}
        <aside className={`md:block ${mobileFiltersOpen ? 'block' : 'hidden'} bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-5`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-saffron-600" />
              <span>Filters</span>
            </h3>
            {(selectedType || selectedWorkMode || stipendFilter || selectedLocation) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] text-slate-500 hover:text-navy-900 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            )}
          </div>

          {/* Opportunity Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Opportunity Type
            </label>
            <div className="space-y-1">
              {opportunityTypes.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => {
                    setSelectedType(t.value);
                    setPage(1);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    selectedType === t.value
                      ? 'bg-navy-900 text-white font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-navy-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Work Mode */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Work Mode
            </label>
            <div className="space-y-1">
              {[
                { value: '', label: 'All Modes' },
                { value: 'remote', label: 'Remote Only' },
                { value: 'hybrid', label: 'Hybrid' },
                { value: 'on_site', label: 'On-Site' },
              ].map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => {
                    setSelectedWorkMode(m.value);
                    setPage(1);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    selectedWorkMode === m.value
                      ? 'bg-navy-900 text-white font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-navy-900'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stipend */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Stipend / Cost
            </label>
            <div className="space-y-1">
              {[
                { value: '', label: 'All Listings' },
                { value: 'paid_only', label: 'Paid Stipend Only (₹)' },
              ].map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => {
                    setStipendFilter(s.value);
                    setPage(1);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    stipendFilter === s.value
                      ? 'bg-navy-900 text-white font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-navy-900'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Opportunity Listings Results */}
        <main className="md:col-span-3 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
            <span>
              Showing <span className="font-bold text-navy-900">{opportunities.length}</span> of{' '}
              <span className="font-bold text-navy-900">{totalCount}</span> verified opportunities
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-64 rounded-xl border border-slate-200 bg-white animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-8 text-center text-xs text-rose-800">
              {error}
            </div>
          ) : opportunities.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
              <p className="text-base font-bold text-navy-900">No opportunities match the selected filters.</p>
              <p className="text-xs text-slate-500">Try clearing filters or searching with a different keyword.</p>
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Reset All Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {opportunities.map((opp) => (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  onSaveToggle={handleSaveToggle}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>

              <span className="text-xs font-semibold text-slate-600 px-3">
                Page {page} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
