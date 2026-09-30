import React from 'react';
import { NotificationItem } from '../../types';
import { 
  Bell, 
  UserCheck, 
  FileCheck, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  FileText,
  Clock,
  ArrowRight
} from 'lucide-react';

export interface NotificationItemCardProps {
  notification: NotificationItem;
  onClick?: () => void;
  className?: string;
}

export const NotificationItemCard: React.FC<NotificationItemCardProps> = ({
  notification,
  onClick,
  className = ''
}) => {
  const isUnread = !notification.is_read;

  const getIcon = () => {
    switch (notification.type) {
      case 'ASSIGNMENT':
        return <UserCheck size={16} color="#0369a1" />;
      case 'VERIFICATION':
        return <FileCheck size={16} color="#6d28d9" />;
      case 'DEADLINE':
        return <AlertTriangle size={16} color="#be123c" />;
      case 'RESOLUTION':
        return <CheckCircle2 size={16} color="#15803d" />;
      case 'APPEAL':
        return <ShieldAlert size={16} color="#be185d" />;
      case 'UPDATE':
        return <FileText size={16} color="#1d4ed8" />;
      case 'INFO':
      default:
        return <Bell size={16} color="#0b4f9e" />;
    }
  };

  const getIconBg = () => {
    switch (notification.type) {
      case 'ASSIGNMENT':
        return '#e0f2fe';
      case 'VERIFICATION':
        return '#f5f3ff';
      case 'DEADLINE':
        return '#fff1f2';
      case 'RESOLUTION':
        return '#f0fdf4';
      case 'APPEAL':
        return '#fdf2f8';
      case 'UPDATE':
        return '#eff6ff';
      case 'INFO':
      default:
        return '#eff6ff';
    }
  };

  const timeStr = notification.created_at
    ? new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div
      className={`notification-item-card ${isUnread ? 'is-unread' : 'is-read'} ${onClick ? 'is-clickable' : ''} ${className}`.trim()}
      onClick={onClick}
    >
      <div className="notif-icon-bubble" style={{ backgroundColor: getIconBg() }}>
        {getIcon()}
      </div>

      <div className="notif-content-body" style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '2px' }}>
          <h4 className="notif-title" style={{ fontSize: '0.88rem', fontWeight: isUnread ? 700 : 600, color: isUnread ? '#003877' : 'var(--civic-text-primary)' }}>
            {notification.title}
          </h4>
          <span className="notif-time" style={{ fontSize: '0.7rem', color: 'var(--civic-text-muted)', whiteSpace: 'nowrap' }}>
            {timeStr}
          </span>
        </div>

        <p className="notif-message" style={{ fontSize: '0.82rem', color: 'var(--civic-text-secondary)', lineHeight: 1.45, margin: 0 }}>
          {notification.message}
        </p>

        {notification.entity_id && (
          <div className="notif-action-link" style={{ marginTop: '6px', fontSize: '0.74rem', color: 'var(--civic-primary-action)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span>View Record Details</span>
            <ArrowRight size={12} />
          </div>
        )}
      </div>

      {isUnread && <div className="notif-unread-dot" title="Unread notification" />}
    </div>
  );
};
