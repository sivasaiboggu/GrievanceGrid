import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'bordered' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  interactive = false,
  className = '',
  style,
  ...props
}) => {
  const variantClass = variant !== 'default' ? `card-${variant}` : '';
  const paddingClass = `card-p-${padding}`;
  const interactiveClass = interactive ? 'card-interactive' : '';

  return (
    <div
      className={`civic-card ${variantClass} ${paddingClass} ${interactiveClass} ${className}`.trim()}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
};

export interface CardHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  divider?: boolean;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  action,
  divider = true,
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`civic-card-header ${!divider ? 'no-divider' : ''} ${className}`.trim()} {...props}>
      {(title || subtitle) ? (
        <div className="card-header-titles">
          {title && typeof title === 'string' ? <h3 className="card-title">{title}</h3> : title}
          {subtitle && typeof subtitle === 'string' ? <p className="card-subtitle">{subtitle}</p> : subtitle}
        </div>
      ) : null}
      {children}
      {action && <div className="card-header-action">{action}</div>}
    </div>
  );
};

export const CardBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`civic-card-body ${className}`.trim()} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`civic-card-footer ${className}`.trim()} {...props}>
      {children}
    </div>
  );
};

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accentColor?: string;
  iconBg?: string;
  iconColor?: string;
  subtext?: string;
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  accentColor,
  iconBg = '#eff6ff',
  iconColor = '#1d4ed8',
  subtext,
  onClick,
  className = ''
}) => {
  const cardStyle: React.CSSProperties = {
    ...(accentColor ? { borderLeft: `4px solid ${accentColor}` } : {}),
    ...(onClick ? { cursor: 'pointer' } : {})
  };

  return (
    <div
      className={`stat-card ${onClick ? 'stat-card-clickable' : ''} ${className}`.trim()}
      style={cardStyle}
      onClick={onClick}
    >
      <div className="stat-icon" style={{ backgroundColor: iconBg, color: iconColor }}>
        {icon}
      </div>
      <div className="stat-info">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
        {subtext && <span className="stat-subtext">{subtext}</span>}
      </div>
    </div>
  );
};
