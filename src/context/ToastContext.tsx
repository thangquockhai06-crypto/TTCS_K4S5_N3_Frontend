import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface IToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface IToastContext {
  toasts: IToastItem[];
  showToast: (message: string, type?: ToastType, title?: string, duration?: number) => string;
  showSuccess: (message: string, title?: string, duration?: number) => string;
  showError: (message: string, title?: string, duration?: number) => string;
  showWarning: (message: string, title?: string, duration?: number) => string;
  showInfo: (message: string, title?: string, duration?: number) => string;
  removeToast: (id: string) => void;
}

export const ToastContext = createContext<IToastContext | undefined>(undefined);

export const useToast = (): IToastContext => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

/**
 * Dispatch global toast event from anywhere without React hooks
 */
export const showGlobalToast = (
  message: string,
  type: ToastType = 'info',
  title?: string,
  duration?: number
): void => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('nexus:toast', {
        detail: { message, type, title, duration },
      })
    );
  }
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<IToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (
      message: string,
      type: ToastType = 'info',
      title?: string,
      duration: number = 4500
    ): string => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newToast: IToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        window.setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const showSuccess = useCallback(
    (message: string, title?: string, duration?: number) =>
      showToast(message, 'success', title, duration),
    [showToast]
  );

  const showError = useCallback(
    (message: string, title?: string, duration?: number) =>
      showToast(message, 'error', title, duration),
    [showToast]
  );

  const showWarning = useCallback(
    (message: string, title?: string, duration?: number) =>
      showToast(message, 'warning', title, duration),
    [showToast]
  );

  const showInfo = useCallback(
    (message: string, title?: string, duration?: number) =>
      showToast(message, 'info', title, duration),
    [showToast]
  );

  // Listen to global nexus:toast events
  useEffect(() => {
    const handleGlobalToast = (e: Event) => {
      const customEvent = e as CustomEvent<{
        message: string;
        type?: ToastType;
        title?: string;
        duration?: number;
      }>;
      if (customEvent.detail?.message) {
        showToast(
          customEvent.detail.message,
          customEvent.detail.type || 'info',
          customEvent.detail.title,
          customEvent.detail.duration
        );
      }
    };

    window.addEventListener('nexus:toast', handleGlobalToast);
    return () => window.removeEventListener('nexus:toast', handleGlobalToast);
  }, [showToast]);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        removeToast,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer: React.FC<{
  toasts: IToastItem[];
  onRemove: (id: string) => void;
}> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <aside
      aria-label="Thông báo hệ thống"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: '10px',
        pointerEvents: 'none',
        maxWidth: '420px',
        width: 'calc(100vw - 48px)',
      }}
    >
      {toasts.map((toast) => {
        const config = getToastConfig(toast.type);
        const IconComponent = config.icon;

        return (
          <div
            key={toast.id}
            role="alert"
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '14px 16px',
              backgroundColor: config.bgColor,
              border: `1px solid ${config.borderColor}`,
              borderRadius: '10px',
              boxShadow:
                '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              backdropFilter: 'blur(8px)',
              color: config.textColor,
              animation: 'nexusToastSlideIn 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ flexShrink: 0, marginTop: '2px', color: config.iconColor }}>
              <IconComponent size={20} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              {toast.title && (
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    marginBottom: '2px',
                    color: config.titleColor,
                  }}
                >
                  {toast.title}
                </div>
              )}
              <div
                style={{
                  fontSize: '0.84rem',
                  lineHeight: 1.45,
                  wordBreak: 'break-word',
                  color: config.textColor,
                }}
              >
                {toast.message}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onRemove(toast.id)}
              style={{
                flexShrink: 0,
                background: 'none',
                border: 'none',
                padding: '3px',
                cursor: 'pointer',
                color: config.textColor,
                opacity: 0.65,
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'opacity 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.65';
              }}
              aria-label="Đóng thông báo"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
      <style>{`
        @keyframes nexusToastSlideIn {
          from {
            opacity: 0;
            transform: translateX(30px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
      `}</style>
    </aside>
  );
};

function getToastConfig(type: ToastType) {
  switch (type) {
    case 'success':
      return {
        icon: CheckCircle2,
        bgColor: '#f0fdf4',
        borderColor: '#86efac',
        iconColor: '#16a34a',
        titleColor: '#14532d',
        textColor: '#166534',
      };
    case 'error':
      return {
        icon: AlertCircle,
        bgColor: '#fef2f2',
        borderColor: '#fca5a5',
        iconColor: '#dc2626',
        titleColor: '#7f1d1d',
        textColor: '#991b1b',
      };
    case 'warning':
      return {
        icon: AlertTriangle,
        bgColor: '#fffbeb',
        borderColor: '#fde68a',
        iconColor: '#d97706',
        titleColor: '#78350f',
        textColor: '#92400e',
      };
    case 'info':
    default:
      return {
        icon: Info,
        bgColor: '#eff6ff',
        borderColor: '#93c5fd',
        iconColor: '#2563eb',
        titleColor: '#1e3a8a',
        textColor: '#1d4ed8',
      };
  }
}
