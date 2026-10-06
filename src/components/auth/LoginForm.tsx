import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  ShieldAlert,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useCountdown } from '../../hooks/useCountdown';
import { ILoginPayload } from '../../interfaces';
import { ADMIN_ACCOUNT, AUTH_STORAGE_KEYS } from '../../mock/auth.mock';
import { Button, Input } from '../common';
import { SocialPhoneAuthSection } from './SocialPhoneAuthSection';
import styles from './LoginForm.module.css';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_SECONDS = 15 * 60;

export const LoginForm: React.FC = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const {
    secondsLeft,
    formattedTime,
    isActive: isLockedOut,
    progressPercent,
    startCountdown,
    resetCountdown,
  } = useCountdown(LOCKOUT_DURATION_SECONDS);

  const [formState, setFormState] = useState<ILoginPayload>({
    email: ADMIN_ACCOUNT.email,
    password: ADMIN_ACCOUNT.password,
    rememberMe: true,
  });

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [failedAttempts, setFailedAttempts] = useState<number>(() => {
    const saved = window.localStorage.getItem(AUTH_STORAGE_KEYS.FAILED_ATTEMPTS);
    return saved ? Number(saved) : 0;
  });
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [authError, setAuthError] = useState<string | null>(null);

  const validateField = (name: 'email' | 'password', value: string): string | undefined => {
    if (name === 'email') {
      const trimmed = value.trim();
      if (!trimmed) return 'Vui lòng nhập địa chỉ email công việc.';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmed)) return 'Địa chỉ email không đúng định dạng.';
      return undefined;
    }

    if (!value) return 'Vui lòng nhập mật khẩu.';
    if (value.length < 8) return 'Mật khẩu phải có tối thiểu 8 ký tự.';
    return undefined;
  };

  const handleInputChange = (field: 'email' | 'password', value: string): void => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    setAuthError(null);
    const errorMsg = validateField(field, value);
    setFieldErrors((prev) => ({ ...prev, [field]: errorMsg }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (isLockedOut) return;

    const emailErr = validateField('email', formState.email);
    const passwordErr = validateField('password', formState.password);
    setFieldErrors({ email: emailErr, password: passwordErr });

    if (emailErr || passwordErr) {
      return;
    }

    try {
      await login(formState);
      setFailedAttempts(0);
      resetCountdown();
      navigate('/dashboard');
    } catch (err: unknown) {
      let serverMsg: string | undefined;
      let is429 = false;
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as {
          response?: { status?: number; data?: { detail?: string; message?: string } };
        };
        serverMsg = axiosErr.response?.data?.detail || axiosErr.response?.data?.message;
        if (axiosErr.response?.status === 429) {
          is429 = true;
        }
      }

      const nextAttempts = is429 ? MAX_ATTEMPTS : failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      window.localStorage.setItem(AUTH_STORAGE_KEYS.FAILED_ATTEMPTS, String(nextAttempts));

      if (nextAttempts >= MAX_ATTEMPTS || is429) {
        startCountdown(LOCKOUT_DURATION_SECONDS);
        setAuthError(
          serverMsg ||
            'Bạn đã nhập sai quá 5 lần quy định. Tài khoản tạm thời bị khóa trong 15 phút để bảo mật.'
        );
      } else {
        const remaining = MAX_ATTEMPTS - nextAttempts;
        setAuthError(
          serverMsg ||
            `Email hoặc mật khẩu không chính xác. Còn ${remaining} lần thử trước khi khóa bảo mật 15 phút.`
        );
      }
    }
  };

  const handleFillAdmin = (): void => {
    setFormState({
      email: ADMIN_ACCOUNT.email,
      password: ADMIN_ACCOUNT.password,
      rememberMe: true,
    });
    setFieldErrors({});
    setAuthError(null);
  };



  const isEmailValid =
    formState.email.trim().length > 0 && !validateField('email', formState.email);
  const isPasswordValid =
    formState.password.length >= 8 && !validateField('password', formState.password);

  return (
    <motion.div
      className={styles.loginCard}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32 }}
    >
      <div className={styles.loginCard__header}>
        <div className={styles.loginCard__badge}>
          <Sparkles size={13} />
          <span>XÁC THỰC DOANH NGHIỆP & BẢO VỆ JWT</span>
        </div>
        <h1 className={styles.loginCard__title}>Đăng nhập hệ thống</h1>
        <p className={styles.loginCard__subtitle}>
          Nhập thông tin tài khoản Quản trị viên hoặc đăng ký tài khoản mới để truy cập NexusCRM.
        </p>
      </div>

      {isLockedOut && (
        <motion.div
          className={styles.lockoutBanner}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          role="alert"
          aria-live="polite"
        >
          <div className={styles.lockoutBanner__top}>
            <div className={styles.lockoutBanner__iconWrap}>
              <ShieldAlert size={20} />
            </div>
            <div className={styles.lockoutBanner__text}>
              <h2 className={styles.lockoutBanner__title}>
                Tài khoản tạm khóa bảo mật (Chính sách 15 phút)
              </h2>
              <p className={styles.lockoutBanner__desc}>
                Phát hiện 5 lần đăng nhập thất bại liên tiếp. Vui lòng chờ đồng hồ đếm ngược kết
                thúc (`useCountdown(15 * 60)`).
              </p>
            </div>
          </div>

          <div className={styles.lockoutBanner__timerRow}>
            <div className={styles.lockoutBanner__clock}>
              <span className={styles.lockoutBanner__clockLabel}>MỞ KHÓA SAU</span>
              <strong className={`${styles.lockoutBanner__clockValue} tabular-nums`}>
                {formattedTime}
              </strong>
              <span className={styles.lockoutBanner__seconds}>({secondsLeft}s)</span>
            </div>


          </div>

          <div className={styles.lockoutBanner__progressTrack}>
            <div
              className={styles.lockoutBanner__progressFill}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </motion.div>
      )}

      {!isLockedOut && authError && (
        <div className={styles.errorAlert} role="alert">
          <AlertTriangle size={16} className={styles.errorAlert__icon} />
          <span>{authError}</span>
        </div>
      )}

      <form className={styles.loginForm} onSubmit={(e) => void handleSubmit(e)} noValidate>
        <Input
          label="Email công việc"
          type="email"
          name="email"
          autoComplete="email"
          value={formState.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          error={fieldErrors.email}
          isValid={isEmailValid}
          disabled={isLockedOut || isLoading}
          leftIcon={<Mail size={17} />}
          placeholder="admin@nexuscrm.vn"
        />

        <Input
          label="Mật khẩu"
          type={showPassword ? 'text' : 'password'}
          name="password"
          autoComplete="current-password"
          value={formState.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          error={fieldErrors.password}
          isValid={isPasswordValid}
          disabled={isLockedOut || isLoading}
          leftIcon={<Lock size={17} />}
          placeholder="••••••••••••"
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className={styles.loginForm__eyeBtn}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              disabled={isLockedOut}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        <div className={styles.loginForm__optionsRow}>
          <label className={styles.loginForm__checkboxLabel}>
            <input
              type="checkbox"
              checked={Boolean(formState.rememberMe)}
              disabled={isLockedOut}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, rememberMe: e.target.checked }))
              }
            />
            <span>Duy trì đăng nhập 30 ngày</span>
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link
              to="/forgot-password"
              style={{
                fontSize: '0.8125rem',
                color: 'var(--color-primary)',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              Quên mật khẩu?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isLoading}
          disabled={isLockedOut}
          rightIcon={<ArrowRight size={17} />}
        >
          {isLockedOut ? `Đang khóa (${formattedTime})` : 'Đăng nhập vào Hệ thống'}
        </Button>
      </form>

      <SocialPhoneAuthSection mode="login" disabled={isLockedOut} />

      {/* Tài khoản Admin duy nhất */}
      <div className={styles.demoCredentials}>
        <div className={styles.demoCredentials__header}>
          <KeyRound size={13} />
          <span>TÀI KHOẢN QUẢN TRỊ VIÊN MẶC ĐỊNH (NHẤN ĐỂ ĐIỀN)</span>
        </div>
        <button
          type="button"
          onClick={handleFillAdmin}
          disabled={isLockedOut}
          className={styles.demoCredentials__singleBtn}
        >
          <div className={styles.demoCredentials__left}>
            <span className={styles.demoCredentials__name}>
              {ADMIN_ACCOUNT.user.fullName}
            </span>
            <code className={styles.demoCredentials__email}>
              {ADMIN_ACCOUNT.email} · Mật khẩu: {ADMIN_ACCOUNT.password}
            </code>
          </div>
          <span className={styles.demoCredentials__role}>Super Admin</span>
        </button>
      </div>

      {/* Liên kết chuyển sang trang Đăng ký */}
      <div className={styles.switchAuthRow}>
        <span>Chưa có tài khoản doanh nghiệp?</span>
        <Link to="/register" className={styles.switchAuthLink}>
          <UserPlus size={14} />
          Đăng ký tài khoản mới
        </Link>
      </div>
    </motion.div>
  );
};
