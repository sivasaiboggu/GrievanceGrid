import React, { useState, useEffect } from 'react';
import { api } from '../../api';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  entity_id?: string;
}

interface NotificationsScreenProps {
  onSelectComplaint?: (id: string) => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  onSelectComplaint,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'COMPLAINT_SUBMITTED':
        return { icon: 'send', color: 'text-blue-600 bg-blue-50' };
      case 'COMPLAINT_ASSIGNED':
        return { icon: 'assignment_ind', color: 'text-indigo-600 bg-indigo-50' };
      case 'WORK_STARTED':
        return { icon: 'construction', color: 'text-amber-600 bg-amber-50' };
      case 'EVIDENCE_UPLOADED':
        return { icon: 'photo_camera', color: 'text-purple-600 bg-purple-50' };
      case 'VERIFICATION_UPDATE':
        return { icon: 'verified', color: 'text-cyan-600 bg-cyan-50' };
      case 'COMPLAINT_RESOLVED':
        return { icon: 'check_circle', color: 'text-emerald-600 bg-emerald-50' };
      case 'APPEAL_UPDATE':
        return { icon: 'gavel', color: 'text-rose-600 bg-rose-50' };
      default:
        return { icon: 'notifications', color: 'text-[var(--civic-secondary)] bg-[var(--civic-surface-dim)]' };
    }
  };

  return (
    <div className="flex flex-col w-full gap-4 pb-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="text-[20px] font-bold text-[var(--civic-primary)] tracking-tight">
            Municipal Alerts & Notices
          </h2>
          <p className="text-[13px] text-[var(--civic-text-muted)]">
            Real-time updates regarding your filed grievances & SLA milestones
          </p>
        </div>

        {notifications.some((n) => !n.is_read) && (
          <button
            onClick={handleMarkAllRead}
            className="text-[12px] text-[var(--civic-secondary)] hover:underline font-semibold"
          >
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col gap-2.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white rounded-xl border border-[var(--civic-border)] animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-xl p-10 border border-[var(--civic-border)] text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-[var(--civic-surface-dim)] flex items-center justify-center text-[var(--civic-text-muted)] mb-3">
            <span className="material-symbols-outlined text-[26px]">notifications_off</span>
          </div>
          <h3 className="text-[15px] font-semibold text-[var(--civic-primary)]">No Notifications</h3>
          <p className="text-[13px] text-[var(--civic-text-muted)] max-w-xs mt-1">
            You're completely up to date. You will receive real-time notifications as officers triage your reports.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {notifications.map((notif) => {
            const { icon, color } = getNotificationIcon(notif.type);
            return (
              <div
                key={notif.id}
                onClick={() => {
                  if (!notif.is_read) handleMarkRead(notif.id);
                  if (notif.entity_id && onSelectComplaint) {
                    onSelectComplaint(notif.entity_id);
                  }
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 shadow-2xs ${
                  notif.is_read
                    ? 'bg-white border-[var(--civic-border)] hover:bg-gray-50'
                    : 'bg-[var(--civic-surface-dim)] border-[var(--civic-secondary)]/30 hover:bg-[var(--civic-surface-dim)]/80'
                }`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${color}`}>
                  <span className="material-symbols-outlined text-[18px]">{icon}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-[14px] font-semibold text-[var(--civic-primary)] truncate">
                      {notif.title}
                    </h4>
                    <span className="text-[11px] text-[var(--civic-text-muted)] font-mono shrink-0">
                      {new Date(notif.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <p className="text-[13px] text-[var(--civic-text-muted)] mt-0.5 leading-relaxed">
                    {notif.message}
                  </p>
                </div>

                {!notif.is_read && (
                  <span className="w-2 h-2 rounded-full bg-[var(--civic-secondary)] shrink-0 mt-2"></span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
