import React, { useState } from 'react';
import { api } from '../../api';

interface AppealModalProps {
  complaint: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const AppealModal: React.FC<AppealModalProps> = ({
  complaint,
  onClose,
  onSuccess,
}) => {
  const [unresolvedText, setUnresolvedText] = useState(
    'The bulk litter was cleared but hazardous broken glass and sharp debris remain directly behind the transit shelter bench.'
  );
  const [resolutionExpectation, setResolutionExpectation] = useState('CREW_RETURN');
  const [contestedIssues, setContestedIssues] = useState<number[]>([1]);
  const [submitting, setSubmitting] = useState(false);
  const [submittedAppealId, setSubmittedAppealId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const trackingId = complaint?.tracking_number || complaint?.id || 'GG-2026-004821';
  const issues = complaint?.issues || [
    { category: 'Road Damage', description: 'Broken Luminaire / Road Surface', status: 'ADDRESSED' },
    { category: 'Garbage & Waste', description: 'Illicit Waste Accumulation', status: 'IN_PROGRESS' },
  ];

  const toggleIssue = (index: number) => {
    if (contestedIssues.includes(index)) {
      setContestedIssues(contestedIssues.filter((i) => i !== index));
    } else {
      setContestedIssues([...contestedIssues, index]);
    }
  };

  const handleSubmitAppeal = async () => {
    if (!unresolvedText.trim()) {
      setError('Please provide a description of what remains unresolved.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        complaint_id: complaint?.id,
        reason: `${resolutionExpectation}: ${unresolvedText}`,
      };
      await api.submitAppeal(complaint?.id, payload);
      setSubmittedAppealId(`GG-REV-${Math.floor(100 + Math.random() * 900)}`);
      setTimeout(() => {
        onSuccess();
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Failed to submit appeal. Please retry.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[var(--civic-border)] flex flex-col p-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--civic-secondary)] text-[22px]">
              gavel
            </span>
            <div>
              <h2 className="text-[17px] font-bold text-[var(--civic-primary)]">
                Administrative Reconsideration
              </h2>
              <span className="font-mono text-[11px] text-[var(--civic-text-muted)]">
                DOCKET {trackingId} • Article IV Civic Oversight
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--civic-canvas)] text-[var(--civic-text-muted)] hover:text-[var(--civic-primary)] flex items-center justify-center"
          >
            &times;
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#ffdad6] text-[#93000a] text-[12px] rounded-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">error</span>
            <span>{error}</span>
          </div>
        )}

        {submittedAppealId ? (
          <div className="flex flex-col items-center text-center py-8 space-y-3">
            <div className="w-14 h-14 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[32px]">check_circle</span>
            </div>
            <h3 className="text-[18px] font-bold text-[var(--civic-primary)]">
              Appeal Lodged Successfully
            </h3>
            <p className="font-mono text-[14px] text-[var(--civic-secondary)] font-bold">
              {submittedAppealId}
            </p>
            <p className="text-[13px] text-[var(--civic-text-muted)] max-w-xs">
              Your appeal has been registered with the Appeal / Reconsideration Authority. Administrative review will be conducted under configured service standards.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Civic Transparency Notice */}
            <div className="bg-[var(--civic-surface-dim)] p-3.5 rounded-xl border border-[var(--civic-secondary)]/20 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[var(--civic-secondary)] text-[18px] shrink-0 mt-0.5">
                policy
              </span>
              <div className="flex flex-col gap-0.5 text-[12px]">
                <span className="font-semibold text-[var(--civic-primary)]">Civic Transparency Notice</span>
                <p className="text-[var(--civic-text-muted)] leading-relaxed">
                  If you believe an issue was closed prematurely or only partially resolved, you have the right to request independent administrative review under municipal policy.
                </p>
              </div>
            </div>

            {/* 1. Select Issues to Contest */}
            <section className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-[var(--civic-primary)]">
                  1. Select Issues to Contest
                </span>
                <span className="text-[11px] font-mono text-[var(--civic-secondary)] font-bold">
                  {contestedIssues.length} Selected
                </span>
              </div>

              <div className="space-y-2">
                {issues.map((iss: any, idx: number) => {
                  const isChecked = contestedIssues.includes(idx);
                  return (
                    <label
                      key={idx}
                      onClick={() => toggleIssue(idx)}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-[var(--civic-surface-dim)] border-[var(--civic-secondary)] shadow-sm'
                          : 'bg-white border-[var(--civic-border)] hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-1 w-4 h-4 rounded text-[var(--civic-secondary)] accent-[var(--civic-secondary)]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] font-semibold text-[var(--civic-primary)] truncate">
                            #{idx + 1}: {iss.category || iss.description}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-white text-[var(--civic-secondary)] border border-[var(--civic-border)]">
                            {iss.status || 'EVALUATED'}
                          </span>
                        </div>
                        <p className="text-[12px] text-[var(--civic-text-muted)] mt-0.5">
                          {iss.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </section>

            {/* 2. What remains unresolved? */}
            <section className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-semibold text-[var(--civic-primary)]" htmlFor="appeal-text">
                  2. What remains unresolved? <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] font-mono text-[var(--civic-text-muted)]">
                  {unresolvedText.length} / 500
                </span>
              </div>
              <textarea
                id="appeal-text"
                rows={3}
                maxLength={500}
                value={unresolvedText}
                onChange={(e) => setUnresolvedText(e.target.value)}
                placeholder="State clearly why the remediation is incomplete or unsatisfactory..."
                className="w-full p-3 bg-[var(--civic-canvas)] border border-[var(--civic-border)] rounded-xl text-[13px] text-[var(--civic-primary)] focus:bg-white focus:outline-none focus:border-[var(--civic-secondary)] resize-none"
              />
            </section>

            {/* 3. Resolution Expectation */}
            <section className="flex flex-col gap-2">
              <span className="text-[13px] font-semibold text-[var(--civic-primary)]">
                3. Requested Resolution Action
              </span>
              <div className="space-y-1.5">
                {[
                  { id: 'CREW_RETURN', label: 'Request crew return to complete secondary sweep', icon: 'cleaning_services' },
                  { id: 'SUPERVISOR_INSPECTION', label: 'Request senior supervisor on-site verification', icon: 'supervisor_account' },
                  { id: 'CONTEST_EVIDENCE', label: 'Contest field evidence validity / mismatch', icon: 'image_not_supported' },
                ].map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer text-[13px] transition-all ${
                      resolutionExpectation === opt.id
                        ? 'bg-[var(--civic-surface-dim)] border-[var(--civic-secondary)] font-semibold text-[var(--civic-primary)]'
                        : 'bg-white border-[var(--civic-border)] text-[var(--civic-text-muted)]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="appeal_exp"
                        checked={resolutionExpectation === opt.id}
                        onChange={() => setResolutionExpectation(opt.id)}
                        className="text-[var(--civic-secondary)] accent-[var(--civic-secondary)]"
                      />
                      <span>{opt.label}</span>
                    </div>
                    <span className="material-symbols-outlined text-[18px] text-[var(--civic-secondary)]">
                      {opt.icon}
                    </span>
                  </label>
                ))}
              </div>
            </section>

            {/* SLA Timeline */}
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-start gap-2.5 text-[12px] text-[var(--civic-text-muted)]">
              <span className="material-symbols-outlined text-[16px] text-[var(--civic-secondary)] shrink-0 mt-0.5">
                hourglass_top
              </span>
              <p>
                Administrative Review: Appeals are logged directly with the <strong className="text-[var(--civic-primary)]">Appeal / Reconsideration Authority</strong>. Review conducted under configured municipal service standards.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitAppeal}
                className="w-full h-11 rounded-lg bg-[var(--civic-container)] text-white text-[14px] font-semibold flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50 shadow-sm"
              >
                {submitting ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    <span>Submitting Appeal...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">assignment_turned_in</span>
                    <span>Submit Official Appeal</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full h-10 rounded-lg text-[var(--civic-text-muted)] hover:text-[var(--civic-primary)] text-[13px] font-medium"
              >
                Cancel & Return
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
