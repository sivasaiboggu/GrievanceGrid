import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';

// ── Types ─────────────────────────────────────────────────────────────────────
interface OverviewStats {
  needs_triage: number;
  in_progress: number;
  awaiting_verification: number;
  appeals: number;
  total_active: number;
}

interface ComplaintRow {
  id: string;
  tracking_id: string;
  title: string;
  category: string;
  location: string;
  priority: string;
  status: string;
  created_at: string;
  sub_issues_count?: number;
}

type OfficerTab = 'OVERVIEW' | 'COMPLAINTS' | 'WORK_ORDERS' | 'NOTIFICATIONS' | 'PROFILE';

// ── Constants ─────────────────────────────────────────────────────────────────
const PRIORITY_COLOR: Record<string, string> = {
  URGENT: '#BA1A1A',
  HIGH: '#C84B00',
  MEDIUM: '#6B4F00',
  LOW: '#2E5800',
};
const PRIORITY_BG: Record<string, string> = {
  URGENT: '#FFDAD6',
  HIGH: '#FFE8D9',
  MEDIUM: '#FFF2CC',
  LOW: '#E9F5D4',
};
const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: 'Submitted',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  AWAITING_VERIFICATION: 'Awaiting Verification',
  RESOLVED: 'Resolved',
  APPEALED: 'Appealed',
  TRIAGED: 'Triaged',
};
const STATUS_COLOR: Record<string, string> = {
  SUBMITTED: '#3755C3',
  ASSIGNED: '#3755C3',
  IN_PROGRESS: '#6B4F00',
  AWAITING_VERIFICATION: '#C84B00',
  RESOLVED: '#2E5800',
  APPEALED: '#BA1A1A',
  TRIAGED: '#0F1E36',
};
const STATUS_BG: Record<string, string> = {
  SUBMITTED: '#EFF4FF',
  ASSIGNED: '#EFF4FF',
  IN_PROGRESS: '#FFF2CC',
  AWAITING_VERIFICATION: '#FFE8D9',
  RESOLVED: '#E9F5D4',
  APPEALED: '#FFDAD6',
  TRIAGED: '#E5EEFF',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(iso: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso.slice(0, 10);
  }
}

function StatCard({ label, value, icon, accent }: { label: string; value: number | string; icon: string; accent?: string }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #E2E8F0',
      borderRadius: 8,
      padding: '20px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      boxShadow: '0 1px 3px rgba(11,28,48,0.05)',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 8,
        background: accent ? `${accent}18` : '#EFF4FF',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: accent || '#3755C3', flexShrink: 0,
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{icon}</span>
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 700, color: '#0B1C30', lineHeight: 1.2 }}>{value}</div>
        <div style={{ fontSize: 12, color: '#75777E', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 4,
      fontSize: 11, fontWeight: 600,
      background: STATUS_BG[status] || '#F0F0F0',
      color: STATUS_COLOR[status] || '#444',
    }}>
      {STATUS_LABEL[status] || status}
    </span>
  );
}

function PriorityPill({ priority }: { priority: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 4,
      fontSize: 11, fontWeight: 600,
      background: PRIORITY_BG[priority] || '#F0F0F0',
      color: PRIORITY_COLOR[priority] || '#444',
    }}>
      {priority}
    </span>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OfficerOverviewTab({ onViewComplaint }: { onViewComplaint: (id: string) => void }) {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [attention, setAttention] = useState<ComplaintRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await api.getOfficerOverview();
        if (!mounted) return;
        setStats(data.stats);
        setAttention(data.needs_attention || []);
      } catch (e: any) {
        if (mounted) setError(e.message || 'Failed to load overview');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) return (
    <div style={{ padding: 32, textAlign: 'center', color: '#75777E' }}>
      <span className="material-symbols-outlined" style={{ fontSize: 32, animation: 'spin 1s linear infinite' }}>progress_activity</span>
      <div style={{ marginTop: 8 }}>Loading overview…</div>
    </div>
  );

  if (error) return (
    <div style={{ padding: 32, textAlign: 'center', color: '#BA1A1A' }}>
      <span className="material-symbols-outlined" style={{ fontSize: 32 }}>error</span>
      <div style={{ marginTop: 8 }}>{error}</div>
    </div>
  );

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0B1C30', marginBottom: 20 }}>Operational Overview</h2>
      
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          <StatCard label="Needs Triage" value={stats.needs_triage} icon="inbox" accent="#3755C3" />
          <StatCard label="In Progress" value={stats.in_progress} icon="construction" accent="#6B4F00" />
          <StatCard label="Awaiting Verification" value={stats.awaiting_verification} icon="pending_actions" accent="#C84B00" />
          <StatCard label="Open Appeals" value={stats.appeals} icon="gavel" accent="#BA1A1A" />
          <StatCard label="Total Active" value={stats.total_active} icon="assignment" />
        </div>
      )}

      {attention.length > 0 && (
        <>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0B1C30', marginBottom: 12 }}>Requires Attention</h3>
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8F9FF', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={thStyle}>Tracking ID</th>
                  <th style={thStyle}>Title</th>
                  <th style={thStyle}>Category</th>
                  <th style={thStyle}>Priority</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Filed</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {attention.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: i < attention.length - 1 ? '1px solid #E2E8F0' : 'none' }}>
                    <td style={tdStyle}><span style={{ fontFamily: 'monospace', fontSize: 12, color: '#3755C3' }}>{c.tracking_id}</span></td>
                    <td style={{ ...tdStyle, maxWidth: 240 }}>
                      <div style={{ fontWeight: 500, color: '#0B1C30', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                      <div style={{ fontSize: 11, color: '#75777E', marginTop: 2 }}>{c.location}</div>
                    </td>
                    <td style={tdStyle}><span style={{ fontSize: 12, color: '#44474D' }}>{c.category}</span></td>
                    <td style={tdStyle}><PriorityPill priority={c.priority} /></td>
                    <td style={tdStyle}><StatusPill status={c.status} /></td>
                    <td style={tdStyle}><span style={{ fontSize: 12, color: '#75777E' }}>{fmtDate(c.created_at)}</span></td>
                    <td style={tdStyle}>
                      <button onClick={() => onViewComplaint(c.id)} style={actionBtnStyle}>
                        Review <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {attention.length === 0 && stats && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#75777E' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#2E5800' }}>check_circle</span>
          <div style={{ marginTop: 8, fontWeight: 500 }}>No complaints require immediate attention</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>All active complaints are being processed</div>
        </div>
      )}
    </div>
  );
}

// ── Complaints Queue Tab ──────────────────────────────────────────────────────
function OfficerComplaintsTab({ onViewComplaint }: { onViewComplaint: (id: string) => void }) {
  const [complaints, setComplaints] = useState<ComplaintRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const STATUSES = ['ALL', 'SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'AWAITING_VERIFICATION', 'RESOLVED', 'APPEALED'];
  const CATEGORIES = ['ALL', 'Road Damage', 'Streetlight Issues', 'Garbage & Waste', 'Drainage & Sewage', 'Water Supply', 'Traffic & Road Obstructions', 'Public Infrastructure Damage', 'Sanitation & Public Cleanliness'];

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (categoryFilter !== 'ALL') params.category = categoryFilter;
      if (search.trim()) params.search = search.trim();
      const data = await api.getComplaints(params);
      setComplaints(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, search]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0B1C30' }}>Complaint Queue</h2>
        <div style={{ fontSize: 12, color: '#75777E' }}>{complaints.length} complaint{complaints.length !== 1 ? 's' : ''}</div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search tracking ID, title, location…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && load()}
          style={searchInputStyle}
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
          {STATUSES.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : STATUS_LABEL[s] || s}</option>)}
        </select>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={selectStyle}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c === 'ALL' ? 'All Categories' : c}</option>)}
        </select>
        <button onClick={load} style={filterBtnStyle}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>search</span> Search
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#75777E' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 32 }}>progress_activity</span>
          <div style={{ marginTop: 8 }}>Loading complaints…</div>
        </div>
      ) : error ? (
        <div style={{ padding: 32, background: '#FFDAD6', borderRadius: 8, color: '#93000A', textAlign: 'center' }}>
          {error} — <button onClick={load} style={{ color: '#BA1A1A', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>retry</button>
        </div>
      ) : complaints.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#75777E', background: '#fff', borderRadius: 8, border: '1px solid #E2E8F0' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40 }}>inbox</span>
          <div style={{ marginTop: 8, fontWeight: 500 }}>No complaints found</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Try adjusting your filters</div>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8F9FF', borderBottom: '1px solid #E2E8F0' }}>
                <th style={thStyle}>Tracking ID</th>
                <th style={thStyle}>Complaint</th>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>Issues</th>
                <th style={thStyle}>Priority</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Filed</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((c, i) => (
                <tr
                  key={c.id}
                  style={{
                    borderBottom: i < complaints.length - 1 ? '1px solid #E2E8F0' : 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F8F9FF')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => onViewComplaint(c.id)}
                >
                  <td style={tdStyle}><span style={{ fontFamily: 'monospace', fontSize: 12, color: '#3755C3' }}>{c.tracking_id}</span></td>
                  <td style={{ ...tdStyle, maxWidth: 260 }}>
                    <div style={{ fontWeight: 500, color: '#0B1C30', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                    <div style={{ fontSize: 11, color: '#75777E', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(c as any).location}</div>
                  </td>
                  <td style={tdStyle}><span style={{ fontSize: 12, color: '#44474D' }}>{c.category}</span></td>
                  <td style={tdStyle}><span style={{ fontSize: 13, fontWeight: 600, color: '#3755C3' }}>{c.sub_issues_count || 1}</span></td>
                  <td style={tdStyle}><PriorityPill priority={c.priority} /></td>
                  <td style={tdStyle}><StatusPill status={c.status} /></td>
                  <td style={tdStyle}><span style={{ fontSize: 12, color: '#75777E' }}>{fmtDate(c.created_at)}</span></td>
                  <td style={tdStyle}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#3755C3' }}>chevron_right</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Work Orders Tab ───────────────────────────────────────────────────────────
function OfficerWorkOrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const WO_STATUSES = ['ALL', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'AWAITING_VERIFICATION'];

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const data = await api.getWorkOrders(params);
      setOrders(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message || 'Failed to load work orders');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const WO_STATUS_COLORS: Record<string, { bg: string; color: string }> = {
    ASSIGNED: { bg: '#EFF4FF', color: '#3755C3' },
    IN_PROGRESS: { bg: '#FFF2CC', color: '#6B4F00' },
    COMPLETED: { bg: '#E9F5D4', color: '#2E5800' },
    AWAITING_VERIFICATION: { bg: '#FFE8D9', color: '#C84B00' },
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0B1C30' }}>Work Orders</h2>
        <div style={{ fontSize: 12, color: '#75777E' }}>{orders.length} order{orders.length !== 1 ? 's' : ''}</div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
          {WO_STATUSES.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s.replace(/_/g, ' ')}</option>)}
        </select>
        <button onClick={load} style={filterBtnStyle}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#75777E' }}>Loading work orders…</div>
      ) : error ? (
        <div style={{ padding: 24, background: '#FFDAD6', borderRadius: 8, color: '#93000A' }}>{error}</div>
      ) : orders.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#75777E', background: '#fff', borderRadius: 8, border: '1px solid #E2E8F0' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40 }}>engineering</span>
          <div style={{ marginTop: 8, fontWeight: 500 }}>No work orders found</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {orders.map(o => {
            const sc = WO_STATUS_COLORS[o.status] || { bg: '#F0F0F0', color: '#444' };
            return (
              <div key={o.id} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: '16px 20px', boxShadow: '0 1px 3px rgba(11,28,48,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#3755C3', background: '#EFF4FF', padding: '2px 6px', borderRadius: 3 }}>{o.id}</span>
                      <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color }}>{o.status.replace(/_/g, ' ')}</span>
                      <PriorityPill priority={o.priority} />
                    </div>
                    <div style={{ fontWeight: 600, color: '#0B1C30', fontSize: 14, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {o.complaint_title || 'Work Order'}
                    </div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: '#75777E', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>person</span>
                        {o.assigned_worker_name || 'Unassigned'}
                      </span>
                      <span style={{ fontSize: 12, color: '#75777E', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>business</span>
                        {o.department_name || 'N/A'}
                      </span>
                      {o.complaint_location && (
                        <span style={{ fontSize: 12, color: '#75777E', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>location_on</span>
                          {o.complaint_location}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 11, color: '#75777E' }}>Created</div>
                    <div style={{ fontSize: 12, color: '#44474D', fontWeight: 500 }}>{fmtDate(o.created_at)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Notifications Tab ─────────────────────────────────────────────────────────
function OfficerNotificationsTab() {
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getNotifications().then(data => {
      setNotifs(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const markRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch {
      // silent
    }
  };

  const markAll = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifs(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch {
      // silent
    }
  };

  const unread = notifs.filter(n => !n.is_read).length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0B1C30' }}>
          Notifications {unread > 0 && <span style={{ fontSize: 13, fontWeight: 500, color: '#BA1A1A', marginLeft: 8 }}>{unread} unread</span>}
        </h2>
        {unread > 0 && (
          <button onClick={markAll} style={{ ...filterBtnStyle, fontSize: 12 }}>Mark all read</button>
        )}
      </div>
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#75777E' }}>Loading…</div>
      ) : notifs.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#75777E', background: '#fff', borderRadius: 8, border: '1px solid #E2E8F0' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40 }}>notifications_none</span>
          <div style={{ marginTop: 8, fontWeight: 500 }}>No notifications</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {notifs.map(n => (
            <div key={n.id} onClick={() => markRead(n.id)} style={{
              padding: '14px 20px',
              background: n.is_read ? '#fff' : '#F0F4FF',
              border: '1px solid #E2E8F0',
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex', alignItems: 'flex-start', gap: 12,
              marginBottom: 4,
            }}>
              {!n.is_read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3755C3', marginTop: 5, flexShrink: 0 }} />}
              {n.is_read && <div style={{ width: 8, flexShrink: 0 }} />}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: n.is_read ? 400 : 600, color: '#0B1C30', fontSize: 14 }}>{n.title}</div>
                <div style={{ fontSize: 13, color: '#44474D', marginTop: 2 }}>{n.message}</div>
                <div style={{ fontSize: 11, color: '#75777E', marginTop: 4 }}>{fmtDate(n.created_at)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Profile Tab ───────────────────────────────────────────────────────────────
function OfficerProfileTab() {
  const { user, logout } = useAuth();
  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0B1C30', marginBottom: 24 }}>Officer Profile</h2>
      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: 24, maxWidth: 480 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: '#0F1E36', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 700,
          }}>
            {user?.name?.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#0B1C30' }}>{user?.name}</div>
            <div style={{ fontSize: 13, color: '#3755C3', fontWeight: 500 }}>Municipal Officer</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ProfileRow icon="email" label="Email" value={user?.email} />
          <ProfileRow icon="phone" label="Phone" value={user?.phone || '—'} />
          <ProfileRow icon="badge" label="Role" value="Municipal Officer / GRO" />
        </div>
        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #E2E8F0' }}>
          <button onClick={logout} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 6,
            background: '#FFDAD6', color: '#BA1A1A',
            border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileRow({ icon, label, value }: { icon: string; label: string; value?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#75777E', width: 24 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 11, color: '#75777E' }}>{label}</div>
        <div style={{ fontSize: 14, color: '#0B1C30', fontWeight: 500 }}>{value || '—'}</div>
      </div>
    </div>
  );
}

// ── Complaint Detail Panel ─────────────────────────────────────────────────────
function ComplaintDetailPanel({ complaintId, onBack }: { complaintId: string; onBack: () => void }) {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [fieldWorkers, setFieldWorkers] = useState<any[]>([]);

  // Triage form state
  const [triageDept, setTriageDept] = useState('');
  const [triagePriority, setTriagePriority] = useState('MEDIUM');
  const [triageMsg, setTriageMsg] = useState('');
  const [triageLoading, setTriageLoading] = useState(false);

  // Resolution form state
  const [resNotes, setResNotes] = useState('');
  const [resCoverage, setResCoverage] = useState('ADDRESSED');
  const [resLoading, setResLoading] = useState(false);
  const [resMsg, setResMsg] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [d, depts, workers] = await Promise.all([
          api.getComplaint(complaintId),
          api.getDepartments(),
          api.getFieldWorkers(),
        ]);
        if (!mounted) return;
        setDetail(d);
        setDepartments(Array.isArray(depts) ? depts : []);
        setFieldWorkers(Array.isArray(workers) ? workers : []);
      } catch (e: any) {
        if (mounted) setError(e.message || 'Failed to load complaint');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [complaintId]);

  const doTriage = async () => {
    if (!triageDept) { setTriageMsg('Please select a department.'); return; }
    setTriageLoading(true); setTriageMsg('');
    try {
      await api.triageComplaint(complaintId, { department_id: triageDept, priority: triagePriority });
      setTriageMsg('Complaint triaged successfully.');
      const d = await api.getComplaint(complaintId);
      setDetail(d);
    } catch (e: any) {
      setTriageMsg(`Error: ${e.message}`);
    } finally {
      setTriageLoading(false);
    }
  };

  const doResolve = async () => {
    if (!resNotes.trim()) { setResMsg('Please enter resolution notes.'); return; }
    setResLoading(true); setResMsg('');
    try {
      await api.officerDecision(complaintId, {
        action: 'RESOLVE',
        resolution_notes: resNotes,
        coverage_status: resCoverage
      });
      setResMsg('Complaint officially resolved by Municipal Officer.');
      const d = await api.getComplaint(complaintId);
      setDetail(d);
    } catch (e: any) {
      setResMsg(`Error: ${e.message}`);
    } finally {
      setResLoading(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#75777E' }}>Loading complaint…</div>;
  if (error) return <div style={{ padding: 32, color: '#BA1A1A' }}>{error}</div>;
  if (!detail) return null;

  const complaint = detail.complaint || detail;
  const issues = detail.issues || [];
  const attachments = detail.attachments || [];
  const history = detail.status_history || [];
  const appeals = detail.appeals || [];

  return (
    <div>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, color: '#3755C3', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span> Back to Queue
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Header card */}
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#3755C3', background: '#EFF4FF', padding: '3px 8px', borderRadius: 4 }}>{complaint.tracking_id}</span>
                  <StatusPill status={complaint.status} />
                  <PriorityPill priority={complaint.priority} />
                </div>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0B1C30', marginBottom: 6 }}>{complaint.title}</h1>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, color: '#75777E', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>location_on</span>{complaint.location}
                  </span>
                  <span style={{ fontSize: 13, color: '#75777E', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>category</span>{complaint.category}
                  </span>
                  <span style={{ fontSize: 13, color: '#75777E', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>schedule</span>{fmtDate(complaint.created_at)}
                  </span>
                </div>
              </div>
            </div>
            <div style={{ fontSize: 14, color: '#44474D', lineHeight: 1.6 }}>{complaint.description}</div>
          </div>

          {/* Issues */}
          {issues.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0B1C30', marginBottom: 12 }}>Identified Issues ({issues.length})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {issues.map((issue: any, i: number) => (
                  <div key={issue.id || i} style={{ padding: '12px 16px', background: '#F8F9FF', borderRadius: 6, borderLeft: '3px solid #3755C3' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#3755C3' }}>Issue {i + 1}</span>
                      <span style={{ fontSize: 11, background: '#E5EEFF', color: '#3755C3', padding: '1px 6px', borderRadius: 3 }}>{issue.category}</span>
                      {issue.status && <StatusPill status={issue.status} />}
                      {issue.coverage_status && issue.coverage_status !== 'PENDING' && (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                          background: issue.coverage_status === 'ADDRESSED' ? '#E9F5D4' : issue.coverage_status === 'PARTIAL' ? '#FFF2CC' : '#FFDAD6',
                          color: issue.coverage_status === 'ADDRESSED' ? '#2E5800' : issue.coverage_status === 'PARTIAL' ? '#6B4F00' : '#BA1A1A',
                        }}>
                          {issue.coverage_status}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: '#44474D' }}>{issue.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evidence */}
          {attachments.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0B1C30', marginBottom: 12 }}>
                Evidence ({attachments.length} file{attachments.length !== 1 ? 's' : ''})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {attachments.map((att: any) => (
                  <div key={att.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#F8F9FF', borderRadius: 6 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#3755C3' }}>attach_file</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#0B1C30' }}>{att.file_name}</div>
                      {att.sha256_hash && (
                        <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#75777E', marginTop: 2 }}>SHA-256: {att.sha256_hash.slice(0, 20)}…</div>
                      )}
                    </div>
                    {att.synthetic_risk_score > 0.5 && (
                      <span style={{ fontSize: 11, background: '#FFF2CC', color: '#6B4F00', padding: '2px 6px', borderRadius: 3, fontWeight: 500 }}>
                        Risk flagged — manual review required
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status History */}
          {history.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0B1C30', marginBottom: 12 }}>Case History</h3>
              <div style={{ position: 'relative', paddingLeft: 20 }}>
                <div style={{ position: 'absolute', left: 8, top: 8, bottom: 8, width: 2, background: '#E2E8F0' }} />
                {history.map((h: any, i: number) => (
                  <div key={h.id || i} style={{ position: 'relative', marginBottom: 12 }}>
                    <div style={{ position: 'absolute', left: -16, top: 4, width: 8, height: 8, borderRadius: '50%', background: '#3755C3' }} />
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#0B1C30' }}>{h.new_status?.replace(/_/g, ' ')}</div>
                    <div style={{ fontSize: 11, color: '#75777E' }}>{h.notes} · {fmtDate(h.created_at)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Appeals */}
          {appeals.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0B1C30', marginBottom: 12 }}>Appeals</h3>
              {appeals.map((a: any) => (
                <div key={a.id} style={{ padding: '12px 14px', background: '#FFDAD6', borderRadius: 6, marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#BA1A1A' }}>Appeal — {a.status}</span>
                    <span style={{ fontSize: 11, color: '#75777E' }}>{fmtDate(a.created_at)}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#44474D' }}>{a.reason}</div>
                  {a.officer_notes && <div style={{ fontSize: 12, color: '#75777E', marginTop: 6 }}>Officer notes: {a.officer_notes}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Triage */}
          {['SUBMITTED', 'ASSIGNED'].includes(complaint.status) && (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0B1C30', marginBottom: 14 }}>Triage Complaint</h3>
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>Assign Department</label>
                <select value={triageDept} onChange={e => setTriageDept(e.target.value)} style={{ ...selectStyle, width: '100%' }}>
                  <option value="">Select department…</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Priority</label>
                <select value={triagePriority} onChange={e => setTriagePriority(e.target.value)} style={{ ...selectStyle, width: '100%' }}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              {triageMsg && <div style={{ fontSize: 12, color: triageMsg.startsWith('Error') ? '#BA1A1A' : '#2E5800', marginBottom: 10 }}>{triageMsg}</div>}
              <button onClick={doTriage} disabled={triageLoading} style={{ ...primaryBtnStyle, width: '100%' }}>
                {triageLoading ? 'Processing…' : 'Assign & Triage'}
              </button>
            </div>
          )}

          {/* Resolve */}
          {['AWAITING_VERIFICATION', 'IN_PROGRESS', 'TRIAGED'].includes(complaint.status) && (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0B1C30', marginBottom: 14 }}>Officer Resolution</h3>
              <div style={{ fontSize: 12, color: '#75777E', marginBottom: 12, lineHeight: 1.5 }}>
                Only authorized Municipal Officers can resolve complaints. Review evidence and select response coverage before resolving.
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Response Coverage Status</label>
                <select
                  value={resCoverage}
                  onChange={e => setResCoverage(e.target.value)}
                  style={{ ...selectStyle, width: '100%' }}
                >
                  <option value="ADDRESSED">ADDRESSED — Remediation verified</option>
                  <option value="PARTIAL">PARTIAL — Sub-issues remain</option>
                  <option value="NOT_ADDRESSED">NOT ADDRESSED — Unresolved</option>
                  <option value="UNCLEAR">UNCLEAR — Insufficient/missing evidence</option>
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Resolution Notes</label>
                <textarea
                  value={resNotes}
                  onChange={e => setResNotes(e.target.value)}
                  rows={3}
                  placeholder="Document verification and resolution rationale…"
                  style={{ ...textareaStyle, width: '100%' }}
                />
              </div>
              {resMsg && <div style={{ fontSize: 12, color: resMsg.startsWith('Error') ? '#BA1A1A' : '#2E5800', marginBottom: 10 }}>{resMsg}</div>}
              <button onClick={doResolve} disabled={resLoading} style={{ ...primaryBtnStyle, width: '100%', background: '#2E5800' }}>
                {resLoading ? 'Processing…' : 'Resolve Complaint'}
              </button>
            </div>
          )}

          {/* Complaint resolved */}
          {complaint.status === 'RESOLVED' && (
            <div style={{ background: '#E9F5D4', border: '1px solid #C0DFA0', borderRadius: 8, padding: 20, textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#2E5800' }}>task_alt</span>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#2E5800', marginTop: 8 }}>Complaint Resolved</div>
              <div style={{ fontSize: 12, color: '#44474D', marginTop: 4 }}>Appeals may be submitted by the citizen</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const thStyle: React.CSSProperties = {
  padding: '10px 16px',
  textAlign: 'left',
  fontSize: 12,
  fontWeight: 600,
  color: '#44474D',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: 13,
  verticalAlign: 'middle',
};

const actionBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '5px 10px', borderRadius: 4,
  background: '#EFF4FF', color: '#3755C3',
  border: '1px solid #CBD5E1', cursor: 'pointer',
  fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
};

const searchInputStyle: React.CSSProperties = {
  padding: '8px 12px', borderRadius: 6,
  border: '1px solid #CBD5E1', fontSize: 13,
  color: '#0B1C30', outline: 'none', minWidth: 260,
};

const selectStyle: React.CSSProperties = {
  padding: '8px 12px', borderRadius: 6,
  border: '1px solid #CBD5E1', fontSize: 13,
  color: '#0B1C30', background: '#fff',
};

const filterBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '8px 14px', borderRadius: 6,
  background: '#0F1E36', color: '#fff',
  border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
};

const primaryBtnStyle: React.CSSProperties = {
  padding: '10px 16px', borderRadius: 6,
  background: '#3755C3', color: '#fff',
  border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 500, color: '#44474D', marginBottom: 6,
};

const textareaStyle: React.CSSProperties = {
  padding: '8px 12px', borderRadius: 6,
  border: '1px solid #CBD5E1', fontSize: 13,
  color: '#0B1C30', resize: 'vertical',
};

// ── Main Officer Dashboard ────────────────────────────────────────────────────
export function OfficerDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<OfficerTab>('OVERVIEW');
  const [viewingComplaintId, setViewingComplaintId] = useState<string | null>(null);

  const navItems: { id: OfficerTab; label: string; icon: string }[] = [
    { id: 'OVERVIEW', label: 'Overview', icon: 'dashboard' },
    { id: 'COMPLAINTS', label: 'Complaints', icon: 'assignment' },
    { id: 'WORK_ORDERS', label: 'Work Orders', icon: 'engineering' },
    { id: 'NOTIFICATIONS', label: 'Notifications', icon: 'notifications' },
    { id: 'PROFILE', label: 'Profile', icon: 'person' },
  ];

  const handleViewComplaint = (id: string) => {
    setViewingComplaintId(id);
    setActiveTab('COMPLAINTS');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8F9FF', fontFamily: 'Inter, sans-serif' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240, background: '#000412', color: '#fff',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #1a2840' }}>
          <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#7886A3', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
            GrievanceGrid
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Officer Portal</div>
          <div style={{ fontSize: 11, color: '#7886A3', marginTop: 2 }}>Municipal Operations</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 12px' }}>
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setViewingComplaintId(null); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 6, marginBottom: 2,
                  background: isActive ? '#0F1E36' : 'transparent',
                  color: isActive ? '#fff' : '#7886A3',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                  fontSize: 14, fontWeight: isActive ? 600 : 400,
                  transition: 'all 150ms',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User footer */}
        <div style={{ padding: '16px 16px', borderTop: '1px solid #1a2840' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: '#3755C3', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, flexShrink: 0,
            }}>
              {user?.name?.slice(0, 1).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: '#7886A3' }}>Officer</div>
            </div>
          </div>
          <button onClick={logout} style={{
            width: '100%', marginTop: 12,
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 10px', borderRadius: 5,
            background: 'transparent', color: '#7886A3',
            border: '1px solid #1a2840', cursor: 'pointer', fontSize: 12,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: 240, flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
        {activeTab === 'OVERVIEW' && <OfficerOverviewTab onViewComplaint={handleViewComplaint} />}
        {activeTab === 'COMPLAINTS' && (
          viewingComplaintId
            ? <ComplaintDetailPanel complaintId={viewingComplaintId} onBack={() => setViewingComplaintId(null)} />
            : <OfficerComplaintsTab onViewComplaint={handleViewComplaint} />
        )}
        {activeTab === 'WORK_ORDERS' && <OfficerWorkOrdersTab />}
        {activeTab === 'NOTIFICATIONS' && <OfficerNotificationsTab />}
        {activeTab === 'PROFILE' && <OfficerProfileTab />}
      </main>
    </div>
  );
}
