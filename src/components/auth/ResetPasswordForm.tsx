import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Eye, EyeOff, Lock, ArrowLeft, ShieldAlert } from 'lucide-react';
import { IResetPasswordRequest } from '../../interfaces';
import { axiosInstance } from '../../utils/axiosInstance';
import { Button, Input } from '../common';
import { useToast } from '../../context/ToastContext';
import styles from './LoginForm.module.css';

interface ResetPasswordFormProps {
  initialToken?: string;
  onSuccess?: () => void;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ initialToken, onSuccess }) => {
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tokenFromUrl =
    initialToken ||
    searchParams.get('token') ||
    window.sessionStorage.getItem('nexus_crm_reset_token') ||
    '123456';

  const [token] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validatePassword = (pass: string): string | undefined => {
    if (!pass) return 'Vui lòng nhập mật khẩu mới.';
    if (pass.length < 8) return 'Mật khẩu phải có tối thiểu 8 ký tự.';
    if (!/[A-Za-z]/.test(pass) || !/[0-9]/.test(pass)) {
      return 'Mật khẩu phải bao gồm cả chữ cái và chữ số.';
    }
    return undefined;
  };

  const handleNewPasswordChange = (val: string): void => {
    setNewPassword(val);
    setServerError(null);
    const passErr = validatePassword(val);
    let confErr = fieldErrors.confirmPassword;
    if (confirmPassword) {
      confErr = confirmPassword === val ? undefined : 'Mật khẩu xác nhận không khớp.';
    }
    setFieldErrors({
      newPassword: passErr,
      confirmPassword: confErr,
    });
  };

  const handleConfirmPasswordChange = (val: string): void => {
    setConfirmPassword(val);
    setServerError(null);
    let confErr: string | undefined;
    if (!val) {
      confErr = 'Vui lòng xác nhận lại mật khẩu mới.';
    } else if (val !== newPassword) {
      confErr = 'Mật khẩu xác nhận không khớp.';
    }
    setFieldErrors((prev) => ({
      ...prev,
      confirmPassword: confErr,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setServerError(null);

    const passErr = validatePassword(newPassword);
    const confErr =
      !confirmPassword
        ? 'Vui lòng xác nhận lại mật khẩu mới.'
        : confirmPassword !== newPassword
        ? 'Mật khẩu xác nhận không khớp.'
        : undefined;

    setFieldErrors({ newPassword: passErr, confirmPassword: confErr });
    if (passErr || confErr) return;

    setIsSubmitting(true);
    try {
      const payload: IResetPasswordRequest = {
        token: token.trim(),
        newPassword,
      };
      await axiosInstance.post('/auth/reset-password', payload);
      setIsSuccess(true);
      showToast('success', 'Đặt lại mật khẩu mới thành công! Bạn có thể đăng nhập ngay.');
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      let msg = 'Đặt lại mật khẩu thất bại. Vui lòng kiểm tra lại thông tin kết nối.';
      if (err && typeof err === 'object' && 'response' in err) {
        const axErr = err as { response?: { data?: { detail?: string; message?: string } } };
        msg = axErr.response?.data?.detail || axErr.response?.data?.message || msg;
      }
      setServerError(msg);
      showToast('error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={styles.loginCard} style={{ textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', padding: '12px', background: 'var(--color-success-soft)', borderRadius: '50%', color: 'var(--color-success)', marginBottom: '16px' }}>
          <CheckCircle2 size={36} />
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>Đặt lại mật khẩu thành công!</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '24px' }}>
          Mật khẩu tài khoản của bạn đã được cập nhật thành công. Vui lòng sử dụng mật khẩu mới để đăng nhập.
        </p>
        <Button variant="primary" fullWidth onClick={() => navigate('/login')}>
          Đăng nhập ngay
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.loginCard}>
      <div className={styles.loginCard__header}>
        <h1 className={styles.loginCard__title}>Đặt lại mật khẩu mới</h1>
        <p className={styles.loginCard__subtitle}>
          Tạo mật khẩu mới an toàn cho tài khoản của bạn.
        </p>
      </div>

      {serverError && (
        <div className={styles.errorAlert} role="alert" style={{ marginBottom: '16px' }}>
          <ShieldAlert size={16} />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} noValidate>
        <Input
          label="Mật khẩu mới"
          type={showPassword ? 'text' : 'password'}
          value={newPassword}
          onChange={(e) => handleNewPasswordChange(e.target.value)}
          error={fieldErrors.newPassword}
          leftIcon={<Lock size={16} />}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              className={styles.loginForm__eyeBtn}
            >
              {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          }
          placeholder="Tối thiểu 8 ký tự gồm chữ và số"
          disabled={isSubmitting}
        />

        <Input
          label="Xác nhận mật khẩu mới"
          type={showConfirmPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => handleConfirmPasswordChange(e.target.value)}
          error={fieldErrors.confirmPassword}
          leftIcon={<Lock size={16} />}
          rightElement={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              className={styles.loginForm__eyeBtn}
            >
              {showConfirmPassword ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          }
          placeholder="Nhập lại mật khẩu mới"
          disabled={isSubmitting}
        />

        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Button type="submit" variant="primary" fullWidth isLoading={isSubmitting}>
            Xác nhận đặt lại mật khẩu
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
              textDecoration: 'none',
              padding: '8px',
            }}
          >
            <ArrowLeft size={15} />
            Quay lại đăng nhập
          </Link>
        </div>
      </form>
    </div>
  );
};
