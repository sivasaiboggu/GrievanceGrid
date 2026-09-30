import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

interface ProfileScreenProps {
  onShowAccessState: (type: any) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onShowAccessState }) => {
  const { user, logout } = useAuth();
  const [notifySla, setNotifySla] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [offlineSync, setOfflineSync] = useState(true);

  return (
    <div className="flex flex-col w-full gap-5 pb-8 max-w-2xl mx-auto animate-fadeIn">
      <div className="pt-1">
        <h2 className="text-[20px] font-bold text-[var(--civic-primary)] tracking-tight">
          Citizen Profile & Credentials
        </h2>
        <p className="text-[13px] text-[var(--civic-text-muted)]">
          Official civic identity registered with Municipal Grievance Operations
        </p>
      </div>

      {/* Identity Card */}
      <section className="bg-white rounded-xl p-5 shadow-sm border border-[var(--civic-border)] flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-[var(--civic-container)] text-white flex items-center justify-center shrink-0 text-[26px] font-bold">
          {user?.name ? user.name.slice(0, 2).toUpperCase() : 'CZ'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-[17px] font-bold text-[var(--civic-primary)] truncate">
              {user?.name || 'Resident Citizen'}
            </h3>
            <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono">
              <span className="material-symbols-outlined text-[12px]">verified</span>
              Verified Resident
            </span>
          </div>
          <p className="text-[13px] text-[var(--civic-text-muted)] mt-0.5">{user?.email}</p>
          <div className="flex items-center gap-3 mt-2 text-[12px] text-[var(--civic-text-muted)]">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-[var(--civic-secondary)]">
                location_on
              </span>
              <span>Central Municipal District</span>
            </span>
            <span>•</span>
            <span className="font-mono text-[11px]">ID #CZ-2026-990</span>
          </div>
        </div>
      </section>

      {/* Notification Preferences */}
      <section className="bg-white rounded-xl p-5 shadow-sm border border-[var(--civic-border)] space-y-4">
        <h4 className="text-[14px] font-semibold text-[var(--civic-primary)]">
          Notification & Alert Preferences
        </h4>

        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex flex-col">
              <span className="text-[13px] font-semibold text-[var(--civic-primary)]">
                SLA Milestones & Work Order Updates
              </span>
              <span className="text-[11px] text-[var(--civic-text-muted)]">
                Receive notifications when crew is dispatched or remediates site
              </span>
            </div>
            <input
              type="checkbox"
              checked={notifySla}
              onChange={(e) => setNotifySla(e.target.checked)}
              className="w-4 h-4 rounded text-[var(--civic-secondary)] accent-[var(--civic-secondary)]"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer border-t border-gray-100 pt-3">
            <div className="flex flex-col">
              <span className="text-[13px] font-semibold text-[var(--civic-primary)]">
                Official Case Docket Receipts via Email
              </span>
              <span className="text-[11px] text-[var(--civic-text-muted)]">
                Dispatches PDF verification certificate with SHA-256 hashes
              </span>
            </div>
            <input
              type="checkbox"
              checked={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.checked)}
              className="w-4 h-4 rounded text-[var(--civic-secondary)] accent-[var(--civic-secondary)]"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer border-t border-gray-100 pt-3">
            <div className="flex flex-col">
              <span className="text-[13px] font-semibold text-[var(--civic-primary)]">
                Offline Auto-Sync Queue
              </span>
              <span className="text-[11px] text-[var(--civic-text-muted)]">
                Automatically submits cached offline reports when connectivity resumes
              </span>
            </div>
            <input
              type="checkbox"
              checked={offlineSync}
              onChange={(e) => setOfflineSync(e.target.checked)}
              className="w-4 h-4 rounded text-[var(--civic-secondary)] accent-[var(--civic-secondary)]"
            />
          </label>
        </div>
      </section>

      {/* Access Boundary Previews (For Testing Stitch States) */}
      <section className="bg-white rounded-xl p-5 shadow-sm border border-[var(--civic-border)] space-y-3">
        <h4 className="text-[14px] font-semibold text-[var(--civic-primary)]">
          Civic Access Boundaries & System Notices
        </h4>
        <p className="text-[12px] text-[var(--civic-text-muted)]">
          Test the approved Stitch status, error, and role boundary screens:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
          <button
            onClick={() => onShowAccessState('403')}
            className="p-2.5 text-left rounded-lg bg-[var(--civic-canvas)] hover:bg-[var(--civic-surface-dim)] border border-[var(--civic-border)] text-[12px] font-medium transition-all"
          >
            403 Restricted
          </button>
          <button
            onClick={() => onShowAccessState('WRONG_PORTAL')}
            className="p-2.5 text-left rounded-lg bg-[var(--civic-canvas)] hover:bg-[var(--civic-surface-dim)] border border-[var(--civic-border)] text-[12px] font-medium transition-all"
          >
            Wrong Portal
          </button>
          <button
            onClick={() => onShowAccessState('ACCOUNT_UNAVAILABLE')}
            className="p-2.5 text-left rounded-lg bg-[var(--civic-canvas)] hover:bg-[var(--civic-surface-dim)] border border-[var(--civic-border)] text-[12px] font-medium transition-all"
          >
            Account Notice
          </button>
          <button
            onClick={() => onShowAccessState('OFFLINE')}
            className="p-2.5 text-left rounded-lg bg-[var(--civic-canvas)] hover:bg-[var(--civic-surface-dim)] border border-[var(--civic-border)] text-[12px] font-medium transition-all"
          >
            Offline Queue
          </button>
          <button
            onClick={() => onShowAccessState('404')}
            className="p-2.5 text-left rounded-lg bg-[var(--civic-canvas)] hover:bg-[var(--civic-surface-dim)] border border-[var(--civic-border)] text-[12px] font-medium transition-all"
          >
            404 Notice
          </button>
          <button
            onClick={() => onShowAccessState('SERVICE_UNAVAILABLE')}
            className="p-2.5 text-left rounded-lg bg-[var(--civic-canvas)] hover:bg-[var(--civic-surface-dim)] border border-[var(--civic-border)] text-[12px] font-medium transition-all"
          >
            Maintenance Notice
          </button>
        </div>
      </section>

      {/* Logout button */}
      <button
        onClick={logout}
        className="w-full h-11 rounded-xl bg-white border border-red-200 text-red-600 hover:bg-red-50 text-[13px] font-semibold flex items-center justify-center gap-2 active:scale-99 transition-all shadow-2xs"
      >
        <span className="material-symbols-outlined text-[18px]">logout</span>
        <span>Sign Out of Civic Account</span>
      </button>
    </div>
  );
};
