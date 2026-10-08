import React from 'react';

export type AccessStateType = 
  | '401' 
  | '403' 
  | 'WRONG_PORTAL' 
  | 'ACCOUNT_UNAVAILABLE' 
  | '404' 
  | 'SERVICE_UNAVAILABLE' 
  | 'OFFLINE';

interface AccessStateProps {
  type: AccessStateType;
  currentUserRole?: string;
  currentUserName?: string;
  requestedRoute?: string;
  onNavigateHome?: () => void;
  onNavigateSignIn?: () => void;
  onRetry?: () => void;
}

export const AccessStates: React.FC<AccessStateProps> = ({
  type,
  currentUserRole = 'Citizen',
  currentUserName = 'Resident User',
  requestedRoute = '/dispatch/internal-queue',
  onNavigateHome,
  onNavigateSignIn,
  onRetry
}) => {
  return (
    <div className="min-h-screen bg-[var(--civic-canvas)] flex flex-col justify-between antialiased">
      {/* Top Header */}
      <header className="w-full pt-safe bg-white/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-[var(--civic-border)] z-40">
        <div className="h-16 px-4 max-w-lg mx-auto flex items-center justify-between">
          <button 
            onClick={onNavigateHome}
            className="w-10 h-10 flex items-center justify-center text-[var(--civic-primary)] hover:bg-[var(--civic-canvas)] rounded-full transition-colors"
            aria-label="Return home"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="GrievanceGrid Logo" className="h-7 w-auto object-contain" />
            <span className="font-bold text-[16px] text-[var(--civic-primary)]">GrievanceGrid</span>
          </div>
          <div className="w-10"></div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-md w-full mx-auto">
        {/* ===================== 403 FORBIDDEN ===================== */}
        {type === '403' && (
          <div className="w-full bg-white rounded-xl shadow-sm p-6 flex flex-col items-center text-center border border-[var(--civic-border)]">
            <div className="w-14 h-14 rounded-full bg-[var(--civic-surface-dim)] flex items-center justify-center mb-4 text-[var(--civic-secondary)]">
              <span className="material-symbols-outlined text-[28px]">shield</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--civic-surface-dim)] mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--civic-secondary)]"></span>
              <span className="text-[11px] font-mono uppercase text-[var(--civic-text-muted)] tracking-wider">Access Restricted</span>
            </div>
            <h2 className="text-[20px] font-semibold text-[var(--civic-primary)] mb-2 leading-snug">
              You don’t have permission to view this page.
            </h2>
            <p className="text-[14px] text-[var(--civic-text-muted)] mb-5 max-w-xs">
              This area is available only to authorized municipal officers and administrative personnel.
            </p>

            <div className="w-full bg-[var(--civic-canvas)] rounded-lg p-3 text-left mb-6 flex flex-col gap-1 border border-[var(--civic-border)]">
              <span className="text-[11px] text-[var(--civic-text-muted)] uppercase tracking-wider font-semibold">
                Account & Workspace Access
              </span>
              <span className="text-[13px] text-[var(--civic-primary)]">
                Signed in as: <strong className="font-semibold">{currentUserName} ({currentUserRole})</strong>
              </span>
              <span className="text-[12px] text-[var(--civic-secondary)] font-mono truncate">
                Target: {requestedRoute}
              </span>
            </div>

            <div className="w-full flex flex-col gap-2">
              <button 
                onClick={onNavigateHome}
                className="w-full h-11 rounded-lg bg-[var(--civic-container)] text-white text-[14px] font-semibold flex items-center justify-center gap-2 shadow-sm hover:opacity-95"
              >
                <span className="material-symbols-outlined text-[18px]">home</span>
                <span>Go to My Portal</span>
              </button>
              <button 
                onClick={onNavigateSignIn}
                className="w-full h-11 rounded-lg bg-[var(--civic-canvas)] text-[var(--civic-primary)] text-[14px] font-medium flex items-center justify-center gap-2 hover:bg-[var(--civic-surface-dim)]"
              >
                <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
                <span>Switch to Staff Account</span>
              </button>
            </div>
          </div>
        )}

        {/* ===================== 401 UNAUTHORIZED ===================== */}
        {type === '401' && (
          <div className="w-full bg-white rounded-xl shadow-sm p-6 flex flex-col items-center text-center border border-[var(--civic-border)]">
            <div className="w-14 h-14 rounded-full bg-[var(--civic-surface-dim)] flex items-center justify-center mb-4 text-[var(--civic-secondary)]">
              <span className="material-symbols-outlined text-[28px]">lock_open</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--civic-surface-dim)] mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--civic-secondary)]"></span>
              <span className="text-[11px] font-mono uppercase text-[var(--civic-text-muted)] tracking-wider">Authentication Required</span>
            </div>
            <h2 className="text-[20px] font-semibold text-[var(--civic-primary)] mb-2 leading-snug">
              Sign in to continue
            </h2>
            <p className="text-[14px] text-[var(--civic-text-muted)] mb-6 max-w-xs">
              You need to sign in with your verified municipal or citizen ID before you can access this page.
            </p>

            <div className="w-full flex flex-col gap-2">
              <button 
                onClick={onNavigateSignIn}
                className="w-full h-11 rounded-lg bg-[var(--civic-container)] text-white text-[14px] font-semibold flex items-center justify-center gap-2 shadow-sm hover:opacity-95"
              >
                <span className="material-symbols-outlined text-[18px]">login</span>
                <span>Sign In</span>
              </button>
              <button 
                onClick={onNavigateHome}
                className="w-full h-11 rounded-lg bg-[var(--civic-canvas)] text-[var(--civic-primary)] text-[14px] font-medium flex items-center justify-center gap-2 hover:bg-[var(--civic-surface-dim)]"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                <span>Return to Citizen Home</span>
              </button>
            </div>
          </div>
        )}

        {/* ===================== WRONG PORTAL ===================== */}
        {type === 'WRONG_PORTAL' && (
          <div className="w-full bg-white rounded-xl shadow-sm p-6 flex flex-col items-center text-center border border-[var(--civic-border)]">
            <div className="w-14 h-14 rounded-full bg-[var(--civic-surface-dim)] flex items-center justify-center mb-4 text-[var(--civic-secondary)]">
              <span className="material-symbols-outlined text-[28px]">switch_account</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--civic-surface-dim)] mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--civic-secondary)]"></span>
              <span className="text-[11px] font-mono uppercase text-[var(--civic-text-muted)] tracking-wider">Portal Mismatch</span>
            </div>
            <h2 className="text-[20px] font-semibold text-[var(--civic-primary)] mb-2 leading-snug">
              {currentUserRole.toLowerCase().includes('worker') 
                ? 'Mobile Application Required'
                : 'Portal Mismatch'}
            </h2>
            <p className="text-[14px] text-[var(--civic-text-muted)] mb-5 max-w-sm">
              {currentUserRole.toLowerCase().includes('worker')
                ? 'Field worker tasks, on-ground work order execution, and before/after evidentiary captures are operated exclusively through the GrievanceGrid Mobile Application.'
                : `This account is signed in as ${currentUserRole}. The requested administrative area requires a different authorization level.`}
            </p>

            <div className="w-full bg-[var(--civic-canvas)] rounded-lg p-3 text-left mb-6 flex flex-col gap-1 border border-[var(--civic-border)]">
              <span className="text-[13px] text-[var(--civic-primary)] font-medium">
                Current Account: <span className="font-semibold">{currentUserName} ({currentUserRole})</span>
              </span>
              <span className="text-[12px] text-[var(--civic-secondary)] font-mono">
                Platform: {requestedRoute}
              </span>
            </div>

            <div className="w-full flex flex-col gap-2">
              <button 
                onClick={onNavigateSignIn}
                className="w-full h-11 rounded-lg bg-[var(--civic-container)] text-white text-[14px] font-semibold flex items-center justify-center gap-2 shadow-sm hover:opacity-95"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                <span>Sign Out & Switch Account</span>
              </button>
              {!currentUserRole.toLowerCase().includes('worker') && onNavigateHome && (
                <button 
                  onClick={onNavigateHome}
                  className="w-full h-11 rounded-lg bg-[var(--civic-canvas)] text-[var(--civic-primary)] text-[14px] font-medium flex items-center justify-center gap-2 hover:bg-[var(--civic-surface-dim)]"
                >
                  <span className="material-symbols-outlined text-[18px]">dashboard</span>
                  <span>Return to Home</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* ===================== ACCOUNT UNAVAILABLE ===================== */}
        {type === 'ACCOUNT_UNAVAILABLE' && (
          <div className="w-full bg-white rounded-xl shadow-sm p-6 flex flex-col items-center text-center border border-[var(--civic-border)]">
            <div className="w-14 h-14 rounded-full bg-[var(--civic-surface-dim)] flex items-center justify-center mb-4 text-[var(--civic-primary)]">
              <span className="material-symbols-outlined text-[28px]">shield_person</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--civic-surface-dim)] mb-3">
              <span className="text-[11px] font-mono uppercase text-[var(--civic-text-muted)] tracking-wider">Account Notice</span>
            </div>
            <h2 className="text-[20px] font-semibold text-[var(--civic-primary)] mb-2">
              Your account is currently unavailable
            </h2>
            <p className="text-[14px] text-[var(--civic-text-muted)] mb-5 max-w-xs">
              Your account cannot access GrievanceGrid at the moment. Please contact support or our municipal team if you believe this is in error.
            </p>

            <div className="w-full bg-[var(--civic-canvas)] rounded-lg p-3 mb-6 text-left border border-[var(--civic-border)]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[var(--civic-secondary)]">support_agent</span>
                <span className="text-[13px] font-semibold text-[var(--civic-primary)]">Casework Support Available</span>
              </div>
              <p className="text-[12px] text-[var(--civic-text-muted)] pl-6 mt-1">
                Reference ID <span className="font-mono bg-[var(--civic-surface-dim)] px-1.5 py-0.5 rounded text-[var(--civic-primary)] font-medium">REV-8802</span> for expedited municipal assistance.
              </p>
            </div>

            <div className="w-full flex flex-col gap-2">
              <button 
                onClick={onNavigateHome}
                className="w-full h-11 rounded-lg bg-[var(--civic-container)] text-white text-[14px] font-semibold flex items-center justify-center gap-2 hover:opacity-95"
              >
                <span className="material-symbols-outlined text-[18px]">chat</span>
                <span>Contact Civic Support</span>
              </button>
              <button 
                onClick={onNavigateSignIn}
                className="w-full h-11 rounded-lg bg-[var(--civic-canvas)] text-[var(--civic-primary)] text-[14px] font-medium flex items-center justify-center hover:bg-[var(--civic-surface-dim)]"
              >
                Return to Sign In
              </button>
            </div>
          </div>
        )}

        {/* ===================== 404 NOT FOUND ===================== */}
        {type === '404' && (
          <div className="w-full bg-white rounded-xl shadow-sm p-6 flex flex-col items-center text-center border border-[var(--civic-border)]">
            <div className="w-14 h-14 rounded-full bg-[var(--civic-surface-dim)] flex items-center justify-center mb-4 text-[var(--civic-secondary)]">
              <span className="material-symbols-outlined text-[30px]">map</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--civic-surface-dim)] mb-3">
              <span className="text-[11px] font-mono uppercase text-[var(--civic-text-muted)] tracking-wider">Notice 404</span>
            </div>
            <h2 className="text-[20px] font-semibold text-[var(--civic-primary)] mb-2">
              We couldn't find that page
            </h2>
            <p className="text-[14px] text-[var(--civic-text-muted)] mb-5 max-w-xs">
              The civic record, public audit link, or department notice you were looking for may have been archived or reassigned.
            </p>

            <div className="w-full grid grid-cols-2 gap-2 mb-6 text-left">
              <button 
                onClick={onNavigateHome}
                className="bg-[var(--civic-canvas)] p-3 rounded-lg flex flex-col gap-1 border border-[var(--civic-border)] hover:bg-[var(--civic-surface-dim)] transition-colors text-left"
              >
                <span className="material-symbols-outlined text-[20px] text-[var(--civic-secondary)]">fact_check</span>
                <span className="text-[13px] font-semibold text-[var(--civic-primary)]">Track Incident</span>
                <span className="text-[11px] text-[var(--civic-text-muted)]">Check case status</span>
              </button>
              <button 
                onClick={onNavigateHome}
                className="bg-[var(--civic-canvas)] p-3 rounded-lg flex flex-col gap-1 border border-[var(--civic-border)] hover:bg-[var(--civic-surface-dim)] transition-colors text-left"
              >
                <span className="material-symbols-outlined text-[20px] text-[var(--civic-secondary)]">add_circle</span>
                <span className="text-[13px] font-semibold text-[var(--civic-primary)]">Submit Report</span>
                <span className="text-[11px] text-[var(--civic-text-muted)]">File a new grievance</span>
              </button>
            </div>

            <button 
              onClick={onNavigateHome}
              className="w-full h-11 rounded-lg bg-[var(--civic-container)] text-white text-[14px] font-semibold flex items-center justify-center gap-2 hover:opacity-95"
            >
              <span className="material-symbols-outlined text-[18px]">home</span>
              <span>Return to Citizen Home</span>
            </button>
          </div>
        )}

        {/* ===================== SERVICE UNAVAILABLE / MAINTENANCE ===================== */}
        {type === 'SERVICE_UNAVAILABLE' && (
          <div className="w-full bg-white rounded-xl shadow-sm p-6 flex flex-col items-center text-center border border-[var(--civic-border)]">
            <div className="w-14 h-14 rounded-full bg-[var(--civic-surface-dim)] flex items-center justify-center mb-4 text-[var(--civic-secondary)]">
              <span className="material-symbols-outlined text-[30px]">construction</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--civic-surface-dim)] mb-3">
              <span className="material-symbols-outlined text-[12px] text-[var(--civic-secondary)]">schedule</span>
              <span className="text-[11px] font-mono uppercase text-[var(--civic-text-muted)] tracking-wider">Scheduled Civic Upgrade</span>
            </div>
            <h2 className="text-[20px] font-semibold text-[var(--civic-primary)] mb-2">
              Planned System Maintenance
            </h2>
            <p className="text-[14px] text-[var(--civic-text-muted)] mb-5 max-w-sm">
              GrievanceGrid is undergoing scheduled database indexing to improve submission verification times. Emergency municipal channels remain operational.
            </p>

            <div className="w-full bg-[var(--civic-canvas)] rounded-lg p-3 mb-6 text-left border border-[var(--civic-border)]">
              <div className="flex justify-between items-center mb-1 text-[12px]">
                <span className="text-[var(--civic-text-muted)] font-medium">Maintenance Status</span>
                <span className="font-mono text-[var(--civic-secondary)] font-bold">In Progress</span>
              </div>
              <div className="w-full bg-[var(--civic-surface-dim)] h-2 rounded-full overflow-hidden">
                <div className="bg-[var(--civic-secondary)] h-full w-full animate-pulse rounded-full"></div>
              </div>
              <p className="text-[11px] text-[var(--civic-text-muted)] mt-2">
                System will resume automatically once database maintenance completes.
              </p>
            </div>

            <button 
              onClick={onRetry || onNavigateHome}
              className="w-full h-11 rounded-lg bg-[var(--civic-container)] text-white text-[14px] font-semibold flex items-center justify-center gap-2 hover:opacity-95"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              <span>Check Server Status</span>
            </button>
          </div>
        )}

        {/* ===================== OFFLINE STATE ===================== */}
        {type === 'OFFLINE' && (
          <div className="w-full bg-white rounded-xl shadow-sm p-6 flex flex-col items-center text-center border border-[var(--civic-border)]">
            <div className="w-14 h-14 rounded-full bg-[var(--civic-surface-dim)] flex items-center justify-center mb-4 text-[var(--civic-text-muted)]">
              <span className="material-symbols-outlined text-[30px]">cloud_off</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--civic-surface-dim)] mb-3">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="text-[11px] font-mono uppercase text-[var(--civic-text-muted)] tracking-wider">Device Network Offline</span>
            </div>
            <h2 className="text-[20px] font-semibold text-[var(--civic-primary)] mb-2">
              You're offline right now
            </h2>
            <p className="text-[14px] text-[var(--civic-text-muted)] mb-5 max-w-sm">
              We can’t reach the GrievanceGrid servers. Check your cellular or Wi-Fi connection. You can still compile reports; they will automatically sync when you reconnect.
            </p>

            <div className="w-full bg-[var(--civic-canvas)] rounded-lg p-3 mb-6 flex items-center justify-between text-left border border-[var(--civic-border)]">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px] text-[var(--civic-secondary)]">storage</span>
                <div>
                  <p className="text-[13px] font-semibold text-[var(--civic-primary)]">Offline Queue Armed</p>
                  <p className="text-[11px] text-[var(--civic-text-muted)]">Saved locally • Will auto-sync</p>
                </div>
              </div>
              <span className="font-mono text-[11px] text-[var(--civic-secondary)] bg-[var(--civic-surface-dim)] px-2 py-0.5 rounded font-bold">
                READY
              </span>
            </div>

            <div className="w-full flex flex-col gap-2">
              <button 
                onClick={onRetry || onNavigateHome}
                className="w-full h-11 rounded-lg bg-[var(--civic-container)] text-white text-[14px] font-semibold flex items-center justify-center gap-2 hover:opacity-95"
              >
                <span className="material-symbols-outlined text-[18px]">sync</span>
                <span>Try Again</span>
              </button>
              <button 
                onClick={onNavigateHome}
                className="w-full h-11 rounded-lg bg-[var(--civic-canvas)] text-[var(--civic-primary)] text-[14px] font-medium flex items-center justify-center hover:bg-[var(--civic-surface-dim)]"
              >
                Continue Working Offline
              </button>
            </div>
          </div>
        )}

        {/* Casework assistance footer */}
        <div className="w-full mt-4 bg-[var(--civic-canvas)] rounded-lg p-3.5 flex items-start gap-2.5 border border-[var(--civic-border)]">
          <div className="w-6 h-6 rounded-full bg-[var(--civic-surface-dim)] flex items-center justify-center text-[var(--civic-secondary)] shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-[15px]">help_outline</span>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[13px] font-semibold text-[var(--civic-primary)] mb-0.5">Need casework assistance?</span>
            <p className="text-[12px] text-[var(--civic-text-muted)] leading-relaxed">
              If you require immediate public infrastructure support, call Municipal Ward Emergency Services at 311.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
