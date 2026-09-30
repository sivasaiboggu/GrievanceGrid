import React, { useState, useEffect } from 'react';
import { Complaint } from '../../types';
import { api } from '../../api';

interface MyComplaintsScreenProps {
  onSelectComplaint: (id: string) => void;
  onStartReport: () => void;
}

export const MyComplaintsScreen: React.FC<MyComplaintsScreenProps> = ({
  onSelectComplaint,
  onStartReport,
}) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;
      const data = await api.getComplaints(params);
      setComplaints(data);
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter, searchQuery]);

  const tabs = [
    { id: '', label: 'All Submissions' },
    { id: 'SUBMITTED', label: 'Submitted' },
    { id: 'IN_PROGRESS', label: 'In Progress' },
    { id: 'AWAITING_VERIFICATION', label: 'Awaiting Verification' },
    { id: 'RESOLVED', label: 'Resolved' },
    { id: 'APPEALED', label: 'Appealed' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return { bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: 'send', label: 'Submitted' };
      case 'ASSIGNED':
        return { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: 'assignment_ind', label: 'Assigned' };
      case 'IN_PROGRESS':
        return { bg: 'bg-amber-50 text-amber-800 border-amber-200', icon: 'sync', label: 'In Progress' };
      case 'AWAITING_VERIFICATION':
        return { bg: 'bg-purple-50 text-purple-700 border-purple-200', icon: 'verified', label: 'Awaiting Verification' };
      case 'RESOLVED':
        return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: 'check_circle', label: 'Resolved' };
      case 'APPEALED':
        return { bg: 'bg-rose-50 text-rose-700 border-rose-200', icon: 'gavel', label: 'Appealed' };
      default:
        return { bg: 'bg-gray-50 text-gray-700 border-gray-200', icon: 'help', label: status };
    }
  };

  return (
    <div className="flex flex-col w-full gap-4 pb-8 max-w-3xl mx-auto">
      {/* Header Info */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="text-[20px] font-bold text-[var(--civic-primary)] tracking-tight">
            My Civic Submissions
          </h2>
          <p className="text-[13px] text-[var(--civic-text-muted)]">
            Verified audit trail & SLA tracking for municipal filings
          </p>
        </div>
        <button
          onClick={onStartReport}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--civic-container)] text-white text-[13px] font-semibold hover:opacity-95 shadow-sm active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>New Report</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 -mx-2 px-2 no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all border ${
              statusFilter === tab.id
                ? 'bg-[var(--civic-container)] text-white border-[var(--civic-container)] shadow-sm'
                : 'bg-white text-[var(--civic-text-muted)] border-[var(--civic-border)] hover:bg-[var(--civic-canvas)] hover:text-[var(--civic-primary)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative w-full">
        <span className="material-symbols-outlined absolute left-3 top-2.5 text-[var(--civic-text-muted)] text-[20px]">
          search
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by tracking ID, category, or location..."
          className="w-full h-10 pl-10 pr-4 bg-white rounded-xl border border-[var(--civic-border)] text-[13px] text-[var(--civic-primary)] focus:outline-none focus:border-[var(--civic-secondary)] shadow-sm"
        />
      </div>

      {/* Complaint List */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white rounded-xl border border-[var(--civic-border)] animate-pulse p-4" />
          ))}
        </div>
      ) : complaints.length === 0 ? (
        <div className="bg-white rounded-xl p-10 border border-[var(--civic-border)] text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-[var(--civic-surface-dim)] flex items-center justify-center text-[var(--civic-text-muted)] mb-3">
            <span className="material-symbols-outlined text-[26px]">find_in_page</span>
          </div>
          <h3 className="text-[15px] font-semibold text-[var(--civic-primary)]">No Records Found</h3>
          <p className="text-[13px] text-[var(--civic-text-muted)] max-w-xs mt-1 mb-4">
            {statusFilter
              ? `No complaints currently matching status "${statusFilter}".`
              : "You haven't filed any municipal complaints yet."}
          </p>
          <button
            onClick={onStartReport}
            className="px-4 py-2 bg-[var(--civic-container)] text-white text-[13px] font-semibold rounded-lg hover:opacity-95"
          >
            File a Report Now
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {complaints.map((c) => {
            const badge = getStatusBadge(c.status);
            return (
              <article
                key={c.id}
                onClick={() => onSelectComplaint(c.id)}
                className="flex flex-col rounded-xl bg-white p-4 shadow-sm border border-[var(--civic-border)] hover:border-[var(--civic-secondary)] cursor-pointer transition-all gap-3 active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[13px] font-bold text-[var(--civic-secondary)]">
                        {c.tracking_number || c.id}
                      </span>
                      <span className="text-[12px] text-[var(--civic-text-muted)]">
                        • {c.category}
                      </span>
                    </div>
                    <h3 className="text-[15px] font-semibold text-[var(--civic-primary)] mt-1 truncate">
                      {c.description.slice(0, 70)}...
                    </h3>
                  </div>

                  <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider border ${badge.bg}`}>
                    <span className="material-symbols-outlined text-[13px]">{badge.icon}</span>
                    <span>{badge.label}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 pt-1 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 text-[var(--civic-text-muted)] text-[12px]">
                    <span className="material-symbols-outlined text-[15px] text-[var(--civic-secondary)] shrink-0">
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
                      <span>{c.issues?.length || 1} {c.issues?.length === 1 ? 'sub-issue' : 'sub-issues'} separated</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">schedule</span>
                      <span>Updated {new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
