import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, KeyRound, Mail } from 'lucide-react';
import { ResetPasswordForm } from '../components/auth/ResetPasswordForm';
import { Button, Input } from '../components/common';
import { axiosInstance } from '../utils/axiosInstance';
import logoUrl from '../assets/logo.svg';

export const ForgotPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('token') ? 'reset' : 'request';

  const [mode, setMode] = useState<'request' | 'reset'>(initialMode);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [serverMessage, setServerMessage] = useState<string | null>(null);

  const validateEmail = (val: string): boolean => {
    const trimmed = val.trim();
    if (!trimmed) {
      setEmailError('Vui lòng nhập địa chỉ email công việc.');
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

  const handleRequestSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!validateEmail(email)) return;

    setIsSubmitting(true);
    setServerMessage(null);

    try {
      const res = await axiosInstance.post('/auth/forgot-password', {
        email: email.trim(),
      });
      setRequestSent(true);
      setServerMessage(
        res.data?.message ||
          'Yêu cầu đã được ghi nhận. Nếu email tồn tại trên hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi đến hộp thư.'
      );
    } catch {
      // Anti-enumeration: Still display polite confirmation
      setRequestSent(true);
      setServerMessage(
        'Nếu email tồn tại trên hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi đến hộp thư.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        backgroundColor: 'var(--color-bg-app)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Simple Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <img src={logoUrl} alt="NexusCRM" style={{ width: '32px', height: '32px' }} />
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              NexusCRM
            </span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            Hệ thống Quản trị Khách hàng Doanh nghiệp
          </p>
        </div>

        {mode === 'reset' ? (
          <div>
            <ResetPasswordForm />
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => setMode('request')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-secondary)',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Chưa có mã token? Gửi lại yêu cầu qua email
              </button>
            </div>
          </div>
        ) : requestSent ? (
          <div
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '32px 24px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                padding: '12px',
                background: 'var(--color-success-soft)',
                borderRadius: '50%',
                color: 'var(--color-success)',
                marginBottom: '16px',
              }}
            >
              <CheckCircle2 size={32} />
            </div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '8px' }}>
              Đã gửi yêu cầu xác thực
            </h2>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.5,
                marginBottom: '24px',
              }}
            >
              {serverMessage}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Button
                variant="primary"
                fullWidth
                onClick={() => setMode('reset')}
              >
                Nhập mã token & Đặt lại mật khẩu
              </Button>
              <Link
                to="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '0.875rem',
                  color: 'var(--color-primary)',
                  padding: '8px',
                }}
              >
                <ArrowLeft size={15} />
                Quay lại màn hình đăng nhập
              </Link>
            </div>
          </div>
        ) : (
          <div
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '32px 24px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ marginBottom: '20px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--color-primary)',
                  padding: '4px 8px',
                  background: 'var(--color-primary-soft)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '12px',
                }}
              >
                <KeyRound size={13} />
                <span>QUÊN MẬT KHẨU</span>
              </div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px' }}>
                Khôi phục mật khẩu tài khoản
              </h1>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                Nhập địa chỉ email doanh nghiệp đã đăng ký để nhận mã token đặt lại mật khẩu an toàn.
              </p>
            </div>

            <form onSubmit={(e) => void handleRequestSubmit(e)} noValidate>
              <Input
                label="Email công việc"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) validateEmail(e.target.value);
                }}
                error={emailError ?? undefined}
                leftIcon={<Mail size={16} />}
                placeholder="admin@nexuscrm.vn"
                disabled={isSubmitting}
                autoFocus
              />

              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={isSubmitting}
                >
                  Gửi mã xác thực qua Email
                </Button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem', marginTop: '4px' }}>
                  <Link
                    to="/login"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    <ArrowLeft size={14} />
                    Quay lại đăng nhập
                  </Link>

                  <button
                    type="button"
                    onClick={() => setMode('reset')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-primary)',
                      cursor: 'pointer',
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                    }}
                  >
                    Đã có mã token?
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
