import React, { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, KeyRound, Mail } from 'lucide-react';
import { ResetPasswordForm } from '../components/auth/ResetPasswordForm';
import { VerifyTokenForm } from '../components/auth/VerifyTokenForm';
import { Button, Input } from '../components/common';
import { useToast } from '../context/ToastContext';
import { axiosInstance, USE_REAL_BACKEND } from '../utils/axiosInstance';
import logoUrl from '../assets/logo.svg';
import styles from './LoginPage.module.css';
import formStyles from '../components/auth/LoginForm.module.css';

export const ForgotPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const getInitialMode = (): 'request' | 'verify' | 'reset' => {
    if (location.pathname === '/reset-password' || searchParams.get('token')) {
      return 'reset';
    }
    if (location.pathname === '/verify-token' || location.pathname === '/verify-reset-token') {
      return 'verify';
    }
    return 'request';
  };

  const [mode, setMode] = useState<'request' | 'verify' | 'reset'>(getInitialMode);
  const [email, setEmail] = useState(() => window.sessionStorage.getItem('nexus_crm_reset_email') || '');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verifiedToken, setVerifiedToken] = useState<string>(() => window.sessionStorage.getItem('nexus_crm_reset_token') || '');

  const validateEmail = (val: string): boolean => {
    const trimmed = val.trim();
    if (!trimmed) {
      setEmailError('Vui lòng nhập địa chỉ email.');
      return false;
    }
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(trimmed)) {
      setEmailError('Địa chỉ email không đúng định dạng.');
      return false;
    }
    setEmailError(null);
    return true;
  };

  const isEmailValid = email.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleRequestSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!validateEmail(email)) return;

    setIsSubmitting(true);
    const demoToken = '123456';
    window.sessionStorage.setItem('nexus_crm_reset_email', email.trim());
    window.sessionStorage.setItem('nexus_crm_reset_token', demoToken);

    try {
      if (USE_REAL_BACKEND) {
        await axiosInstance.post('/auth/forgot-password', {
          email: email.trim(),
        }, { timeout: 1500 });
      }
    } catch {
      // Anti-enumeration: still proceed
    } finally {
      setIsSubmitting(false);
      showToast('success', 'Đã gửi mã xác thực qua email.');
      setMode('verify');
      navigate('/verify-token');
    }
  };

  const handleTokenVerified = (token: string): void => {
    setVerifiedToken(token);
    window.sessionStorage.setItem('nexus_crm_reset_token', token);
    showToast('info', 'Xác thực thành công. Vui lòng tạo mật khẩu mới.');
    setMode('reset');
    navigate('/reset-password');
  };

  const handleResendToken = (): void => {
    const demoToken = '123456';
    window.sessionStorage.setItem('nexus_crm_reset_token', demoToken);
    showToast('success', 'Đã gửi lại mã xác thực qua email.');
  };

  const subtitleText =
    mode === 'reset'
      ? 'Đặt lại mật khẩu tài khoản'
      : mode === 'verify'
      ? 'Xác thực mã khôi phục tài khoản'
      : 'Khôi phục mật khẩu tài khoản';

  return (
    <div className={styles.authContainer}>
      <header className={styles.brandHeader}>
        <div className={styles.brandLogoRow}>
          <img src={logoUrl} alt="NexusCRM Logo" className={styles.logo} />
          <h1 className={styles.brandTitle}>NexusCRM</h1>
        </div>
        <p className={styles.brandSubtitle}>{subtitleText}</p>
      </header>

      <main className={styles.formWrapper}>
        {mode === 'reset' ? (
          <div style={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column' }}>
            <ResetPasswordForm initialToken={verifiedToken} />
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => {
                  setMode('request');
                  navigate('/forgot-password');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-primary)',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  fontWeight: 500,
                  textDecoration: 'underline',
                }}
              >
                Gửi lại yêu cầu qua email
              </button>
            </div>
          </div>
        ) : mode === 'verify' ? (
          <VerifyTokenForm
            initialEmail={email}
            onSuccess={handleTokenVerified}
            onResend={handleResendToken}
          />
        ) : (
          <div className={formStyles.loginCard}>
            <div className={formStyles.loginCard__header}>
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
                <span>QUÊN MẬT KHẨU</span>
              </div>
              <h2 className={formStyles.loginCard__title}>Khôi phục mật khẩu</h2>
              <p className={formStyles.loginCard__subtitle}>
                Nhập địa chỉ email để nhận mã xác thực đặt lại mật khẩu cho tài khoản.
              </p>
            </div>

            <form
              onSubmit={(e) => void handleRequestSubmit(e)}
              noValidate
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) validateEmail(e.target.value);
                }}
                error={emailError ?? undefined}
                isValid={isEmailValid}
                leftIcon={<Mail size={16} />}
                placeholder="admin@nexuscrm.vn"
                disabled={isSubmitting}
                autoFocus
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isSubmitting}
              >
                Gửi mã xác thực qua Email
              </Button>

              <div style={{ textAlign: 'center', marginTop: '8px' }}>
                <Link
                  to="/login"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    color: 'var(--color-text-secondary)',
                    fontSize: '0.84rem',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  <ArrowLeft size={14} />
                  Quay lại đăng nhập
                </Link>
              </div>
            </form>
          </div>
        )}
      </main>

      <footer className={styles.authFooter}>
        <span>NexusCRM Enterprise © 2026 · Hệ thống thông tin nội bộ</span>
      </footer>
    </div>
  );
};
