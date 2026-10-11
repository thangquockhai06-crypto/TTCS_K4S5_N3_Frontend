import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import styles from './Modal.module.css';

export interface IModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<IModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label={title}>
          <motion.div
            className={styles.modalBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={`${styles.modalContent} ${styles[`modalContent--${maxWidth}`]}`}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <header className={styles.modal__header}>
              <div>
                <h2 className={styles.modal__title}>{title}</h2>
                {subtitle && <p className={styles.modal__subtitle}>{subtitle}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                className={styles.modal__closeBtn}
                aria-label="Đóng hộp thoại"
              >
                <X size={18} />
              </button>
            </header>

            <div className={styles.modal__body}>{children}</div>

            {footer && <footer className={styles.modal__footer}>{footer}</footer>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
