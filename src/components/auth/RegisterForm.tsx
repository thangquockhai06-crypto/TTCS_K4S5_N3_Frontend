import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { IRegisterPayload } from '../../interfaces';
import { Button, Input } from '../common';
import { useToast } from '../../context/ToastContext';
import styles from './LoginForm.module.css';

interface IRegisterFieldErrors {
  fullName?: string;
  email?: string;
  companyName?: string;
  password?: string;
  confirmPassword?: string;
}

export const RegisterForm: React.FC = () => {
  const { register, isLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<IRegisterPayload>({
    fullName: '',
    email: '',
    companyName: '',
    roleTitle: 'Chuyên viên Kinh doanh',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [errors, setErrors] = useState<IRegisterFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validateField = (
    field: keyof IRegisterPayload,
    value: string,
    currentPassword = formData.password
  ): string | undefined => {
    const trimmed = value.trim();
    switch (field) {
      case 'fullName':
        if (!trimmed) return 'Vui lòng nhập họ và tên.';
        if (trimmed.length < 3) return 'Họ và tên phải có ít nhất 3 ký tự.';
        return undefined;
      case 'email':
        if (!trimmed) return 'Vui lòng nhập địa chỉ email.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
          return 'Địa chỉ email không đúng định dạng.';
        }
        return undefined;
      case 'companyName':
        if (!trimmed) return 'Vui lòng nhập tên doanh nghiệp.';
        if (trimmed.length < 2) return 'Tên doanh nghiệp phải có ít nhất 2 ký tự.';
        return undefined;
      case 'password':
        if (!value) return 'Vui lòng nhập mật khẩu.';
        if (value.length < 8) return 'Mật khẩu phải có tối thiểu 8 ký tự.';
        if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value) || !/[^A-Za-z0-9]/.test(value)) {
          return 'Mật khẩu phải bao gồm cả chữ cái, chữ số và ký tự đặc biệt.';
        }
        return undefined;
      case 'confirmPassword':
        if (!value) return 'Vui lòng xác nhận lại mật khẩu.';
        if (value !== currentPassword) return 'Mật khẩu xác nhận không khớp.';
        return undefined;
      default:
        return undefined;
    }
  };

  const handleFieldChange = (field: keyof IRegisterPayload, value: string): void => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      const errMsg = validateField(field, value, next.password);
      setErrors((prevErr) => ({
        ...prevErr,
        [field]: errMsg,
        ...(field === 'password' && next.confirmPassword
          ? {
              confirmPassword:
                next.confirmPassword === value
                  ? undefined
                  : 'Mật khẩu xác nhận không khớp.',
            }
          : {}),
      }));
      return next;
    });
    setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const nextErrors: IRegisterFieldErrors = {
      fullName: validateField('fullName', formData.fullName),
      email: validateField('email', formData.email),
      companyName: validateField('companyName', formData.companyName),
      password: validateField('password', formData.password),
      confirmPassword: validateField(
        'confirmPassword',
        formData.confirmPassword,
        formData.password
      ),
    };
    setErrors(nextErrors);

    if (Object.values(nextErrors).some((msg) => Boolean(msg))) {
      setSubmitError('Vui lòng nhập đủ thông tin và đúng định dạng.');
      return;
    }

    try {
      await register(formData);
      showToast('success', 'Đăng ký tài khoản doanh nghiệp thành công! Đang chuyển hướng...');
      navigate('/dashboard');
    } catch (err: unknown) {
      let serverMsg: string | undefined;
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as {
          response?: { status?: number; data?: { detail?: string; message?: string } };
        };
        serverMsg = axiosErr.response?.data?.detail || axiosErr.response?.data?.message;
      }

      if (serverMsg) {
        setSubmitError(serverMsg);
        showToast('error', serverMsg);
      } else if (err instanceof Error && err.message === 'EMAIL_ALREADY_EXISTS') {
        const existMsg = 'Địa chỉ email này đã được đăng ký. Vui lòng chuyển sang trang Đăng nhập.';
        setSubmitError(existMsg);
        showToast('warning', existMsg);
      } else {
        const genericMsg = 'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin kết nối.';
        setSubmitError(genericMsg);
        showToast('error', genericMsg);
      }
    }
  };

  return (
    <div className={styles.loginFormContainer}>
      <div className={styles.loginForm__header}>
        <h2 className={styles.loginForm__title}>Đăng ký tài khoản</h2>
        <p className={styles.loginForm__subtitle}>
          Tạo tài khoản quản trị mới để quản lý khách hàng và cơ hội bán hàng.
        </p>
      </div>

      {submitError && (
        <div className={styles.errorAlert} role="alert">
          <AlertTriangle size={16} className={styles.errorAlert__icon} />
          <span>{submitError}</span>
        </div>
      )}

      <form className={styles.loginForm} onSubmit={(e) => void handleSubmit(e)} noValidate>
        <Input
          label="Họ và tên"
          type="text"
          value={formData.fullName}
          onChange={(e) => handleFieldChange('fullName', e.target.value)}
          error={errors.fullName}
          leftIcon={<User size={16} />}
          placeholder="VD: Trần Minh Hoàng"
          required
        />

        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => handleFieldChange('email', e.target.value)}
          error={errors.email}
          leftIcon={<Mail size={16} />}
          placeholder="hoang.tran@congty.vn"
          required
        />

        <Input
          label="Tên doanh nghiệp"
          type="text"
          value={formData.companyName}
          onChange={(e) => handleFieldChange('companyName', e.target.value)}
          error={errors.companyName}
          leftIcon={<Building2 size={16} />}
          placeholder="VD: Công ty Công nghệ Nexus"
          required
        />

        <Input
          label="Mật khẩu"
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={(e) => handleFieldChange('password', e.target.value)}
          error={errors.password}
          leftIcon={<Lock size={16} />}
          placeholder="Tối thiểu 8 ký tự (chữ, số, ký tự đặc biệt)"
          required
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className={styles.loginForm__eyeBtn}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        <Input
          label="Xác nhận mật khẩu"
          type={showConfirmPassword ? 'text' : 'password'}
          value={formData.confirmPassword}
          onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
          error={errors.confirmPassword}
          leftIcon={<Lock size={16} />}
          placeholder="Nhập lại mật khẩu"
          required
          rightElement={
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className={styles.loginForm__eyeBtn}
              aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isLoading}
          rightIcon={<ArrowRight size={17} />}
        >
          Đăng ký tài khoản
        </Button>

        <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.825rem', color: 'var(--color-text-secondary, #475569)' }}>
          Đã có tài khoản doanh nghiệp?{' '}
          <Link to="/login" style={{ color: 'var(--color-primary, #2563eb)', fontWeight: 600, textDecoration: 'none' }}>
            Đăng nhập ngay
          </Link>
        </div>
      </form>
    </div>
  );
};
