import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  className = ''
}) => {
  const sizePixels = {
    sm: 16,
    md: 24,
    lg: 36,
    xl: 48
  }[size];

  return (
    <div className={`loading-spinner-wrapper ${className}`.trim()} role="status" aria-live="polite">
      <Loader2 className="spinner-icon" size={sizePixels} color="var(--civic-primary-action)" />
      {text && <p className="loading-spinner-text" style={{ marginTop: '10px', fontSize: '0.86rem', color: 'var(--civic-text-muted)' }}>{text}</p>}
    </div>
  );
};

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '16px',
  borderRadius = 'var(--radius-sm)',
  className = '',
  style
}) => {
  return (
    <div
      className={`civic-skeleton ${className}`.trim()}
      style={{
        width,
        height,
        borderRadius,
        ...style
      }}
      aria-hidden="true"
    />
  );
};

export const SkeletonCard: React.FC<{ rows?: number; className?: string }> = ({
  rows = 3,
  className = ''
}) => {
  return (
    <div className={`civic-card skeleton-card ${className}`.trim()} aria-hidden="true">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
        <Skeleton width="30%" height="20px" />
        <Skeleton width="18%" height="20px" borderRadius="var(--radius-pill)" />
      </div>
      <Skeleton width="80%" height="18px" style={{ marginBottom: '10px' }} />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} width={`${90 - i * 15}%`} height="14px" style={{ marginBottom: '8px' }} />
      ))}
      <div style={{ display: 'flex', gap: '12px', marginTop: '14px' }}>
        <Skeleton width="25%" height="14px" />
        <Skeleton width="25%" height="14px" />
      </div>
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number; cols?: number; className?: string }> = ({
  rows = 5,
  cols = 5,
  className = ''
}) => {
  return (
    <div className={`civic-table-wrapper skeleton-table ${className}`.trim()} aria-hidden="true">
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--civic-border)', display: 'flex', gap: '16px' }}>
        {Array.from({ length: cols }).map((_, c) => (
          <Skeleton key={c} width={`${100 / cols}%`} height="14px" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '16px' }}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} width={`${100 / cols}%`} height="16px" />
          ))}
        </div>
      ))}
    </div>
  );
};
