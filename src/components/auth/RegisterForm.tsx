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
import styles from './RegisterForm.module.css';

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

  const getPasswordStrength = (pass: string): { label: string; color: string; percent: number } => {
    if (!pass) {
      return { label: 'Chưa nhập', color: '#94a3b8', percent: 0 };
    }
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) {
      return { label: 'Yếu', color: '#ef4444', percent: 33 };
    }
    if (score <= 3) {
      return { label: 'Trung bình', color: '#f59e0b', percent: 66 };
    }
    return { label: 'Rất mạnh', color: '#10b981', percent: 100 };
  };

  const strength = getPasswordStrength(formData.password);

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
        if (!trimmed) return 'Vui lòng nhập tên doanh nghiệp / tổ chức.';
        if (trimmed.length < 2) return 'Tên doanh nghiệp phải có ít nhất 2 ký tự.';
        return undefined;
      case 'password':
        if (!value) return 'Vui lòng nhập mật khẩu.';
        if (value.length < 8) return 'Mật khẩu phải có tối thiểu 8 ký tự.';
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
      setSubmitError('Vui lòng nhập đúng email/mật khẩu và điền đủ các trường bắt buộc.');
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
    <div className={styles.registerCard}>
      <div className={styles.registerCard__header}>
        <h2 className={styles.registerCard__title}>Đăng ký tài khoản</h2>
        <p className={styles.registerCard__subtitle}>
          Tạo tài khoản quản trị mới để bắt đầu sử dụng NexusCRM.
        </p>
      </div>

      {submitError && (
        <div className={styles.errorAlert} role="alert">
          <AlertTriangle size={16} />
          <span>{submitError}</span>
        </div>
      )}

      <form className={styles.form} onSubmit={(e) => void handleSubmit(e)} noValidate>
        <div className={styles.grid2}>
          <Input
            label="Họ và tên *"
            type="text"
            value={formData.fullName}
            onChange={(e) => handleFieldChange('fullName', e.target.value)}
            error={errors.fullName}
            leftIcon={<User size={16} />}
            placeholder="VD: Trần Minh Hoàn"
            required
          />

          <Input
            label="Email công việc *"
            type="email"
            value={formData.email}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            error={errors.email}
            leftIcon={<Mail size={16} />}
            placeholder="hoang.tran@congty."
            required
          />
        </div>

        <Input
          label="Tên doanh nghiệp / Tổ chức *"
          type="text"
          value={formData.companyName}
          onChange={(e) => handleFieldChange('companyName', e.target.value)}
          error={errors.companyName}
          leftIcon={<Building2 size={16} />}
          placeholder="VD: Công ty Công nghệ Nexus"
          required
        />

        <div className={styles.grid2}>
          <Input
            label="Mật khẩu *"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => handleFieldChange('password', e.target.value)}
            error={errors.password}
            leftIcon={<Lock size={16} />}
            placeholder="Tối thiểu 8 ký tự"
            required
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className={styles.eyeBtn}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            }
          />

          <Input
            label="Xác nhận mật khẩu *"
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
                className={styles.eyeBtn}
                aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showConfirmPassword ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            }
          />
        </div>

        <div className={styles.strengthBox}>
          <div className={styles.strengthBox__row}>
            <span>Độ an toàn mật khẩu:</span>
            <strong style={{ color: strength.color, fontWeight: 600 }}>{strength.label}</strong>
          </div>
          {strength.percent > 0 && (
            <div className={styles.strengthBox__track}>
              <div
                className={styles.strengthBox__fill}
                style={{ width: `${strength.percent}%`, backgroundColor: strength.color }}
              />
            </div>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isLoading}
          rightIcon={<ArrowRight size={17} />}
        >
          Hoàn tất Đăng ký & Truy cập
        </Button>

        <div className={styles.switchRow}>
          <span>Đã có tài khoản?</span>{' '}
          <Link to="/login" className={styles.switchLink}>
            Đăng nhập ngay!
          </Link>
        </div>
      </form>
    </div>
  );
};
