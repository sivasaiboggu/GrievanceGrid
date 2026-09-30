import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string | number;
  children: React.ReactNode;
  className?: string;
  closeOnBackdropClick?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  headerAction,
  footer,
  maxWidth = '640px',
  children,
  className = '',
  closeOnBackdropClick = true
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={() => {
        if (closeOnBackdropClick) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`modal-sheet ${className}`.trim()}
        style={{ maxWidth }}
        onClick={e => e.stopPropagation()}
      >
        {(title || icon || headerAction) && (
          <div className="modal-header">
            <div className="modal-header-titles" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {icon && <span className="modal-icon">{icon}</span>}
              <div>
                {typeof title === 'string' ? (
                  <h3 className="modal-title">{title}</h3>
                ) : (
                  title
                )}
                {subtitle && <p className="modal-subtitle">{subtitle}</p>}
              </div>
            </div>
            <div className="modal-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {headerAction}
              <button
                type="button"
                className="modal-close-btn"
                onClick={onClose}
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        )}

        <div className="modal-body">{children}</div>

        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  headerAction,
  footer,
  children,
  className = ''
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="bottom-sheet-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className={`bottom-sheet-panel ${className}`.trim()} onClick={e => e.stopPropagation()}>
        <div className="bottom-sheet-handle-bar" onClick={onClose}>
          <div className="bottom-sheet-handle" />
        </div>

        {title && (
          <div className="bottom-sheet-header">
            <div>
              {typeof title === 'string' ? <h3 className="modal-title">{title}</h3> : title}
              {subtitle && <p className="modal-subtitle">{subtitle}</p>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {headerAction}
              <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close sheet">
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        <div className="bottom-sheet-body">{children}</div>

        {footer && <div className="bottom-sheet-footer">{footer}</div>}
      </div>
    </div>
  );
};
