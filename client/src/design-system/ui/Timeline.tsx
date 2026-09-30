import React from 'react';
import { StatusHistoryItem } from '../../types';
import { StatusChip } from './ChipsAndBadges';

export interface TimelineProps {
  items: StatusHistoryItem[];
  emptyMessage?: string;
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({
  items,
  emptyMessage = 'No progression history recorded yet.',
  className = ''
}) => {
  if (!items || items.length === 0) {
    return (
      <div className="timeline-empty" style={{ color: 'var(--civic-text-muted)', fontSize: '0.85rem', padding: '1rem 0' }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`timeline-spine ${className}`.trim()}>
      {items.map((item, idx) => {
        const isResolved = item.new_status === 'RESOLVED' || item.new_status === 'VERIFIED' || item.new_status === 'COMPLETED';
        const isWarning = item.new_status === 'APPEALED' || item.new_status === 'OVERDUE';
        const isInProgress = item.new_status === 'IN_PROGRESS' || item.new_status === 'AWAITING_VERIFICATION';
        
        let nodeClass = '';
        if (isResolved) nodeClass = 'success';
        else if (isWarning) nodeClass = 'warning';
        else if (isInProgress) nodeClass = 'progress';

        const dateStr = item.created_at
          ? new Date(item.created_at).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : '';

        return (
          <div key={item.id || idx} className="timeline-item">
            <div className={`timeline-node ${nodeClass}`} />
            <div className="timeline-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <StatusChip status={item.new_status} size="sm" />
                <span className="timeline-actor" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--civic-text-primary)' }}>
                  {item.changed_by_name || 'System Operator'}{' '}
                  {item.changed_by_role && (
                    <span style={{ color: 'var(--civic-text-muted)', fontWeight: 400, fontSize: '0.75rem' }}>
                      ({item.changed_by_role})
                    </span>
                  )}
                </span>
              </div>
              <span className="timeline-timestamp" style={{ fontSize: '0.72rem', color: 'var(--civic-text-muted)' }}>
                {dateStr}
              </span>
            </div>
            {item.notes && (
              <p className="timeline-notes" style={{
                fontSize: '0.84rem',
                color: 'var(--civic-text-secondary)',
                backgroundColor: '#f8fafc',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--civic-border)',
                marginTop: '6px',
                lineHeight: 1.45
              }}>
                {item.notes}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};
