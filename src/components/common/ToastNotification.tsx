import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { useCRMData } from '../../context/CRMDataContext';

export interface IToastItem {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
}

interface IToastNotificationProps {
  toasts: IToastItem[];
  onDismiss: (id: string) => void;
}

interface ISingleToastProps {
  toast: IToastItem;
  onDismiss: (id: string) => void;
}

const SingleToast: React.FC<ISingleToastProps> = ({ toast, onDismiss }) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const { appearance } = useCRMData();
  const isDark = appearance.theme === 'dark';

  useEffect(() => {
    // Kích hoạt hiệu ứng xuất hiện chuyển từ từ mờ sang rõ
    const appearTimer = setTimeout(() => {
      setIsVisible(true);
    }, 20);
    return () => clearTimeout(appearTimer);
  }, []);

  const handleClose = () => {
    // Hiệu ứng mờ dần chuyển từ rõ sang mờ rồi mới xóa
    setIsVisible(false);
    setTimeout(() => {
      onDismiss(toast.id);
    }, 320);
  };

  const isSuccess = toast.type === 'success';
  const isWarning = toast.type === 'warning';
  const isError = toast.type === 'error';

  const borderColor = isDark
    ? isSuccess
      ? '#059669'
      : isWarning
      ? '#d97706'
      : isError
      ? '#dc2626'
      : '#2563eb'
    : isSuccess
    ? '#86efac'
    : isWarning
    ? '#fde68a'
    : isError
    ? '#fca5a5'
    : '#93c5fd';

  const bgColor = isDark
    ? isSuccess
      ? '#064e3b'
      : isWarning
      ? '#451a03'
      : isError
      ? '#450a0a'
      : '#172554'
    : isSuccess
    ? '#f0fdf4'
    : isWarning
    ? '#fffbeb'
    : isError
    ? '#fef2f2'
    : '#eff6ff';

  const textColor = isDark
    ? isSuccess
      ? '#a7f3d0'
      : isWarning
      ? '#fde68a'
      : isError
      ? '#fecaca'
      : '#bfdbfe'
    : isSuccess
    ? '#15803d'
    : isWarning
    ? '#92400e'
    : isError
    ? '#b91c1c'
    : '#1d4ed8';

  return (
    <div
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
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
        color: textColor,
        fontSize: '0.84rem',
        fontWeight: 500,
        boxSizing: 'border-box',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.96)',
        transition: 'opacity 0.32s cubic-bezier(0.16, 1, 0.3, 1), transform 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
        {isSuccess && <CheckCircle2 size={18} color={isDark ? '#34d399' : '#16a34a'} style={{ flexShrink: 0 }} />}
        {isWarning && <AlertTriangle size={18} color={isDark ? '#fbbf24' : '#d97706'} style={{ flexShrink: 0 }} />}
        {isError && <AlertCircle size={18} color={isDark ? '#f87171' : '#dc2626'} style={{ flexShrink: 0 }} />}
        {!isSuccess && !isWarning && !isError && (
          <Info size={18} color={isDark ? '#60a5fa' : '#2563eb'} style={{ flexShrink: 0 }} />
        )}
        <span style={{ lineHeight: 1.45 }}>{toast.message}</span>
      </div>

      <button
        type="button"
        onClick={handleClose}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'currentColor',
          padding: '2px',
          opacity: 0.65,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'opacity 0.15s ease',
        }}
        title="Đóng thông báo"
      >
        <X size={15} />
      </button>
    </div>
  );
};

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
      {toasts.map((toast) => (
        <SingleToast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};
