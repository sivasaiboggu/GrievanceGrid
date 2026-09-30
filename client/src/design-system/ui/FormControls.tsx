import React from 'react';
import { Search, X } from 'lucide-react';

export interface FormGroupProps {
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormGroup: React.FC<FormGroupProps> = ({
  label,
  required = false,
  hint,
  error,
  children,
  className = ''
}) => {
  return (
    <div className={`form-group ${className}`.trim()}>
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="required" title="Required field">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <div className="form-hint">{hint}</div>}
      {error && <div className="form-error">{error}</div>}
    </div>
  );
};

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ error, leftIcon, rightIcon, className = '', style, ...props }, ref) => {
    if (leftIcon || rightIcon) {
      return (
        <div className="input-icon-wrapper" style={{ position: 'relative', width: '100%' }}>
          {leftIcon && <span className="input-left-icon">{leftIcon}</span>}
          <input
            ref={ref}
            className={`form-control ${error ? 'is-invalid' : ''} ${leftIcon ? 'has-left-icon' : ''} ${rightIcon ? 'has-right-icon' : ''} ${className}`.trim()}
            style={style}
            {...props}
          />
          {rightIcon && <span className="input-right-icon">{rightIcon}</span>}
        </div>
      );
    }

    return (
      <input
        ref={ref}
        className={`form-control ${error ? 'is-invalid' : ''} ${className}`.trim()}
        style={style}
        {...props}
      />
    );
  }
);
TextInput.displayName = 'TextInput';

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ error, className = '', ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`form-control ${error ? 'is-invalid' : ''} ${className}`.trim()}
        {...props}
      />
    );
  }
);
TextArea.displayName = 'TextArea';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: SelectOption[];
  error?: boolean;
  placeholderOption?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, error, placeholderOption, children, className = '', ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`form-control ${error ? 'is-invalid' : ''} ${className}`.trim()}
        {...props}
      >
        {placeholderOption && <option value="">{placeholderOption}</option>}
        {options
          ? options.map(opt => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
    );
  }
);
Select.displayName = 'Select';

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onClear?: () => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onClear,
  placeholder = 'Search records...',
  className = '',
  ...props
}) => {
  const hasValue = Boolean(value);

  return (
    <div className={`search-input-container ${className}`.trim()}>
      <Search size={16} className="search-icon" />
      <input
        type="text"
        className="form-control search-input"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        {...props}
      />
      {hasValue && onClear && (
        <button
          type="button"
          className="search-clear-btn"
          onClick={onClear}
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};
