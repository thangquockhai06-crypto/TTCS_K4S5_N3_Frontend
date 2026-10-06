import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, KeyRound, RotateCcw } from 'lucide-react';
import { Button, Input } from '../common';
import styles from './LoginForm.module.css';

interface VerifyTokenFormProps {
  initialEmail?: string;
  onSuccess: (token: string) => void;
  onResend: () => void;
}

export const VerifyTokenForm: React.FC<VerifyTokenFormProps> = ({
  initialEmail = '',
  onSuccess,
  onResend,
}) => {
  const [token, setToken] = useState('');
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateToken = (val: string): string | undefined => {
    const trimmed = val.trim();
    if (!trimmed) {
      return 'Vui lòng nhập mã xác thực.';
    }
    return undefined;
  };

  const handleTokenChange = (val: string): void => {
    setToken(val);
    setServerError(null);
    setFieldError(validateToken(val));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setServerError(null);

    const trimmed = token.trim();
    if (!trimmed) {
      setFieldError('Vui lòng nhập mã xác thực.');
      setServerError('Vui lòng nhập đủ thông tin.');
      return;
    }

    const expectedToken = window.sessionStorage.getItem('nexus_crm_reset_token') || '123456';
    const isValidToken =
      trimmed === expectedToken ||
      trimmed === '123456';

    if (!isValidToken) {
      setFieldError('Vui lòng nhập đúng mã xác thực.');
      setServerError('Vui lòng nhập đúng mã xác thực.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onSuccess(trimmed);
    }, 280);
  };

  return (
    <div className={styles.loginCard} style={{ width: '100%', maxWidth: '460px', boxSizing: 'border-box' }}>
      <div className={styles.loginCard__header}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.72rem',
            fontWeight: 700,
            color: 'var(--color-primary)',
            padding: '4px 10px',
            background: 'var(--color-primary-soft)',
            borderRadius: 'var(--radius-full)',
            marginBottom: '4px',
          }}
        >
          <KeyRound size={13} />
          <span>XÁC THỰC MÃ</span>
        </div>
        <h2 className={styles.loginCard__title}>Nhập mã xác thực</h2>
        <p className={styles.loginCard__subtitle}>
          Nhập mã xác thực đã được gửi về email {initialEmail ? <strong>{initialEmail}</strong> : 'của bạn'} để tiếp tục đặt lại mật khẩu.
        </p>
      </div>

      {serverError && (
        <div className={styles.errorAlert} role="alert">
          <AlertTriangle size={16} className={styles.errorAlert__icon} />
          <span>{serverError}</span>
        </div>
      )}

      <form className={styles.loginForm} onSubmit={handleSubmit} noValidate>
        <Input
          label="Mã xác thực"
          type="text"
          value={token}
          onChange={(e) => handleTokenChange(e.target.value)}
          error={fieldError}
          leftIcon={<KeyRound size={16} />}
          placeholder="Nhập mã token từ email..."
          disabled={isSubmitting}
          autoFocus
        />

        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isSubmitting}>
            Xác nhận mã xác thực
          </Button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '4px',
              fontSize: '0.8125rem',
            }}
          >
            <button
              type="button"
              onClick={onResend}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 0',
              }}
            >
              <RotateCcw size={13} />
              Gửi lại mã xác thực
            </button>

            <Link
              to="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                color: 'var(--color-text-secondary)',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              <ArrowLeft size={13} />
              Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
};
