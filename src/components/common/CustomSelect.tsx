import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useCRMData } from '../../context/CRMDataContext';
import inputStyles from './Input.module.css';

export interface ICustomSelectOption<T extends string = string> {
  value: T;
  label: string;
}

export interface ICustomSelectProps<T extends string = string> {
  label?: string;
  value: T;
  onChange: (val: T) => void;
  options: ICustomSelectOption<T>[];
  placeholder?: string;
  width?: string;
  height?: string;
  disabled?: boolean;
  error?: boolean;
  className?: string;
}

export function CustomSelect<T extends string = string>({
  label,
  value,
  onChange,
  options,
  placeholder = 'Chọn một mục...',
  width = '100%',
  height = '47px',
  disabled = false,
  error = false,
  className = '',
}: ICustomSelectProps<T>): React.ReactElement {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { appearance } = useCRMData();
  const isDark = appearance.theme === 'dark';

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className={`${inputStyles.field} ${className}`}
      style={{
        position: 'relative',
        width,
        userSelect: 'none',
      }}
    >
      {label && (
        <label className={inputStyles.field__label}>
          {label}
        </label>
      )}

      <div style={{ position: 'relative', width: '100%' }}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          className={`${inputStyles.field__control} ${
            isOpen ? inputStyles['field--focused'] : ''
          } ${error ? inputStyles['field--error'] : ''} ${
            disabled ? inputStyles['field--disabled'] : ''
          }`}
          style={{
            width: '100%',
            height,
            padding: '0 14px',
            borderRadius: 'var(--radius-md)',
            border: isOpen
              ? '1.5px solid var(--color-primary, #2563EB)'
              : error
              ? '1.5px solid var(--color-danger, #EF4444)'
              : '1.5px solid var(--color-border)',
            boxShadow: isOpen
              ? '0 0 0 4px var(--color-focus-ring, rgba(37, 99, 235, 0.28))'
              : error
              ? '0 0 0 3px var(--color-danger-soft, rgba(239, 68, 68, 0.2))'
              : 'none',
            backgroundColor: disabled
              ? 'var(--color-bg-subtle)'
              : 'var(--color-bg-surface)',
            color: selectedOption
              ? 'var(--color-text-primary)'
              : 'var(--color-text-muted)',
            fontSize: '0.9rem',
            fontWeight: 400,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: disabled ? 'not-allowed' : 'pointer',
            outline: 'none',
            boxSizing: 'border-box',
            textAlign: 'left',
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            size={16}
            style={{
              marginLeft: '8px',
              flexShrink: 0,
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.18s ease',
              color: 'var(--color-text-muted)',
            }}
          />
        </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            width: '100%',
            minWidth: '160px',
            maxHeight: '240px',
            overflowY: 'auto',
            backgroundColor: isDark ? '#1f293d' : '#ffffff',
            borderRadius: '8px',
            border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
            boxShadow: isDark
              ? '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)'
              : '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.06)',
            zIndex: 10000,
            padding: '4px',
            boxSizing: 'border-box',
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontWeight: isSelected ? 600 : 400,
                  color: isSelected
                    ? isDark
                      ? '#60a5fa'
                      : '#1d4ed8'
                    : isDark
                    ? '#cbd5e1'
                    : '#334155',
                  backgroundColor: isSelected
                    ? isDark
                      ? 'rgba(37, 99, 235, 0.25)'
                      : '#eff6ff'
                    : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'background-color 0.12s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = isDark ? '#334155' : '#f8fafc';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span>{opt.label}</span>
                {isSelected && <Check size={14} color={isDark ? '#60a5fa' : '#2563eb'} style={{ flexShrink: 0 }} />}
              </div>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}
