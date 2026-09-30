import React, { useState, useEffect } from 'react';
import { Complaint } from '../../types';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';

interface CitizenHomeProps {
  onStartReport: (category?: string) => void;
  onViewComplaints: () => void;
  onSelectComplaint: (id: string) => void;
}

export const CitizenHome: React.FC<CitizenHomeProps> = ({
  onStartReport,
  onViewComplaints,
  onSelectComplaint,
}) => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await api.getComplaints();
        setComplaints(data);
      } catch (err) {
        console.error('Failed to load recent complaints:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const activeComplaints = complaints.filter(
    (c) => c.status !== 'RESOLVED'
  );
  const recentComplaints = complaints.slice(0, 3);

  const categories = [
    { id: 'Road Damage', icon: 'edit_road', desc: 'Potholes, cracks, curbs' },
    { id: 'Streetlight Issues', icon: 'light', desc: 'Outages, flickering' },
    { id: 'Garbage & Waste', icon: 'delete', desc: 'Overflow, dumping' },
    { id: 'Drainage & Sewage', icon: 'water_damage', desc: 'Clogged storm drains' },
    { id: 'Water Supply', icon: 'water_drop', desc: 'Leaks, low pressure' },
    { id: 'Traffic & Road Obstructions', icon: 'traffic', desc: 'Blocked crosswalks' },
    { id: 'Public Infrastructure Damage', icon: 'apartment', desc: 'Damaged signs, benches' },
    { id: 'Sanitation & Public Cleanliness', icon: 'cleaning_services', desc: 'Litter, public parks' },
  ];

  return (
    <div className="flex flex-col w-full gap-5 pb-8 max-w-3xl mx-auto">
      {/* 1. Welcome & Transparent Civic Mission Hero */}
      <section className="flex flex-col gap-2 pt-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--civic-surface-dim)] w-fit">
          <span className="w-2 h-2 rounded-full bg-[var(--civic-secondary)] animate-pulse"></span>
          <span className="text-[11px] text-[var(--civic-text-muted)] font-semibold tracking-wider uppercase font-mono">
            Municipal Grievance System Online
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="text-[28px] sm:text-[32px] font-bold text-[var(--civic-primary)] tracking-tight leading-tight">
            Report clearly.<br />
            <span className="text-[var(--civic-secondary)]">Resolve transparently.</span>
          </h2>
          <p className="text-[14px] text-[var(--civic-text-muted)] leading-relaxed max-w-xl">
            Civic accountability engine connecting neighborhood incidents directly to verified municipal response units.
          </p>
        </div>
      </section>

      {/* 2. Primary Tactile Civic Action Card */}
      <section className="relative overflow-hidden rounded-xl bg-[var(--civic-container)] text-white shadow-xl p-5 border border-[var(--civic-border)]">
        <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-[var(--civic-secondary)]/15 pointer-events-none blur-2xl"></div>
        <div className="flex flex-col gap-4 relative z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[#708cfd]">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                <span className="text-[11px] uppercase tracking-wider font-semibold">
                  Tri-Partite Verified Filing
                </span>
              </div>
              <h3 className="text-[18px] sm:text-[20px] font-semibold text-white">
                Encountered an infrastructure fault?
              </h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[#b8c4ff] text-[24px]">assignment_turned_in</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => onStartReport()}
              className="flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-lg bg-[var(--civic-secondary)] text-white font-semibold text-[15px] shadow-md hover:bg-[var(--civic-secondary)]/90 active:scale-[0.99] transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              <span>Report a Problem</span>
            </button>
            <div className="flex items-center justify-center gap-1.5 text-gray-300 text-[12px]">
              <span className="material-symbols-outlined text-[15px]">timer</span>
              <p>Takes ~2 minutes • Municipal triage within 4 hours</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Active Grievances Live Progress Banner */}
      <section className="rounded-xl bg-white border border-[var(--civic-border)] shadow-sm overflow-hidden p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-[var(--civic-surface-dim)] text-[var(--civic-secondary)] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">pending_actions</span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[14px] font-semibold text-[var(--civic-primary)]">
                  {activeComplaints.length} Active {activeComplaints.length === 1 ? 'Complaint' : 'Complaints'}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-[var(--civic-secondary-fixed)] text-[var(--civic-secondary)] text-[10px] font-mono font-bold">
                  Active
                </span>
              </div>
              <p className="text-[12px] text-[var(--civic-text-muted)] truncate">
                Assignment Status: Active
              </p>
            </div>
          </div>
          <button
            onClick={onViewComplaints}
            className="shrink-0 flex items-center gap-1 text-[13px] font-semibold text-[var(--civic-secondary)] hover:underline pl-2 py-1"
          >
            <span>Track</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </section>

      {/* 4. Quick Category Filing Grid */}
      <section className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-[var(--civic-primary)]">
            Explore Categories
          </h3>
          <span className="text-[12px] text-[var(--civic-text-muted)]">
            8 Departments Monitored
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onStartReport(cat.id)}
              className="flex flex-col items-start p-3 bg-white hover:bg-[var(--civic-canvas)] border border-[var(--civic-border)] rounded-xl text-left transition-all hover:border-[var(--civic-secondary)] group active:scale-[0.98]"
            >
              <div className="w-8 h-8 rounded-lg bg-[var(--civic-surface-dim)] text-[var(--civic-secondary)] flex items-center justify-center mb-2 group-hover:bg-[var(--civic-secondary)] group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[18px]">{cat.icon}</span>
              </div>
              <span className="text-[13px] font-semibold text-[var(--civic-primary)] leading-snug">
                {cat.id}
              </span>
              <span className="text-[11px] text-[var(--civic-text-muted)] truncate w-full mt-0.5">
                {cat.desc}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 5. Recent Complaints Ledger */}
      <section className="flex flex-col gap-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-[16px] font-semibold text-[var(--civic-primary)]">Recent Reports</h3>
            <span className="px-2 py-0.5 rounded-full bg-[var(--civic-surface-dim)] text-[11px] font-mono font-medium text-[var(--civic-text-muted)]">
              {complaints.length} Listed
            </span>
          </div>
          <button
            onClick={onViewComplaints}
            className="text-[13px] font-medium text-[var(--civic-secondary)] hover:underline"
          >
            View All
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-28 bg-white rounded-xl border border-[var(--civic-border)] animate-pulse p-4" />
            ))}
          </div>
        ) : recentComplaints.length === 0 ? (
          <div className="bg-white rounded-xl p-8 border border-[var(--civic-border)] text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-[var(--civic-surface-dim)] flex items-center justify-center text-[var(--civic-text-muted)] mb-3">
              <span className="material-symbols-outlined text-[24px]">inbox</span>
            </div>
            <h4 className="text-[15px] font-semibold text-[var(--civic-primary)]">No Reports Yet</h4>
            <p className="text-[13px] text-[var(--civic-text-muted)] max-w-xs mt-1 mb-4">
              You haven't filed any municipal grievances. All verified submissions will appear here.
            </p>
            <button
              onClick={() => onStartReport()}
              className="px-4 py-2 bg-[var(--civic-container)] text-white text-[13px] font-semibold rounded-lg hover:opacity-95"
            >
              Report First Problem
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {recentComplaints.map((c) => {
              const statusColors: Record<string, { bg: string; text: string; icon: string }> = {
                SUBMITTED: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'send' },
                ASSIGNED: { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: 'assignment_ind' },
                IN_PROGRESS: { bg: 'bg-amber-50', text: 'text-amber-800', icon: 'published_with_changes' },
                AWAITING_VERIFICATION: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'verified' },
                RESOLVED: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'check_circle' },
                APPEALED: { bg: 'bg-rose-50', text: 'text-rose-700', icon: 'gavel' },
              };
              const badge = statusColors[c.status] || statusColors.SUBMITTED;

              return (
                <article
                  key={c.id}
                  onClick={() => onSelectComplaint(c.id)}
                  className="flex flex-col rounded-xl bg-white p-4 shadow-sm border border-[var(--civic-border)] hover:border-[var(--civic-secondary)] cursor-pointer transition-all gap-3 active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[12px] font-semibold text-[var(--civic-secondary)]">
                          {c.tracking_number || c.id}
                        </span>
                        <span className="text-[12px] text-[var(--civic-text-muted)]">
                          • {c.category}
                        </span>
                      </div>
                      <h4 className="text-[15px] font-semibold text-[var(--civic-primary)] mt-0.5 truncate">
                        {c.description.slice(0, 60)}...
                      </h4>
                    </div>
                    <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${badge.bg} ${badge.text}`}>
                      <span className="material-symbols-outlined text-[13px]">{badge.icon}</span>
                      <span>{c.status.replace(/_/g, ' ')}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 pt-0.5 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 text-[var(--civic-text-muted)] text-[12px]">
                      <span className="material-symbols-outlined text-[15px] shrink-0 text-[var(--civic-secondary)]">
                        location_on
                      </span>
                      <span className="truncate">
                        {c.address_text || (c.latitude ? `GPS: ${c.latitude.toFixed(4)}, ${c.longitude?.toFixed(4)}` : 'Configured Municipal Area')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[12px] text-[var(--civic-text-muted)]">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--civic-surface-dim)] text-[var(--civic-primary)] text-[11px] font-medium">
                        <span className="material-symbols-outlined text-[13px] text-[var(--civic-secondary)]">
                          account_tree
                        </span>
                        <span>{c.issues?.length || 1} {c.issues?.length === 1 ? 'sub-issue' : 'sub-issues'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">schedule</span>
                        <span>{new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
