import React, { useState } from 'react';

interface SubmissionConfirmationProps {
  complaint: any;
  onTrackCase: (id: string) => void;
  onReturnHome: () => void;
}

export const SubmissionConfirmationScreen: React.FC<SubmissionConfirmationProps> = ({
  complaint,
  onTrackCase,
  onReturnHome,
}) => {
  const [copied, setCopied] = useState(false);
  const trackingId = complaint?.tracking_number || complaint?.id || 'GG-2026-004821';
  const issues = complaint?.issues || [
    { category: complaint?.category || 'Road Damage', description: 'Primary incident evaluation' },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(trackingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[var(--civic-canvas)] flex flex-col justify-between antialiased selection:bg-[var(--civic-secondary-fixed)] pb-safe">
      {/* Top Header */}
      <header className="w-full pt-safe bg-white/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-[var(--civic-border)] z-40">
        <div className="h-16 px-4 max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="GrievanceGrid Logo" className="h-7 w-auto object-contain" />
            <span className="font-bold text-[16px] text-[var(--civic-primary)]">GrievanceGrid</span>
          </div>
          <span className="text-[11px] font-mono bg-green-50 text-green-700 border border-green-200 px-2.5 py-0.5 rounded-full font-bold">
            CONFIRMED
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-start px-4 py-6 max-w-lg w-full mx-auto space-y-4">
        {/* Verification & Success Header Banner */}
        <div className="flex flex-col items-center text-center mt-2 mb-2">
          <div className="w-16 h-16 rounded-full bg-[var(--civic-container)] flex items-center justify-center shadow-sm mb-3">
            <div className="w-10 h-10 rounded-full bg-[var(--civic-secondary)] flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[24px]">verified</span>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--civic-surface-dim)] text-[var(--civic-secondary)] mb-2">
            <span className="material-symbols-outlined text-[14px]">gavel</span>
            <span className="text-[11px] font-semibold tracking-wider uppercase">Official Municipal Record</span>
          </div>
          <h1 className="text-[22px] sm:text-[24px] font-bold text-[var(--civic-primary)] tracking-tight leading-snug">
            Complaint Submitted Successfully
          </h1>
          <p className="text-[13px] text-[var(--civic-text-muted)] max-w-xs mt-1">
            Filed {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} • Standard Municipal Intake
          </p>
        </div>

        {/* Primary Case ID & Provenance Token Card */}
        <div className="w-full bg-white rounded-xl p-4 shadow-sm border border-[var(--civic-border)] space-y-3">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-100">
            <div className="flex flex-col">
              <span className="text-[11px] text-[var(--civic-text-muted)] uppercase tracking-wider font-semibold">
                Official Case Tracking ID
              </span>
              <span className="font-mono text-[20px] text-[var(--civic-primary)] font-bold mt-0.5">
                {trackingId}
              </span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 bg-[var(--civic-surface-dim)] hover:bg-[var(--civic-secondary-fixed)] text-[var(--civic-primary)] px-3 py-1.5 rounded-lg transition-colors active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px] text-[var(--civic-secondary)]">
                {copied ? 'check' : 'content_copy'}
              </span>
              <span className="text-[12px] font-semibold">{copied ? 'Copied' : 'Copy ID'}</span>
            </button>
          </div>

          <div className="bg-[var(--civic-canvas)] rounded-lg p-2.5 flex items-start gap-2 text-[12px] border border-[var(--civic-border)]">
            <span className="material-symbols-outlined text-[var(--civic-secondary)] text-[16px] shrink-0 mt-0.5">
              lock
            </span>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] text-[var(--civic-text-muted)] font-semibold uppercase">
                Evidence File Integrity Reference
              </span>
              <span className="font-mono text-[11px] text-[var(--civic-primary)] truncate">
                SHA256: 8f9b4c092e341b5278c0e7fa19c2...db601f78c9
              </span>
            </div>
          </div>
        </div>

        {/* Multi-Issue Breakdown Alert */}
        <div className="w-full bg-[var(--civic-surface-dim)] rounded-xl p-4 shadow-sm border border-[var(--civic-secondary)]/20">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--civic-secondary)]/20 text-[var(--civic-secondary)] flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[18px]">account_tree</span>
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[14px] font-semibold text-[var(--civic-primary)]">
                  Multi-Issue Decomposition
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[var(--civic-container)] text-white text-[10px] font-mono font-bold">
                  {issues.length} {issues.length === 1 ? 'Item' : 'Items'}
                </span>
              </div>
              <p className="text-[12px] text-[var(--civic-text-muted)] mb-3 leading-relaxed">
                Multi-issue complaint: {issues.length} distinct {issues.length === 1 ? 'item' : 'items'} identified for separate department routing.
              </p>

              <div className="space-y-1.5">
                {issues.map((iss: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-white rounded-lg p-2.5 flex items-center justify-between text-[13px] border border-gray-100 shadow-2xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="material-symbols-outlined text-[var(--civic-secondary)] text-[16px]">
                        category
                      </span>
                      <span className="text-[var(--civic-primary)] truncate font-medium">
                        Item {idx + 1}: {iss.category || iss.description}
                      </span>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-[var(--civic-surface-dim)] text-[var(--civic-secondary)] shrink-0 font-medium">
                      Intake Registered
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Service Standard SLA & Workflow Trajectory Card */}
        <div className="w-full bg-white rounded-xl p-4 shadow-sm border border-[var(--civic-border)]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-semibold text-[var(--civic-primary)]">What happens next?</h2>
            <span className="text-[11px] text-[var(--civic-text-muted)] flex items-center gap-1 font-mono">
              <span className="material-symbols-outlined text-[13px]">schedule</span>
              Service Standard SLA Active
            </span>
          </div>

          <div className="relative pl-6 space-y-4 text-[13px]">
            {/* Step 1 */}
            <div className="relative">
              <div className="absolute -left-[25px] top-1 w-3.5 h-3.5 rounded-full bg-[var(--civic-secondary)]"></div>
              <div className="absolute -left-[19px] top-5 bottom-[-16px] w-0.5 bg-gray-200"></div>
              <div className="flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[var(--civic-primary)]">1. Municipal Intake Triage</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold uppercase">
                    In Progress
                  </span>
                </div>
                <p className="text-[12px] text-[var(--civic-text-muted)] mt-0.5">
                  Assigned officer verifying jurisdiction and confirming department routing.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="absolute -left-[25px] top-1 w-3.5 h-3.5 rounded-full bg-gray-300"></div>
              <div className="absolute -left-[19px] top-5 bottom-[-16px] w-0.5 bg-gray-200"></div>
              <div className="flex flex-col">
                <span className="font-semibold text-[var(--civic-primary)]">2. Field Assessment & Work Order</span>
                <p className="text-[12px] text-[var(--civic-text-muted)] mt-0.5">
                  Field crew dispatched to conduct physical remediation.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="absolute -left-[25px] top-1 w-3.5 h-3.5 rounded-full bg-gray-300"></div>
              <div className="flex flex-col">
                <span className="font-semibold text-[var(--civic-primary)]">3. Evidence Verification & Sign-off</span>
                <p className="text-[12px] text-[var(--civic-text-muted)] mt-0.5">
                  Before/after photographic verification signed off by municipal inspector.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2 pt-2">
          <button
            onClick={() => onTrackCase(complaint?.id || trackingId)}
            className="w-full h-12 rounded-lg bg-[var(--civic-container)] text-white text-[14px] font-semibold flex items-center justify-center gap-2 hover:opacity-95 shadow-sm active:scale-99 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">visibility</span>
            <span>Track This Case</span>
          </button>
          <button
            onClick={onReturnHome}
            className="w-full h-11 rounded-lg bg-white border border-[var(--civic-border)] text-[var(--civic-primary)] text-[13px] font-medium flex items-center justify-center hover:bg-[var(--civic-canvas)] transition-all"
          >
            Return to Citizen Home
          </button>
        </div>
      </main>
    </div>
  );
};
