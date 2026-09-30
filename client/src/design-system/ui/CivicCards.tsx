import React from 'react';
import { Complaint, WorkOrder } from '../../types';
import { StatusChip, PriorityChip } from './ChipsAndBadges';
import { 
  MapPin, 
  Calendar, 
  ArrowRight, 
  Paperclip, 
  Building, 
  User, 
  Clock, 
  Camera, 
  AlertTriangle,
  FileCheck
} from 'lucide-react';

export interface ComplaintCardProps {
  complaint: Complaint;
  onClick?: () => void;
  showDetailsArrow?: boolean;
  className?: string;
}

export const ComplaintCard: React.FC<ComplaintCardProps> = ({
  complaint,
  onClick,
  showDetailsArrow = true,
  className = ''
}) => {
  return (
    <div
      className={`civic-card complaint-card ${onClick ? 'card-interactive' : ''} ${className}`.trim()}
      onClick={onClick}
    >
      <div className="civic-card-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <span className="complaint-tracking-id" style={{ fontWeight: 800, color: 'var(--civic-primary-action)', fontFamily: 'var(--font-headline)', fontSize: '0.95rem' }}>
              {complaint.tracking_id}
            </span>
            <StatusChip status={complaint.status} size="sm" />
            <PriorityChip priority={complaint.priority} size="sm" />
          </div>
          <h3 className="complaint-card-title" style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--civic-text-primary)' }}>
            {complaint.title}
          </h3>
        </div>
        {showDetailsArrow && (
          <div className="card-action-indicator" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--civic-primary-action)', fontSize: '0.82rem', fontWeight: 600, flexShrink: 0 }}>
            <span>Details</span>
            <ArrowRight size={14} />
          </div>
        )}
      </div>

      <p className="complaint-card-description" style={{ fontSize: '0.86rem', color: 'var(--civic-text-secondary)', marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.45 }}>
        {complaint.description}
      </p>

      <div className="complaint-card-meta" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.78rem', color: 'var(--civic-text-muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <MapPin size={13} color="var(--civic-primary-action)" /> {complaint.location}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Calendar size={13} /> {new Date(complaint.created_at).toLocaleDateString()}
        </span>
        {complaint.department_name && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--civic-text-primary)', fontWeight: 600 }}>
            <Building size={13} /> {complaint.department_name}
          </span>
        )}
        {Boolean(complaint.attachments_count) && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Paperclip size={13} /> {complaint.attachments_count} file(s)
          </span>
        )}
      </div>
    </div>
  );
};

export interface WorkOrderCardProps {
  workOrder: WorkOrder;
  onClick?: () => void;
  showDetailsArrow?: boolean;
  className?: string;
}

export const WorkOrderCard: React.FC<WorkOrderCardProps> = ({
  workOrder,
  onClick,
  showDetailsArrow = true,
  className = ''
}) => {
  const isOverdue = workOrder.deadline && new Date(workOrder.deadline) < new Date() && workOrder.status !== 'VERIFIED' && workOrder.status !== 'COMPLETED';

  return (
    <div
      className={`civic-card work-order-card ${onClick ? 'card-interactive' : ''} ${className}`.trim()}
      onClick={onClick}
    >
      <div className="civic-card-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, color: 'var(--civic-primary-action)', fontFamily: 'var(--font-headline)', fontSize: '0.95rem' }}>
              {workOrder.order_number}
            </span>
            <StatusChip status={workOrder.status} size="sm" />
            <PriorityChip priority={workOrder.priority} size="sm" />
            {isOverdue && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius-pill)' }}>
                <AlertTriangle size={11} /> OVERDUE
              </span>
            )}
          </div>
          <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--civic-text-primary)' }}>
            {workOrder.complaint_title || `Order for ${workOrder.complaint_tracking_id}`}
          </h3>
        </div>
        {showDetailsArrow && (
          <div className="card-action-indicator" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--civic-primary-action)', fontSize: '0.82rem', fontWeight: 600, flexShrink: 0 }}>
            <span>Manage</span>
            <ArrowRight size={14} />
          </div>
        )}
      </div>

      {workOrder.instructions && (
        <p style={{ fontSize: '0.86rem', color: 'var(--civic-text-secondary)', marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.45 }}>
          {workOrder.instructions}
        </p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '0.78rem', color: 'var(--civic-text-muted)' }}>
        {workOrder.location && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={13} color="var(--civic-primary-action)" /> {workOrder.location}
          </span>
        )}
        {workOrder.department_name && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--civic-text-primary)', fontWeight: 600 }}>
            <Building size={13} /> {workOrder.department_name}
          </span>
        )}
        {workOrder.assigned_worker_name && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <User size={13} /> {workOrder.assigned_worker_name}
          </span>
        )}
        {workOrder.deadline && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isOverdue ? '#be123c' : 'inherit', fontWeight: isOverdue ? 700 : 400 }}>
            <Clock size={13} /> Due: {new Date(workOrder.deadline).toLocaleDateString()}
          </span>
        )}
        {Boolean(workOrder.evidence_count) && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#0f766e', fontWeight: 600 }}>
            <Camera size={13} /> {workOrder.evidence_count} proof photo(s)
          </span>
        )}
      </div>
    </div>
  );
};
