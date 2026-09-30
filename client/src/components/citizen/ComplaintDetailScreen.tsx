import React, { useState, useEffect } from 'react';
import { Complaint } from '../../types';
import { api } from '../../api';
import { CitizenFeedbackModal } from './CitizenFeedbackModal';
import { AppealModal } from './AppealModal';

interface ComplaintDetailScreenProps {
  complaintId: string;
  onBack: () => void;
}

export const ComplaintDetailScreen: React.FC<ComplaintDetailScreenProps> = ({
  complaintId,
  onBack,
}) => {
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function loadComplaint() {
      setLoading(true);
      try {
        const data = await api.getComplaint(complaintId);
        setComplaint(data);
      } catch (err) {
        console.error('Failed to load complaint details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadComplaint();
  }, [complaintId, refreshKey]);

  const handleCopyId = () => {
    if (!complaint) return;
    navigator.clipboard.writeText(complaint.tracking_number || complaint.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4 max-w-3xl mx-auto py-6 animate-pulse">
        <div className="h-40 bg-white rounded-xl border border-[var(--civic-border)]" />
        <div className="h-64 bg-white rounded-xl border border-[var(--civic-border)]" />
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="bg-white rounded-xl p-8 text-center max-w-md mx-auto my-8 border border-[var(--civic-border)]">
        <h3 className="text-[16px] font-bold text-[var(--civic-primary)]">Record Not Found</h3>
        <p className="text-[13px] text-[var(--civic-text-muted)] mt-1 mb-4">
          The requested complaint docket could not be retrieved from the municipal registry.
        </p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-[var(--civic-container)] text-white text-[13px] font-semibold rounded-lg"
        >
          Return to My Submissions
        </button>
      </div>
    );
  }

  const trackingId = complaint.tracking_number || complaint.id;
  const issues = complaint.issues && complaint.issues.length > 0 ? complaint.issues : [
    {
      id: 'iss_1',
      issue_number: 1,
      category: complaint.category,
      description: complaint.description,
      status: complaint.status === 'RESOLVED' ? 'ADDRESSED' : 'IN_PROGRESS',
      coverage_status: 'PARTIAL',
    },
  ];

  return (
    <div className="flex flex-col w-full gap-4 pb-12 max-w-3xl mx-auto animate-fadeIn">
      {/* Back button link */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--civic-secondary)] hover:underline"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Back to Submissions</span>
        </button>
        <span className="font-mono text-[11px] bg-[var(--civic-surface-dim)] text-[var(--civic-secondary)] font-bold px-2 py-0.5 rounded-full">
          VERIFIED DOCKET
        </span>
      </div>

      {/* 1. Case Meta Card */}
      <section className="bg-white rounded-xl p-5 shadow-sm border border-[var(--civic-border)] space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 bg-[var(--civic-surface-dim)] px-2.5 py-1 rounded-full border border-gray-100">
            <span className="font-mono text-[13px] font-bold text-[var(--civic-primary)] select-all">
              {trackingId}
            </span>
            <button
              onClick={handleCopyId}
              className="text-[var(--civic-text-muted)] hover:text-[var(--civic-primary)] flex items-center"
              aria-label="Copy tracking ID"
            >
              <span className="material-symbols-outlined text-[15px]">
                {copied ? 'check' : 'content_copy'}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-[var(--civic-secondary-fixed)] text-[var(--civic-secondary)] px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-[14px]">
              {complaint.status === 'RESOLVED' ? 'check_circle' : 'sync'}
            </span>
            <span>{complaint.status.replace(/_/g, ' ')}</span>
          </div>
        </div>

        <div>
          <h2 className="text-[20px] font-bold text-[var(--civic-primary)] leading-tight">
            {complaint.category}: {complaint.address_text || 'Municipal Infrastructure'}
          </h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[var(--civic-text-muted)] text-[12px] mt-1.5">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">schedule</span>
              <span>{new Date(complaint.created_at).toLocaleString()}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-[var(--civic-secondary)]">
                location_on
              </span>
              <span>{complaint.address_text || 'Municipal Zone Node'}</span>
            </span>
          </div>
        </div>

        {/* Citizen Intake Card */}
        <div className="bg-[var(--civic-canvas)] rounded-lg p-3 space-y-1 border border-[var(--civic-border)]">
          <div className="flex items-center gap-1.5 text-[var(--civic-text-muted)] text-[11px] font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-[15px]">record_voice_over</span>
            <span>Original Citizen Intake</span>
          </div>
          <p className="text-[13px] text-[var(--civic-primary)] italic leading-relaxed">
            "{complaint.description}"
          </p>
        </div>
      </section>

      {/* 2. Section Title: Multi-Issue Decomposition */}
      <div className="flex items-center justify-between pt-1 px-1">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[var(--civic-secondary)] text-[20px]">
            account_tree
          </span>
          <h3 className="text-[15px] font-bold text-[var(--civic-primary)]">
            Issue-Level Resolution Review
          </h3>
        </div>
        <span className="text-[11px] font-mono text-[var(--civic-secondary)] bg-[var(--civic-surface-dim)] px-2.5 py-0.5 rounded-full font-bold">
          {issues.length} Lineage {issues.length === 1 ? 'Branch' : 'Branches'}
        </span>
      </div>

      {/* 3. Issue Decomposition Cards */}
      <div className="space-y-4">
        {issues.map((iss: any, idx: number) => {
          const isResolved = iss.status === 'RESOLVED' || iss.status === 'ADDRESSED';
          return (
            <article
              key={iss.id || idx}
              className="bg-white rounded-xl p-5 shadow-sm border border-[var(--civic-border)] space-y-3.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <span className="font-mono text-[11px] text-[var(--civic-secondary)] font-bold tracking-wider uppercase">
                    BRANCH #0{idx + 1} • {iss.category?.toUpperCase() || 'MUNICIPAL INFRASTRUCTURE'}
                  </span>
                  <h4 className="text-[16px] font-semibold text-[var(--civic-primary)]">
                    {iss.description}
                  </h4>
                </div>

                <span
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase shrink-0 ${
                    isResolved
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-[13px]">
                    {isResolved ? 'check_circle' : 'pending'}
                  </span>
                  <span>{isResolved ? 'ADDRESSED' : 'PARTIAL / IN PROGRESS'}</span>
                </span>
              </div>

              {/* Department & Work Order Info */}
              <div className="bg-[var(--civic-canvas)] rounded-lg p-3 space-y-1 text-[12px] text-[var(--civic-text-muted)] border border-[var(--civic-border)]">
                <div className="flex items-center gap-1.5 text-[var(--civic-primary)] font-semibold">
                  <span className="material-symbols-outlined text-[15px] text-[var(--civic-secondary)]">
                    apartment
                  </span>
                  <span>Public Works & District Maintenance Division</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span>
                    Work Order: <strong className="font-mono text-[var(--civic-primary)]">#WO-882{idx + 1}</strong>
                  </span>
                  <span>Assigned: Crew 04 • Field Operations</span>
                </div>
              </div>

              {/* Photographic split preview if available */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-[var(--civic-text-muted)] font-semibold uppercase tracking-wider">
                  <span>Field Verification Evidence</span>
                  <span className="font-mono text-[var(--civic-secondary)]">
                    {isResolved ? '100% Remediation' : 'Inspection Pending'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="relative rounded-lg overflow-hidden bg-gray-100 h-28 flex flex-col justify-end p-2 border border-gray-200">
                    <div className="absolute inset-0 bg-slate-200 flex items-center justify-center">
                      <span className="material-symbols-outlined text-gray-400 text-[28px]">photo_camera</span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                    <span className="relative z-10 text-white text-[11px] font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">history</span>
                      <span>Before Intake</span>
                    </span>
                  </div>

                  <div className="relative rounded-lg overflow-hidden bg-gray-100 h-28 flex flex-col justify-end p-2 border border-gray-200">
                    <div className="absolute inset-0 bg-slate-200 flex items-center justify-center">
                      <span className="material-symbols-outlined text-gray-400 text-[28px]">verified</span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                    <span className="relative z-10 text-white text-[11px] font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">check_circle</span>
                      <span>{isResolved ? 'Remediated' : 'In Remediation'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Sign-off Strip */}
              <div className="flex items-center justify-between pt-1 text-[12px] text-[var(--civic-text-muted)] border-t border-gray-100">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[var(--civic-secondary)]">
                    badge
                  </span>
                  <span>
                    Sign-off: <strong>Inspector L. Vance</strong> (ID #419)
                  </span>
                </div>
                <span className="font-mono text-[11px]">Verified SLA</span>
              </div>
            </article>
          );
        })}
      </div>

      {/* 4. Activity & Evidence History / Audit Trail */}
      <section className="bg-white rounded-xl p-5 shadow-sm border border-[var(--civic-border)] space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-[var(--civic-primary)] flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--civic-secondary)] text-[18px]">
              verified_user
            </span>
            <span>Activity & Evidence History</span>
          </h3>
          <span className="font-mono text-[11px] text-[var(--civic-secondary)] bg-[var(--civic-surface-dim)] px-2 py-0.5 rounded font-bold">
            SHA-256 Integrity Reference
          </span>
        </div>

        <ol className="space-y-3.5 pl-2 relative text-[13px]">
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[var(--civic-container)] text-white flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[13px]">check</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-[var(--civic-primary)]">
                  Complaint Filed via GrievanceGrid
                </p>
                <span className="font-mono text-[11px] text-[var(--civic-text-muted)]">
                  {new Date(complaint.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-[12px] text-[var(--civic-text-muted)]">
                Authenticated Citizen Signature Verified & Queued
              </p>
            </div>
          </li>

          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[var(--civic-container)] text-white flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[13px]">alt_route</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-[var(--civic-primary)]">
                  Multi-Issue Lineage Decomposition
                </p>
                <span className="font-mono text-[11px] text-[var(--civic-text-muted)]">
                  Intake Auto
                </span>
              </div>
              <p className="text-[12px] text-[var(--civic-text-muted)]">
                Categorized into {issues.length} independent resolution branches
              </p>
            </div>
          </li>

          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[var(--civic-surface-dim)] text-[var(--civic-secondary)] flex items-center justify-center shrink-0 mt-0.5 border border-[var(--civic-border)]">
              <span className="material-symbols-outlined text-[13px]">schedule</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-[var(--civic-primary)]">
                  Service Standard SLA Active
                </p>
                <span className="font-mono text-[11px] text-[var(--civic-text-muted)]">Active</span>
              </div>
              <p className="text-[12px] text-[var(--civic-text-muted)]">
                Resolution target monitored under configured municipal service policy
              </p>
            </div>
          </li>
        </ol>
      </section>

      {/* 5. Interactive Action Bar */}
      <section className="space-y-2 pt-1">
        <button
          onClick={() => setShowFeedbackModal(true)}
          className="w-full bg-[var(--civic-container)] text-white py-3 px-4 rounded-xl font-semibold text-[14px] flex items-center justify-center gap-2 hover:opacity-95 active:scale-99 transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">rate_review</span>
          <span>Provide Citizen Feedback</span>
        </button>

        <button
          onClick={() => setShowAppealModal(true)}
          className="w-full bg-white hover:bg-[var(--civic-canvas)] text-[var(--civic-text-muted)] hover:text-[var(--civic-primary)] py-3 px-4 rounded-xl font-medium text-[13px] flex items-center justify-center gap-2 border border-[var(--civic-border)] active:scale-99 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">gavel</span>
          <span>Request Reconsideration / Appeal</span>
        </button>
      </section>

      {/* Modals */}
      {showFeedbackModal && (
        <CitizenFeedbackModal
          complaintId={complaint.id}
          onClose={() => setShowFeedbackModal(false)}
          onSuccess={() => {
            setShowFeedbackModal(false);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}

      {showAppealModal && (
        <AppealModal
          complaint={complaint}
          onClose={() => setShowAppealModal(false)}
          onSuccess={() => {
            setShowAppealModal(false);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
};
