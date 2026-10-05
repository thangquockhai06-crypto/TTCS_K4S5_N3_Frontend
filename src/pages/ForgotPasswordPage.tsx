import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Lock, Mail } from 'lucide-react';
import { Button, Input } from '../components/common';
import { useToast } from '../context/ToastContext';
import logoUrl from '../assets/logo.svg';
import styles from './LoginPage.module.css';

type StepType = 'email_step' | 'otp_step' | 'reset_step' | 'success_step';

export const ForgotPasswordPage: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<StepType>('email_step');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);

  // OTP step
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);

  // Reset step
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [confirmPassError, setConfirmPassError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Send Email
  const handleEmailSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError('Vui lòng nhập địa chỉ email.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError('Địa chỉ email không đúng định dạng.');
      return;
    }
    setEmailError(null);
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setStep('otp_step');
      showToast('success', 'Đã gửi mã xác thực qua email.');
    }, 400);
  };

  // Step 2: Verify OTP (Demo token 123456)
  const handleOtpSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      setOtpError('Vui lòng nhập mã xác thực gồm 6 số.');
      return;
    }
    // Mã xác thực chuẩn mẫu 123456
    if (otpCode.trim() !== '123456') {
      setOtpError('Mã xác thực không chính xác hoặc đã hết hạn. Thử mã mẫu: 123456');
      showToast('error', 'Mã xác thực không chính xác.');
      return;
    }

    setOtpError(null);
    setStep('reset_step');
    showToast('info', 'Xác thực thành công. Vui lòng tạo mật khẩu mới.');
  };

  // Step 3: Reset Password
  const handleResetSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newPassword) {
      setPassError('Vui lòng nhập mật khẩu mới.');
      return;
    }
    if (newPassword.length < 8) {
      setPassError('Mật khẩu phải có tối thiểu 8 ký tự.');
      return;
    }
    if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      setPassError('Mật khẩu phải bao gồm cả chữ cái, chữ số và ký tự đặc biệt.');
      return;
    }
    setPassError(null);

    if (newPassword !== confirmPassword) {
      setConfirmPassError('Mật khẩu xác nhận không khớp.');
      return;
    }
    setConfirmPassError(null);

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setStep('success_step');
      showToast('success', 'Đặt lại mật khẩu mới thành công! Bạn có thể đăng nhập ngay.');
    }, 400);
  };

  return (
    <div className={styles.authPageContainer}>
      <div className={styles.authCard}>
        {/* Brand Header */}
        <header className={styles.authHeader}>
          <img src={logoUrl} alt="NexusCRM" className={styles.authLogo} />
          <div>
            <h1 className={styles.authBrandTitle}>NexusCRM</h1>
            <p className={styles.authBrandSubtitle}>Khôi phục và đặt lại mật khẩu</p>
          </div>
        </header>

        {/* STEP 1: Nhập Email */}
        {step === 'email_step' && (
          <div>
            <div style={{ marginBottom: '18px' }}>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text-primary, #0f172a)' }}>
                Quên mật khẩu
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--color-text-secondary, #64748b)' }}>
                Nhập địa chỉ email doanh nghiệp đã đăng ký để nhận mã xác thực đặt lại mật khẩu.
              </p>
            </div>

            <form onSubmit={handleEmailSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError(null);
                }}
                error={emailError ?? undefined}
                leftIcon={<Mail size={16} />}
                placeholder="admin@nexuscrm.vn"
                required
                autoFocus
              />

              <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isSubmitting}>
                Gửi mã xác thực qua Email
              </Button>

              <div style={{ textAlign: 'center', marginTop: '6px' }}>
                <Link
                  to="/login"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.84rem',
                    color: 'var(--color-text-secondary, #64748b)',
                    textDecoration: 'none',
                  }}
                >
                  <ArrowLeft size={14} />
                  Quay lại đăng nhập
                </Link>
              </div>
            </form>
          </div>
        )}

        {/* STEP 2: Nhập Mã Xác Thực */}
        {step === 'otp_step' && (
          <div>
            <div style={{ marginBottom: '18px' }}>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text-primary, #0f172a)' }}>
                Nhập mã xác thực
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--color-text-secondary, #64748b)' }}>
                Mã xác thực đã được gửi tới <strong>{email}</strong>. Vui lòng nhập mã để tiếp tục.
              </p>
            </div>

            <form onSubmit={handleOtpSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Input
                label="Mã xác thực"
                type="text"
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value);
                  setOtpError(null);
                }}
                error={otpError ?? undefined}
                leftIcon={<KeyRound size={16} />}
                placeholder="Nhập 123456"
                required
                autoFocus
              />

              <Button type="submit" variant="primary" size="lg" fullWidth>
                Xác nhận mã xác thực
              </Button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.825rem' }}>
                <button
                  type="button"
                  onClick={() => setStep('email_step')}
                  style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <ArrowLeft size={13} /> Nhập lại email
                </button>
                <button
                  type="button"
                  onClick={() => {
                    showToast('success', 'Đã gửi lại mã xác thực qua email.');
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--color-primary, #2563eb)', cursor: 'pointer', fontWeight: 600 }}
                >
                  Gửi lại mã
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: Đặt Lại Mật Khẩu Mới */}
        {step === 'reset_step' && (
          <div>
            <div style={{ marginBottom: '18px' }}>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text-primary, #0f172a)' }}>
                Đặt lại mật khẩu mới
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--color-text-secondary, #64748b)' }}>
                Tạo mật khẩu mới an toàn cho tài khoản <strong>{email}</strong>.
              </p>
            </div>

            <form onSubmit={handleResetSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Input
                label="Mật khẩu mới"
                type={showPass ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setPassError(null);
                }}
                error={passError ?? undefined}
                leftIcon={<Lock size={16} />}
                placeholder="Tối thiểu 8 ký tự (chữ, số, ký tự đặc biệt)"
                required
                autoFocus
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#64748b' }}
                    aria-label={showPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />

              <Input
                label="Xác nhận mật khẩu mới"
                type={showConfirmPass ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setConfirmPassError(null);
                }}
                error={confirmPassError ?? undefined}
                leftIcon={<Lock size={16} />}
                placeholder="Nhập lại mật khẩu mới"
                required
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#64748b' }}
                    aria-label={showConfirmPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />

              <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isSubmitting}>
                Cập nhật mật khẩu mới
              </Button>
            </form>
          </div>
        )}

        {/* STEP 4: Thành công */}
        {step === 'success_step' && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div
              style={{
                display: 'inline-flex',
                padding: '12px',
                background: 'var(--color-success-soft, #dcfce7)',
                borderRadius: '50%',
                color: 'var(--color-success, #16a34a)',
                marginBottom: '16px',
              }}
            >
              <CheckCircle2 size={36} />
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 8px', color: '#0f172a' }}>
              Đặt lại mật khẩu thành công!
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5, margin: '0 0 20px' }}>
              Mật khẩu mới của bạn đã được cập nhật thành công vào hệ thống. Bạn có thể đăng nhập ngay bây giờ.
            </p>
            <Button variant="primary" fullWidth size="lg" onClick={() => navigate('/login')}>
              Đăng nhập ngay
            </Button>
          </div>
        )}

        <footer className={styles.authFooter}>
          <span>NexusCRM Enterprise © 2026 · Hệ thống thông tin nội bộ</span>
        </footer>
      </div>
    </div>
  );
};
