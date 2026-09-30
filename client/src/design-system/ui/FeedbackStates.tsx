import React from 'react';
import { 
  Inbox, 
  AlertCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  RefreshCw,
  XCircle,
  FileQuestion
} from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <Inbox size={36} color="var(--civic-text-muted)" />,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
  className = ''
}) => {
  return (
    <div className={`empty-state-container ${className}`.trim()}>
      <div className="empty-state-icon-bubble">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-description">{description}</p>}
      {actionLabel && onAction && (
        <div style={{ marginTop: '16px' }}>
          <Button variant="primary" size="sm" onClick={onAction} leftIcon={actionIcon}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to Load Records',
  message = 'An unexpected communication error occurred while querying the municipal database.',
  onRetry,
  retryLabel = 'Retry Request',
  className = ''
}) => {
  return (
    <div className={`error-state-container ${className}`.trim()} role="alert">
      <div className="error-state-icon-bubble">
        <XCircle size={36} color="#be123c" />
      </div>
      <h3 className="error-state-title" style={{ color: '#be123c' }}>{title}</h3>
      <p className="error-state-description">{message}</p>
      {onRetry && (
        <div style={{ marginTop: '16px' }}>
          <Button variant="secondary" size="sm" onClick={onRetry} leftIcon={<RefreshCw size={14} />}>
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  icon,
  onClose,
  className = ''
}) => {
  const getDefaultIcon = () => {
    switch (variant) {
      case 'success':
        return <CheckCircle2 size={18} />;
      case 'warning':
        return <AlertTriangle size={18} />;
      case 'danger':
        return <AlertCircle size={18} />;
      case 'info':
      default:
        return <Info size={18} />;
    }
  };

  return (
    <div className={`civic-alert civic-alert-${variant} ${className}`.trim()} role="alert">
      <div className="alert-icon-wrapper">{icon || getDefaultIcon()}</div>
      <div className="alert-content-wrapper" style={{ flex: 1 }}>
        {title && <h5 className="alert-title" style={{ fontWeight: 700, marginBottom: '2px' }}>{title}</h5>}
        <div className="alert-body" style={{ fontSize: '0.86rem', lineHeight: 1.45 }}>{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          className="alert-close-btn"
          onClick={onClose}
          aria-label="Dismiss alert"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', opacity: 0.7 }}
        >
          <XCircle size={16} />
        </button>
      )}
    </div>
  );
};
