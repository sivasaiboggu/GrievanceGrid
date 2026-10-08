import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';

type AuthorityTab = 'OVERVIEW' | 'COMPLAINTS' | 'NOTIFICATIONS' | 'PROFILE';

function fmtDate(iso: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return iso.slice(0, 10); }
}

function MetricCard({ label, value, icon, color }: { label: string; value: number | string; icon: string; color?: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 40, height: 40, borderRadius: 8, background: `${color || '#3755C3'}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color || '#3755C3', flexShrink: 0 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#0B1C30', lineHeight: 1.2 }}>{value}</div>
        <div style={{ fontSize: 11, color: '#75777E', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

function AuthorityOverviewTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getOfficerOverview()
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message || 'Failed to load data'); setLoading(false); });
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#75777E' }}>Loading overview…</div>;
  if (error) return <div style={{ padding: 24, background: '#FFDAD6', borderRadius: 8, color: '#93000A' }}>{error}</div>;

  const stats = data?.stats || {};

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0B1C30', marginBottom: 8 }}>Governance Overview</h2>
      <p style={{ fontSize: 13, color: '#75777E', marginBottom: 20 }}>
        Senior Authority oversight — operational data only. All values sourced from live database.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
        <MetricCard label="Needs Triage" value={stats.needs_triage ?? 0} icon="inbox" color="#3755C3" />
        <MetricCard label="In Progress" value={stats.in_progress ?? 0} icon="construction" color="#6B4F00" />
        <MetricCard label="Awaiting Verification" value={stats.awaiting_verification ?? 0} icon="pending_actions" color="#C84B00" />
        <MetricCard label="Open Appeals" value={stats.appeals ?? 0} icon="gavel" color="#BA1A1A" />
        <MetricCard label="Total Active Cases" value={stats.total_active ?? 0} icon="assignment" />
      </div>

      {/* Recent dockets */}
      {data?.recent_dockets && data.recent_dockets.length > 0 ? (
        <>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0B1C30', marginBottom: 12 }}>Recent Dockets</h3>
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8F9FF', borderBottom: '1px solid #E2E8F0' }}>
                  {['Tracking ID', 'Title', 'Category', 'Status', 'Filed'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#44474D' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.recent_dockets.map((c: any, i: number) => (
                  <tr key={c.id} style={{ borderBottom: i < data.recent_dockets.length - 1 ? '1px solid #E2E8F0' : 'none' }}>
                    <td style={{ padding: '12px 16px' }}><span style={{ fontFamily: 'monospace', fontSize: 12, color: '#3755C3' }}>{c.tracking_id}</span></td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#0B1C30', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#44474D' }}>{c.category}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: '#EFF4FF', color: '#3755C3' }}>{c.status?.replace(/_/g, ' ')}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#75777E' }}>{fmtDate(c.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div style={{ padding: 32, textAlign: 'center', color: '#75777E', background: '#fff', borderRadius: 8, border: '1px solid #E2E8F0' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40 }}>check_circle</span>
          <div style={{ marginTop: 8, fontWeight: 500 }}>No data available</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Operational data will appear here as complaints are processed</div>
        </div>
      )}

      {/* Research note */}
      <div style={{ marginTop: 24, padding: '14px 18px', background: '#EFF4FF', borderRadius: 8, borderLeft: '3px solid #3755C3' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#3755C3', marginBottom: 4 }}>Research Prototype Note</div>
        <div style={{ fontSize: 12, color: '#44474D', lineHeight: 1.5 }}>
          GrievanceGrid is a research platform. All statistics shown are from live development data.
          Do not present these as official government performance metrics.
          Production deployment requires formal government approval and integration.
        </div>
      </div>
    </div>
  );
}

function AuthorityComplaintsTab() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const STATUSES = ['ALL', 'SUBMITTED', 'IN_PROGRESS', 'AWAITING_VERIFICATION', 'RESOLVED', 'APPEALED'];

  useEffect(() => {
    const params: Record<string, string> = {};
    if (statusFilter !== 'ALL') params.status = statusFilter;
    api.getComplaints(params)
      .then(d => { setComplaints(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [statusFilter]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#75777E' }}>Loading…</div>;
  if (error) return <div style={{ padding: 24, background: '#FFDAD6', borderRadius: 8, color: '#93000A' }}>{error}</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0B1C30' }}>All Complaints (Read-Only)</h2>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setLoading(true); }} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}>
          {STATUSES.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {complaints.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#75777E', background: '#fff', borderRadius: 8, border: '1px solid #E2E8F0' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40 }}>inbox</span>
          <div style={{ marginTop: 8 }}>No complaints found</div>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8F9FF', borderBottom: '1px solid #E2E8F0' }}>
                {['Tracking ID', 'Title', 'Category', 'Priority', 'Status', 'Filed'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#44474D' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {complaints.map((c: any, i: number) => (
                <tr key={c.id} style={{ borderBottom: i < complaints.length - 1 ? '1px solid #E2E8F0' : 'none' }}>
                  <td style={{ padding: '12px 16px' }}><span style={{ fontFamily: 'monospace', fontSize: 12, color: '#3755C3' }}>{c.tracking_id}</span></td>
                  <td style={{ padding: '12px 16px', fontSize: 13, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#44474D' }}>{c.category}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: c.priority === 'HIGH' ? '#FFE8D9' : '#EFF4FF', color: c.priority === 'HIGH' ? '#C84B00' : '#3755C3' }}>{c.priority}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: '#EFF4FF', color: '#3755C3' }}>{c.status?.replace(/_/g, ' ')}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#75777E' }}>{fmtDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AuthorityNotificationsTab() {
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getNotifications()
      .then(d => { setNotifs(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0B1C30', marginBottom: 20 }}>Notifications</h2>
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#75777E' }}>Loading…</div>
      ) : notifs.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#75777E', background: '#fff', borderRadius: 8, border: '1px solid #E2E8F0' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40 }}>notifications_none</span>
          <div style={{ marginTop: 8, fontWeight: 500 }}>No notifications</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {notifs.map((n: any) => (
            <div key={n.id} style={{ padding: '14px 20px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, marginBottom: 4 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#0B1C30' }}>{n.title}</div>
              <div style={{ fontSize: 13, color: '#44474D', marginTop: 4 }}>{n.message}</div>
              <div style={{ fontSize: 11, color: '#75777E', marginTop: 6 }}>{fmtDate(n.created_at)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AuthorityProfileTab() {
  const { user, logout } = useAuth();
  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0B1C30', marginBottom: 24 }}>Authority Profile</h2>
      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: 24, maxWidth: 480 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#0B1C30', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700 }}>
            {user?.name?.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#0B1C30' }}>{user?.name}</div>
            <div style={{ fontSize: 13, color: '#3755C3', fontWeight: 500 }}>Senior Authority</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { icon: 'email', label: 'Email', value: user?.email },
            { icon: 'phone', label: 'Phone', value: user?.phone || '—' },
            { icon: 'badge', label: 'Role', value: 'Senior Authority / Commissioner' },
          ].map(row => (
            <div key={row.icon} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#75777E', width: 24 }}>{row.icon}</span>
              <div>
                <div style={{ fontSize: 11, color: '#75777E' }}>{row.label}</div>
                <div style={{ fontSize: 14, color: '#0B1C30', fontWeight: 500 }}>{row.value}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #E2E8F0' }}>
          <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 6, background: '#FFDAD6', color: '#BA1A1A', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export function AuthorityDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AuthorityTab>('OVERVIEW');

  const navItems: { id: AuthorityTab; label: string; icon: string }[] = [
    { id: 'OVERVIEW', label: 'Overview', icon: 'analytics' },
    { id: 'COMPLAINTS', label: 'All Complaints', icon: 'assignment' },
    { id: 'NOTIFICATIONS', label: 'Notifications', icon: 'notifications' },
    { id: 'PROFILE', label: 'Profile', icon: 'person' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8F9FF', fontFamily: 'Inter, sans-serif' }}>
      {/* Sidebar */}
      <aside style={{ width: 240, background: '#0B1C30', color: '#fff', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100 }}>
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #1a2840' }}>
          <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#7886A3', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>GrievanceGrid</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Authority Portal</div>
          <div style={{ fontSize: 11, color: '#7886A3', marginTop: 2 }}>Governance & Oversight</div>
        </div>
        <nav style={{ flex: 1, padding: '12px 12px' }}>
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => setActiveTab(item.id)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 6, marginBottom: 2,
                background: isActive ? '#1a2840' : 'transparent',
                color: isActive ? '#fff' : '#7886A3',
                border: 'none', cursor: 'pointer', textAlign: 'left',
                fontSize: 14, fontWeight: isActive ? 600 : 400,
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>
        <div style={{ padding: '16px 16px', borderTop: '1px solid #1a2840' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#3755C3', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
              {user?.name?.slice(0, 1).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: '#7886A3' }}>Senior Authority</div>
            </div>
          </div>
          <button onClick={logout} style={{ width: '100%', marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', borderRadius: 5, background: 'transparent', color: '#7886A3', border: '1px solid #1a2840', cursor: 'pointer', fontSize: 12 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>logout</span>
            Sign Out
          </button>
        </div>
      </aside>
      <main style={{ marginLeft: 240, flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
        {activeTab === 'OVERVIEW' && <AuthorityOverviewTab />}
        {activeTab === 'COMPLAINTS' && <AuthorityComplaintsTab />}
        {activeTab === 'NOTIFICATIONS' && <AuthorityNotificationsTab />}
        {activeTab === 'PROFILE' && <AuthorityProfileTab />}
      </main>
    </div>
  );
}
