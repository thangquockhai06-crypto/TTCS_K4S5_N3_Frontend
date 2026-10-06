import React, { useId, useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import styles from './Input.module.css';

export interface IInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  floatingLabel?: boolean;
  error?: string;
  isValid?: boolean;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input: React.FC<IInputProps> = ({
  label,
  floatingLabel = false,
  error,
  isValid = false,
  helperText,
  leftIcon,
  rightElement,
  value,
  onFocus,
  onBlur,
  disabled,
  className = '',
  id,
  ...rest
}) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  const [isFocused, setIsFocused] = useState<boolean>(false);

  const hasValue =
    value !== undefined && value !== null && String(value).trim().length > 0;

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>): void => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>): void => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  const containerClass = [
    styles.field,
    floatingLabel ? styles['field--floating'] : '',
    isFocused ? styles['field--focused'] : '',
    hasValue ? styles['field--filled'] : '',
    error ? styles['field--error'] : '',
    isValid && !error ? styles['field--valid'] : '',
    disabled ? styles['field--disabled'] : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClass}>
      {!floatingLabel && (
        <label htmlFor={inputId} className={styles.field__label}>
          {label}
        </label>
      )}
      <div className={styles.field__control}>
        {leftIcon && (
          <span className={styles.field__iconLeft} aria-hidden="true">
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          value={value}
          disabled={disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={`${styles.field__input} ${
            leftIcon ? styles['field__input--withLeft'] : ''
          }`}
          placeholder={floatingLabel ? ' ' : rest.placeholder}
          {...rest}
        />
        {floatingLabel && (
          <label
            htmlFor={inputId}
            className={`${styles.field__floatingLabel} ${
              leftIcon ? styles['field__floatingLabel--withLeft'] : ''
            }`}
          >
            {label}
          </label>
        )}
        <div className={styles.field__rightSlot}>
          {rightElement}
          {!rightElement && error && (
            <AlertCircle size={16} className={styles.field__statusError} aria-hidden="true" />
          )}
          {!rightElement && !error && isValid && (
            <CheckCircle2 size={16} className={styles.field__statusValid} aria-hidden="true" />
          )}
        </div>
      </div>
      {error && (
        <p id={errorId} className={styles.field__errorText} role="alert">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={helperId} className={styles.field__helperText}>
          {helperText}
        </p>
      )}
    </div>
  );
};
