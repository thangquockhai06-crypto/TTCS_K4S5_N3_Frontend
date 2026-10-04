import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useCRMData } from '../../context/CRMDataContext';

interface IConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<IConfirmModalProps> = ({
  isOpen,
  title = 'Xác nhận thao tác',
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy bỏ',
  isDanger = true,
  onConfirm,
  onCancel,
}) => {
  const { appearance } = useCRMData();
  const isDark = appearance.theme === 'dark';

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(15, 23, 42, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '16px',
        animation: 'fadeIn 0.15s ease-out',
      }}
    >
      <div
        style={{
          backgroundColor: isDark ? '#111827' : '#ffffff',
          borderRadius: '10px',
          border: isDark ? '1px solid #1e293b' : 'none',
          width: '100%',
          maxWidth: '440px',
          padding: '24px',
          boxShadow: isDark
            ? '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)'
            : '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxSizing: 'border-box',
          animation: 'scaleUp 0.15s ease-out',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: isDanger
                  ? isDark
                    ? 'rgba(239, 68, 68, 0.2)'
                    : '#fee2e2'
                  : isDark
                  ? 'rgba(37, 99, 235, 0.2)'
                  : '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={22} color={isDanger ? (isDark ? '#f87171' : '#dc2626') : (isDark ? '#60a5fa' : '#2563eb')} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a' }}>{title}</h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              color: isDark ? '#94a3b8' : '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              display: 'inline-flex',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ margin: 0, fontSize: '0.86rem', color: isDark ? '#cbd5e1' : '#475569', lineHeight: 1.5 }}>{message}</p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              height: '38px',
              padding: '0 16px',
              borderRadius: '6px',
              border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
              backgroundColor: isDark ? '#1e293b' : '#ffffff',
              color: isDark ? '#cbd5e1' : '#334155',
              fontSize: '0.82rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            style={{
              height: '38px',
              padding: '0 18px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: isDanger ? '#dc2626' : '#2563eb',
              color: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
