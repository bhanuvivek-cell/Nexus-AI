import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ApplicationStage, Opportunity } from '../../types';
import { apiRequest } from '../../lib/api';
import { CheckCircle2, Trash2 } from 'lucide-react';

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: Opportunity;
  currentStage?: ApplicationStage | null;
  currentNotes?: string;
  currentAppliedDate?: string | null;
  onSuccess?: () => void;
}

export const ApplicationModal: React.FC<ApplicationModalProps> = ({
  isOpen,
  onClose,
  opportunity,
  currentStage = 'Planned',
  currentNotes = '',
  currentAppliedDate = '',
  onSuccess,
}) => {
  const [stage, setStage] = useState<ApplicationStage>(currentStage || 'Planned');
  const [notes, setNotes] = useState(currentNotes || '');
  const [appliedDate, setAppliedDate] = useState(
    currentAppliedDate ? currentAppliedDate.split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stages: ApplicationStage[] = [
    'Saved',
    'Planned',
    'Applied',
    'Interview',
    'Offer',
    'Rejected/Closed',
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await apiRequest('/applications', {
        method: 'POST',
        body: JSON.stringify({
          opportunity_id: opportunity.id,
          stage,
          notes,
          applied_date: stage === 'Applied' || stage === 'Interview' || stage === 'Offer' ? appliedDate : null,
        }),
      });

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Remove this opportunity from your application tracker?')) return;
    setIsSubmitting(true);
    try {
      await apiRequest(`/applications/${opportunity.id}`, { method: 'DELETE' });
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to remove application');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Track Application"
      description={opportunity.title}
    >
      <form onSubmit={handleSave} className="space-y-4">
        {error && (
          <div className="p-3 rounded-md bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
            {error}
          </div>
        )}

        {/* Stage selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Application Stage
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {stages.map((stg) => (
              <button
                key={stg}
                type="button"
                onClick={() => setStage(stg)}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                  stage === stg
                    ? 'border-navy-900 bg-navy-900 text-white shadow-xs'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {stg}
              </button>
            ))}
          </div>
        </div>

        {/* Date Applied (visible if stage is Applied or later) */}
        {(stage === 'Applied' || stage === 'Interview' || stage === 'Offer') && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Applied Date
            </label>
            <input
              type="date"
              value={appliedDate}
              onChange={(e) => setAppliedDate(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-navy-900 focus:outline-none"
            />
          </div>
        )}

        {/* Personal student notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Personal Notes & Follow-ups
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="e.g. Applied via official portal, prepared DSA questions, reached out to alumni on LinkedIn..."
            className="w-full rounded-md border border-slate-300 p-3 text-sm focus:border-navy-900 focus:outline-none placeholder:text-slate-400"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          {currentStage ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 font-medium p-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Save Status
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
