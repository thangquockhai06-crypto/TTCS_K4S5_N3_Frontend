import React from 'react';
import { ICustomField } from '../../interfaces';
import { CustomSelect, ICustomSelectOption } from '../common/CustomSelect';
import { useCRMData } from '../../context/CRMDataContext';

export interface ICustomFieldRendererProps {
  fields: ICustomField[];
  values: Record<string, string | number>;
  onChange: (fieldName: string, value: string | number) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  layout?: 'grid' | 'stack';
}

export const CustomFieldRenderer: React.FC<ICustomFieldRendererProps> = ({
  fields,
  values,
  onChange,
  errors = {},
  disabled = false,
  layout = 'grid',
}) => {
  const { appearance } = useCRMData();
  const isDark = appearance.theme === 'dark';

  if (!fields || fields.length === 0) {
    return (
      <div
        style={{
          padding: '16px',
          textAlign: 'center',
          color: isDark ? '#94a3b8' : '#64748b',
          fontSize: '0.84rem',
          backgroundColor: isDark ? 'rgba(30, 41, 59, 0.4)' : '#f8fafc',
          borderRadius: '6px',
          border: `1px dashed ${isDark ? '#334155' : '#cbd5e1'}`,
        }}
      >
        Chưa có trường tùy biến nào được cấu hình cho phân hệ này.
      </div>
    );
  }

  const containerStyle: React.CSSProperties =
    layout === 'grid'
      ? {
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '14px',
        }
      : {
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        };

  const inputBaseStyle: React.CSSProperties = {
    width: '100%',
    height: '38px',
    padding: '0 12px',
    borderRadius: '6px',
    border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
    backgroundColor: disabled
      ? isDark
        ? '#1e293b'
        : '#f1f5f9'
      : isDark
      ? '#111827'
      : '#ffffff',
    color: isDark ? '#f8fafc' : '#0f172a',
    fontSize: '0.84rem',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  };

  return (
    <div style={containerStyle}>
      {fields.map((field) => {
        const val = values[field.field_name] ?? (field.default_value ?? '');
        const error = errors[field.field_name];

        const selectOptions: ICustomSelectOption[] = (field.options || '')
          .split(',')
          .map((opt) => opt.trim())
          .filter(Boolean)
          .map((opt) => ({ value: opt, label: opt }));

        return (
          <div
            key={field.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '5px',
            }}
          >
            {/* Field Label */}
            <label
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: isDark ? '#cbd5e1' : '#334155',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>{field.field_label}</span>
              {field.is_required && (
                <span
                  style={{ color: isDark ? '#f87171' : '#dc2626', fontWeight: 700 }}
                  title="Bắt buộc nhập"
                >
                  *
                </span>
              )}
            </label>

            {/* Input by field_type */}
            {field.field_type === 'text' && (
              <input
                type="text"
                disabled={disabled}
                placeholder={`Nhập ${field.field_label.toLowerCase()}...`}
                value={String(val)}
                onChange={(e) => onChange(field.field_name, e.target.value)}
                style={{
                  ...inputBaseStyle,
                  borderColor: error ? (isDark ? '#f87171' : '#dc2626') : inputBaseStyle.borderColor,
                }}
              />
            )}

            {field.field_type === 'number' && (
              <input
                type="number"
                disabled={disabled}
                placeholder="0"
                value={val === '' ? '' : Number(val)}
                onChange={(e) => onChange(field.field_name, e.target.value === '' ? '' : Number(e.target.value))}
                style={{
                  ...inputBaseStyle,
                  borderColor: error ? (isDark ? '#f87171' : '#dc2626') : inputBaseStyle.borderColor,
                }}
              />
            )}

            {field.field_type === 'date' && (
              <input
                type="date"
                disabled={disabled}
                value={String(val)}
                onChange={(e) => onChange(field.field_name, e.target.value)}
                style={{
                  ...inputBaseStyle,
                  borderColor: error ? (isDark ? '#f87171' : '#dc2626') : inputBaseStyle.borderColor,
                  colorScheme: isDark ? 'dark' : 'light',
                }}
              />
            )}

            {field.field_type === 'select' && (
              <CustomSelect
                disabled={disabled}
                value={String(val)}
                placeholder={`-- Chọn ${field.field_label.toLowerCase()} --`}
                options={selectOptions}
                onChange={(selectedVal) => onChange(field.field_name, selectedVal)}
                height="38px"
              />
            )}

            {/* Error message */}
            {error && (
              <span
                style={{
                  fontSize: '0.74rem',
                  color: isDark ? '#f87171' : '#dc2626',
                  fontWeight: 500,
                  marginTop: '1px',
                }}
              >
                {error}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
