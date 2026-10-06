import React, { useState } from 'react';
import { Check, Copy, Mail, RefreshCw, Sparkles } from 'lucide-react';
import { IUserItem } from '../../interfaces/user-management.interface';
import styles from './UserActivationModal.module.css';

interface UserActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: IUserItem | null;
  tempPassword?: string;
  onResendActivation?: (user: IUserItem) => Promise<void>;
}

export const UserActivationModal: React.FC<UserActivationModalProps> = ({
  isOpen,
  onClose,
  user,
  tempPassword,
  onResendActivation,
}) => {
  const [copied, setCopied] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  if (!isOpen || !user) return null;

  const displayPassword = tempPassword || user.tempPassword || 'Nx#8k9Lm';

  const handleCopyPassword = (): void => {
    navigator.clipboard.writeText(displayPassword);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleResend = async (): Promise<void> => {
    if (!onResendActivation) return;
    setIsResending(true);
    try {
      await onResendActivation(user);
      setResendSuccess(true);
      window.setTimeout(() => setResendSuccess(false), 3000);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.headerSuccess}>
          <div className={styles.iconCircle}>
            <Sparkles size={28} />
          </div>
          <h2 className={styles.title}>Tạo tài khoản thành công!</h2>
          <p className={styles.subtitle}>
            Email kích hoạt kèm mật khẩu tạm đã được gửi tới hòm thư của nhân sự.
          </p>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Họ và tên:</span>
            <span className={styles.infoValue}>{user.name}</span>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Email nhận thư:</span>
            <span className={styles.infoValue}>
              <Mail size={14} style={{ display: 'inline', marginRight: 4 }} />
              {user.email}
            </span>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Địa bàn / Nhóm:</span>
            <span className={styles.infoValue}>{user.group}</span>
          </div>

          {/* Hộp hiển thị mật khẩu tạm */}
          <div className={styles.passwordBox}>
            <div className={styles.passwordHeader}>
              <span>Mật khẩu tạm thời</span>
              <span>Dùng để kích hoạt lần đầu</span>
            </div>
            <div className={styles.passwordDisplay}>
              <code className={styles.passwordCode}>{displayPassword}</code>
              <button
                type="button"
                className={styles.copyBtn}
                onClick={handleCopyPassword}
              >
                {copied ? (
                  <>
                    <Check size={14} /> Đã sao chép
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Sao chép
                  </>
                )}
              </button>
            </div>
          </div>

          <div className={styles.guidanceNote}>
            <strong>Hướng dẫn nhân sự mới:</strong> Nhân viên kinh doanh mới nhận địa bàn có thể đăng nhập bằng email và mật khẩu tạm trên. Hệ thống sẽ tự động yêu cầu đặt lại mật khẩu bảo mật cá nhân trong lần đăng nhập đầu tiên.
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.resendBtn}
            onClick={handleResend}
            disabled={isResending}
          >
            <RefreshCw size={14} className={isResending ? 'spin' : ''} />
            {resendSuccess
              ? 'Đã gửi lại email!'
              : isResending
              ? 'Đang gửi...'
              : 'Gửi lại email kích hoạt'}
          </button>

          <button type="button" className={styles.doneBtn} onClick={onClose}>
            Hoàn tất
          </button>
        </div>
      </div>
    </div>
  );
};
