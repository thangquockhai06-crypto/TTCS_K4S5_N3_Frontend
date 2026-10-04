import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export interface IToastItem {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
}

interface IToastNotificationProps {
  toasts: IToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastNotification: React.FC<IToastNotificationProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '420px',
        width: 'calc(100% - 48px)',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isWarning = toast.type === 'warning';
        const isError = toast.type === 'error';

        const borderColor = isSuccess
          ? '#86efac'
          : isWarning
          ? '#fde68a'
          : isError
          ? '#fca5a5'
          : '#93c5fd';

        const bgColor = isSuccess
          ? '#f0fdf4'
          : isWarning
          ? '#fffbeb'
          : isError
          ? '#fef2f2'
          : '#eff6ff';

        const textColor = isSuccess
          ? '#15803d'
          : isWarning
          ? '#92400e'
          : isError
          ? '#b91c1c'
          : '#1d4ed8';

        return (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: bgColor,
              border: `1px solid ${borderColor}`,
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
              color: textColor,
              fontSize: '0.84rem',
              fontWeight: 500,
              boxSizing: 'border-box',
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
              {isSuccess && <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0 }} />}
              {isWarning && <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0 }} />}
              {isError && <AlertCircle size={18} color="#dc2626" style={{ flexShrink: 0 }} />}
              {!isSuccess && !isWarning && !isError && (
                <Info size={18} color="#2563eb" style={{ flexShrink: 0 }} />
              )}
              <span style={{ lineHeight: 1.4 }}>{toast.message}</span>
            </div>

            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'currentColor',
                padding: '2px',
                opacity: 0.7,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              title="Đóng thông báo"
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
