import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { IToastItem, ToastNotification } from '../components/common/ToastNotification';

export interface IToastContext {
  toasts: IToastItem[];
  showToast: (type: 'success' | 'warning' | 'error' | 'info', message: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<IToastContext | undefined>(undefined);

interface IToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<IToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<IToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: 'success' | 'warning' | 'error' | 'info', message: string) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newToast: IToastItem = { id, type, message };
      // Giữ tối đa 4 toast cùng lúc để không chiếm màn hình
      setToasts((prev) => [...prev.slice(-3), newToast]);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      {/* ToastNotification hiển thị cố định ở góc dưới bên phải màn hình */}
      <ToastNotification toasts={toasts} onDismiss={removeToast} autoDismissTimeMs={3500} />
    </ToastContext.Provider>
  );
};

export const useToast = (): IToastContext => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
