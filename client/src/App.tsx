import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginScreen } from './components/auth/LoginScreen';
import { CitizenHome } from './components/citizen/CitizenHome';
import { ReportProblemWizard } from './components/citizen/ReportProblemWizard';
import { SubmissionConfirmationScreen } from './components/citizen/SubmissionConfirmationScreen';
import { MyComplaintsScreen } from './components/citizen/MyComplaintsScreen';
import { ComplaintDetailScreen } from './components/citizen/ComplaintDetailScreen';
import { NotificationsScreen } from './components/citizen/NotificationsScreen';
import { ProfileScreen } from './components/citizen/ProfileScreen';
import { AccessStates, AccessStateType } from './components/common/AccessStates';
import { OfficerDashboard } from './components/officer/OfficerDashboard';
import { AuthorityDashboard } from './components/authority/AuthorityDashboard';
import { api } from './api';

type CitizenTab = 'HOME' | 'MY_COMPLAINTS' | 'NOTIFICATIONS' | 'PROFILE';

const MainAppContent: React.FC = () => {
  const { user, logout } = useAuth();
  const [currentTab, setCurrentTab] = useState<CitizenTab>('HOME');

  // Sub-views & Modals
  const [isReporting, setIsReporting] = useState(false);
  const [reportCategory, setReportCategory] = useState<string | undefined>();
  const [submittedComplaint, setSubmittedComplaint] = useState<any | null>(null);
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null);
  const [activeAccessState, setActiveAccessState] = useState<AccessStateType | null>(null);

  // Unread notifications count
  const [unreadNotifCount, setUnreadNotifCount] = useState(2);

  useEffect(() => {
    async function checkNotifs() {
      if (!user) return;
      try {
        const notifs = await api.getNotifications();
        const unread = notifs.filter((n: any) => !n.is_read).length;
        setUnreadNotifCount(unread);
      } catch (err) {
        // quiet fallback
      }
    }
    checkNotifs();
  }, [user, currentTab]);

  // If unauthenticated, show the approved Stitch LoginScreen directly
  if (!user) {
    return <LoginScreen />;
  }

  // Role-based routing: Municipal Officer operational dashboard
  if (user.role === 'MUNICIPAL_OFFICER') {
    return <OfficerDashboard />;
  }

  // Role-based routing: Senior Authority governance dashboard
  if (user.role === 'SENIOR_AUTHORITY') {
    return <AuthorityDashboard />;
  }

  // Role-based routing: Field Worker uses the mobile app on the ground
  if (user.role === 'FIELD_WORKER') {
    return (
      <AccessStates
        type="WRONG_PORTAL"
        currentUserName={user.name}
        currentUserRole="Field Worker"
        requestedRoute="Field Worker Mobile App"
        onNavigateHome={() => logout()}
        onNavigateSignIn={() => logout()}
        onRetry={() => window.location.reload()}
      />
    );
  }

  // If testing or encountering an access state (e.g. 403, 401, wrong portal, offline)
  if (activeAccessState) {
    return (
      <AccessStates
        type={activeAccessState}
        currentUserName={user.name}
        currentUserRole={user.role}
        onNavigateHome={() => setActiveAccessState(null)}
        onNavigateSignIn={() => {
          setActiveAccessState(null);
          logout();
        }}
        onRetry={() => setActiveAccessState(null)}
      />
    );
  }

  // If in reporting flow, hide bottom nav and render the focused 4-step wizard
  if (isReporting) {
    return (
      <ReportProblemWizard
        initialCategory={reportCategory}
        onCancel={() => {
          setIsReporting(false);
          setReportCategory(undefined);
        }}
        onSubmitSuccess={(newComplaint) => {
          setIsReporting(false);
          setSubmittedComplaint(newComplaint);
        }}
      />
    );
  }

  // If showing submission confirmation
  if (submittedComplaint) {
    return (
      <SubmissionConfirmationScreen
        complaint={submittedComplaint}
        onTrackCase={(id) => {
          setSubmittedComplaint(null);
          setSelectedDetailId(id);
        }}
        onReturnHome={() => {
          setSubmittedComplaint(null);
          setCurrentTab('HOME');
        }}
      />
    );
  }

  // Header Title Helper
  const getHeaderTitle = () => {
    if (selectedDetailId) return 'Complaint Detail';
    switch (currentTab) {
      case 'HOME':
        return 'Home';
      case 'MY_COMPLAINTS':
        return 'My Complaints';
      case 'NOTIFICATIONS':
        return 'Alerts & Notices';
      case 'PROFILE':
        return 'Citizen Profile';
    }
  };

  return (
    <div className="min-h-screen bg-[var(--civic-canvas)] flex flex-col justify-between antialiased selection:bg-[var(--civic-secondary-fixed)] pb-safe">
      {/* ==================== 1. FIXED TOP HEADER ==================== */}
      <header className="fixed top-0 w-full z-40 pt-safe bg-white/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-[var(--civic-border)]">
        <div className="h-16 px-4 max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {selectedDetailId ? (
              <button
                onClick={() => setSelectedDetailId(null)}
                className="w-10 h-10 flex items-center justify-center rounded-full text-[var(--civic-primary)] hover:bg-[var(--civic-canvas)] active:scale-95 transition-all -ml-2"
                aria-label="Back"
              >
                <span className="material-symbols-outlined text-[22px]">arrow_back</span>
              </button>
            ) : (
              <img
                src="/logo.svg"
                alt="GrievanceGrid Logo"
                className="h-8 w-auto object-contain shrink-0"
              />
            )}
            <div className="flex flex-col truncate">
              <span className="text-[10px] font-mono tracking-wider uppercase text-[var(--civic-text-muted)] font-bold">
                GrievanceGrid
              </span>
              <h1 className="text-[16px] font-bold text-[var(--civic-primary)] truncate">
                {getHeaderTitle()}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Notification Bell */}
            <button
              onClick={() => {
                setSelectedDetailId(null);
                setCurrentTab('NOTIFICATIONS');
              }}
              className="w-10 h-10 flex items-center justify-center rounded-full text-[var(--civic-text-muted)] hover:text-[var(--civic-primary)] hover:bg-[var(--civic-canvas)] transition-colors relative"
              aria-label="Notifications"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              {unreadNotifCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--civic-error)] ring-2 ring-white"></span>
              )}
            </button>

            {/* Profile Avatar */}
            <button
              onClick={() => {
                setSelectedDetailId(null);
                setCurrentTab('PROFILE');
              }}
              className="w-8 h-8 rounded-full bg-[var(--civic-container)] text-white flex items-center justify-center shrink-0 hover:ring-2 hover:ring-[var(--civic-secondary)] transition-all font-bold text-[12px]"
              aria-label="Profile"
            >
              {user.name ? user.name.slice(0, 1).toUpperCase() : 'C'}
            </button>
          </div>
        </div>
      </header>

      {/* ==================== 2. MAIN SCROLLABLE CONTENT ==================== */}
      <main className="flex-1 w-full pt-20 pb-24 px-4 max-w-3xl mx-auto">
        {selectedDetailId ? (
          <ComplaintDetailScreen
            complaintId={selectedDetailId}
            onBack={() => setSelectedDetailId(null)}
          />
        ) : (
          <>
            {currentTab === 'HOME' && (
              <CitizenHome
                onStartReport={(cat) => {
                  setReportCategory(cat);
                  setIsReporting(true);
                }}
                onViewComplaints={() => setCurrentTab('MY_COMPLAINTS')}
                onSelectComplaint={(id) => setSelectedDetailId(id)}
              />
            )}

            {currentTab === 'MY_COMPLAINTS' && (
              <MyComplaintsScreen
                onSelectComplaint={(id) => setSelectedDetailId(id)}
                onStartReport={() => {
                  setReportCategory(undefined);
                  setIsReporting(true);
                }}
              />
            )}

            {currentTab === 'NOTIFICATIONS' && (
              <NotificationsScreen
                onSelectComplaint={(id) => setSelectedDetailId(id)}
              />
            )}

            {currentTab === 'PROFILE' && (
              <ProfileScreen
                onShowAccessState={(type) => setActiveAccessState(type)}
              />
            )}
          </>
        )}
      </main>

      {/* ==================== 3. STITCH CITIZEN BOTTOM NAVIGATION ==================== */}
      <nav className="fixed bottom-0 left-0 right-0 pt-1 pb-safe bg-white/95 backdrop-blur-xl border-t border-[var(--civic-border)] shadow-lg z-30">
        <div className="h-16 px-4 max-w-lg mx-auto flex items-center justify-around">
          {/* Home */}
          <button
            onClick={() => {
              setSelectedDetailId(null);
              setCurrentTab('HOME');
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              currentTab === 'HOME' && !selectedDetailId
                ? 'text-[var(--civic-secondary)] font-bold'
                : 'text-[var(--civic-text-muted)] hover:text-[var(--civic-primary)] font-medium'
            }`}
          >
            <span
              className="material-symbols-outlined text-[22px]"
              style={{
                fontVariationSettings:
                  currentTab === 'HOME' && !selectedDetailId ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              home
            </span>
            <span className="text-[11px] mt-0.5">Home</span>
          </button>

          {/* My Complaints */}
          <button
            onClick={() => {
              setSelectedDetailId(null);
              setCurrentTab('MY_COMPLAINTS');
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              currentTab === 'MY_COMPLAINTS'
                ? 'text-[var(--civic-secondary)] font-bold'
                : 'text-[var(--civic-text-muted)] hover:text-[var(--civic-primary)] font-medium'
            }`}
          >
            <span
              className="material-symbols-outlined text-[22px]"
              style={{
                fontVariationSettings: currentTab === 'MY_COMPLAINTS' ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              assignment
            </span>
            <span className="text-[11px] mt-0.5">Complaints</span>
          </button>

          {/* Center Floating Report Button */}
          <div className="flex flex-col items-center justify-center -mt-5">
            <button
              onClick={() => {
                setReportCategory(undefined);
                setIsReporting(true);
              }}
              className="w-13 h-13 p-3 rounded-full bg-[var(--civic-secondary)] text-white shadow-lg hover:bg-[var(--civic-secondary)]/90 active:scale-95 transition-all flex items-center justify-center"
              aria-label="Report a Problem"
            >
              <span className="material-symbols-outlined text-[26px]">add</span>
            </button>
            <span className="text-[10px] font-semibold text-[var(--civic-secondary)] mt-1">
              Report
            </span>
          </div>

          {/* Notifications */}
          <button
            onClick={() => {
              setSelectedDetailId(null);
              setCurrentTab('NOTIFICATIONS');
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors relative ${
              currentTab === 'NOTIFICATIONS'
                ? 'text-[var(--civic-secondary)] font-bold'
                : 'text-[var(--civic-text-muted)] hover:text-[var(--civic-primary)] font-medium'
            }`}
          >
            <span
              className="material-symbols-outlined text-[22px]"
              style={{
                fontVariationSettings: currentTab === 'NOTIFICATIONS' ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              notifications
            </span>
            <span className="text-[11px] mt-0.5">Alerts</span>
            {unreadNotifCount > 0 && (
              <span className="absolute top-1 right-5 w-2 h-2 rounded-full bg-[var(--civic-error)]"></span>
            )}
          </button>

          {/* Profile */}
          <button
            onClick={() => {
              setSelectedDetailId(null);
              setCurrentTab('PROFILE');
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              currentTab === 'PROFILE'
                ? 'text-[var(--civic-secondary)] font-bold'
                : 'text-[var(--civic-text-muted)] hover:text-[var(--civic-primary)] font-medium'
            }`}
          >
            <span
              className="material-symbols-outlined text-[22px]"
              style={{
                fontVariationSettings: currentTab === 'PROFILE' ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              person
            </span>
            <span className="text-[11px] mt-0.5">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
};

export default App;
