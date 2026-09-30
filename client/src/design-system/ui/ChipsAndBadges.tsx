import React from 'react';
import { ComplaintStatus, WorkOrderStatus, Priority } from '../../types';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileText, 
  UserCheck, 
  ShieldAlert, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export interface StatusChipProps {
  status: ComplaintStatus | WorkOrderStatus | string;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({ 
  status, 
  size = 'md',
  className = '' 
}) => {
  const getIcon = () => {
    switch (status) {
      case 'SUBMITTED':
      case 'PENDING':
        return <Clock size={size === 'sm' ? 10 : 12} />;
      case 'ASSIGNED':
        return <UserCheck size={size === 'sm' ? 10 : 12} />;
      case 'IN_PROGRESS':
        return <Clock size={size === 'sm' ? 10 : 12} />;
      case 'AWAITING_VERIFICATION':
        return <FileText size={size === 'sm' ? 10 : 12} />;
      case 'RESOLVED':
      case 'VERIFIED':
      case 'COMPLETED':
        return <CheckCircle2 size={size === 'sm' ? 10 : 12} />;
      case 'OVERDUE':
        return <AlertTriangle size={size === 'sm' ? 10 : 12} />;
      case 'APPEALED':
        return <ShieldAlert size={size === 'sm' ? 10 : 12} />;
      default:
        return <Clock size={size === 'sm' ? 10 : 12} />;
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'SUBMITTED':
        return 'Submitted';
      case 'ASSIGNED':
        return 'Assigned';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'AWAITING_VERIFICATION':
        return 'Awaiting Verification';
      case 'RESOLVED':
        return 'Resolved';
      case 'OVERDUE':
        return 'Overdue';
      case 'APPEALED':
        return 'Appealed';
      case 'PENDING':
        return 'Pending';
      case 'COMPLETED':
        return 'Completed';
      case 'VERIFIED':
        return 'Verified';
      default:
        return status;
    }
  };

  const sizeClass = size === 'sm' ? 'status-pill-sm' : '';

  return (
    <span className={`status-pill status-${status} ${sizeClass} ${className}`.trim()}>
      {getIcon()}
      <span>{getLabel()}</span>
    </span>
  );
};

export interface PriorityChipProps {
  priority: Priority | string;
  size?: 'sm' | 'md';
  className?: string;
}

export const PriorityChip: React.FC<PriorityChipProps> = ({ 
  priority, 
  size = 'md',
  className = '' 
}) => {
  const sizeClass = size === 'sm' ? 'priority-chip-sm' : '';

  return (
    <span className={`priority-chip priority-${priority} ${sizeClass} ${className}`.trim()}>
      {priority}
    </span>
  );
};

export interface BadgeProps {
  variant?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  pill?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  children,
  pill = true,
  className = ''
}) => {
  return (
    <span className={`civic-badge badge-${variant} badge-${size} ${pill ? 'badge-pill' : ''} ${className}`.trim()}>
      {children}
    </span>
  );
};
