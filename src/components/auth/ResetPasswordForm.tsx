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

  const tokenFromUrl = initialToken || searchParams.get('token') || '';
  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<{
    token?: string;
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setServerError(null);

    const errors: typeof fieldErrors = {};
    if (!token.trim()) {
      errors.token = 'Mã xác thực (Token) không được để trống.';
    }
    const passErr = validatePassword(newPassword);
    if (passErr) {
      errors.newPassword = passErr;
    }
    if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

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
      let msg = 'Đặt lại mật khẩu thất bại. Mã xác thực có thể đã hết hạn hoặc không hợp lệ.';
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
          Nhập mã xác thực gửi qua email và tạo mật khẩu mới an toàn cho tài khoản của bạn.
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
          label="Mã xác thực (Reset Token)"
          type="text"
          value={token}
          onChange={(e) => {
            setToken(e.target.value);
            setFieldErrors((prev) => ({ ...prev, token: undefined }));
          }}
          error={fieldErrors.token}
          placeholder="test1234"
          disabled={isSubmitting}
        />

        <Input
          label="Mật khẩu mới"
          type={showPassword ? 'text' : 'password'}
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            setFieldErrors((prev) => ({ ...prev, newPassword: undefined }));
          }}
          error={fieldErrors.newPassword}
          leftIcon={<Lock size={16} />}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
          placeholder="Tối thiểu 8 ký tự gồm chữ và số"
          helperText="Tối thiểu 8 ký tự, gồm ít nhất một chữ cái và một chữ số"
          disabled={isSubmitting}
        />

        <Input
          label="Xác nhận mật khẩu mới"
          type={showConfirmPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
          }}
          error={fieldErrors.confirmPassword}
          leftIcon={<Lock size={16} />}
          rightElement={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
