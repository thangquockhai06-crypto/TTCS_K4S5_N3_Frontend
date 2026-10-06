import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  Mail,
  Sparkles,
  User,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { IRegisterPayload } from '../../interfaces';
import { Button, Input } from '../common';
import { SocialPhoneAuthSection } from './SocialPhoneAuthSection';
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
  const navigate = useNavigate();

  const [formData, setFormData] = useState<IRegisterPayload>({
    fullName: '',
    email: '',
    companyName: '',
    roleTitle: 'Chuyên viên Kinh doanh',
    password: '',
    confirmPassword: '',
  });

  const [showPass, setShowPass] = useState<boolean>(false);
  const [errors, setErrors] = useState<IRegisterFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validateSingle = (
    field: keyof IRegisterPayload,
    value: string,
    currentPassword = formData.password
  ): string | undefined => {
    const trimmed = value.trim();
    switch (field) {
      case 'fullName':
        if (trimmed.length < 3) return 'Họ và tên phải có ít nhất 3 ký tự.';
        return undefined;
      case 'email':
        if (!trimmed) return 'Vui lòng nhập địa chỉ email.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
          return 'Địa chỉ email không đúng định dạng.';
        }
        return undefined;
      case 'companyName':
        if (trimmed.length < 2) return 'Vui lòng nhập tên công ty hoặc tổ chức.';
        return undefined;
      case 'password':
        if (value.length < 8) return 'Mật khẩu phải có từ 8 ký tự trở lên.';
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
      const errMsg = validateSingle(field, value, next.password);
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

  const passwordStrength = useMemo(() => {
    const p = formData.password;
    if (!p) return { score: 0, label: 'Chưa nhập', color: '#94A3B8' };
    let score = 0;
    if (p.length >= 8) score += 1;
    if (/[A-Z]/.test(p)) score += 1;
    if (/[0-9]/.test(p)) score += 1;
    if (/[^A-Za-z0-9]/.test(p)) score += 1;

    if (score <= 1) return { score: 25, label: 'Yếu', color: '#EF4444' };
    if (score === 2) return { score: 50, label: 'Trung bình', color: '#F59E0B' };
    if (score === 3) return { score: 75, label: 'Mạnh', color: '#3B82F6' };
    return { score: 100, label: 'Rất mạnh', color: '#10B981' };
  }, [formData.password]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const nextErrors: IRegisterFieldErrors = {
      fullName: validateSingle('fullName', formData.fullName),
      email: validateSingle('email', formData.email),
      companyName: validateSingle('companyName', formData.companyName),
      password: validateSingle('password', formData.password),
      confirmPassword: validateSingle(
        'confirmPassword',
        formData.confirmPassword,
        formData.password
      ),
    };
    setErrors(nextErrors);

    if (Object.values(nextErrors).some((msg) => Boolean(msg))) {
      return;
    }

    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err: unknown) {
      let serverMsg: string | undefined;
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as {
          response?: { status?: number; data?: { detail?: string; message?: string } };
        };
        serverMsg = axiosErr.response?.data?.detail || axiosErr.response?.data?.message;
      } else if (err && typeof err === 'object' && 'message' in err) {
        const errObj = err as { message?: string };
        if (errObj.message?.includes('Network Error') || errObj.message?.includes('ERR_CONNECTION_REFUSED')) {
          serverMsg = 'Chưa bật máy chủ Backend (http://localhost:8000). Vui lòng chạy start-server.bat trước.';
        }
      }

      if (serverMsg) {
        setSubmitError(serverMsg);
      } else if (err instanceof Error && err.message === 'EMAIL_ALREADY_EXISTS') {
        setSubmitError(
          'Địa chỉ email này đã được đăng ký. Vui lòng chuyển sang trang Đăng nhập.'
        );
      } else {
        setSubmitError(
          'Không thể kết nối máy chủ Backend tại http://localhost:8000. Vui lòng kiểm tra xem Backend đã khởi chạy chưa.'
        );
      }
    }
  };

  return (
    <motion.div
      className={styles.registerCard}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32 }}
    >
      <div className={styles.registerCard__header}>
        <div className={styles.registerCard__badge}>
          <Sparkles size={13} />
          <span>KHỞI TẠO KHÔNG GIAN LÀM VIỆC MỚI</span>
        </div>
        <h1 className={styles.registerCard__title}>Đăng ký tài khoản</h1>
        <p className={styles.registerCard__subtitle}>
          Tạo tài khoản quản trị mới để quản lý khách hàng, phễu doanh thu và hợp đồng doanh nghiệp.
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
            value={formData.fullName}
            onChange={(e) => handleFieldChange('fullName', e.target.value)}
            error={errors.fullName}
            isValid={formData.fullName.trim().length >= 3 && !errors.fullName}
            leftIcon={<User size={16} />}
            placeholder="VD: Trần Minh Hoàng"
          />

          <Input
            label="Email công việc *"
            type="email"
            value={formData.email}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            error={errors.email}
            isValid={formData.email.includes('@') && !errors.email}
            leftIcon={<Mail size={16} />}
            placeholder="hoang.tran@congty.vn"
          />
        </div>

        <div>
          <Input
            label="Tên doanh nghiệp / Tổ chức *"
            value={formData.companyName}
            onChange={(e) => handleFieldChange('companyName', e.target.value)}
            error={errors.companyName}
            isValid={formData.companyName.trim().length >= 2 && !errors.companyName}
            leftIcon={<Building2 size={16} />}
            placeholder="VD: Công ty Công nghệ Nexus"
          />
        </div>

        <div className={styles.grid2}>
          <Input
            label="Mật khẩu *"
            type={showPass ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => handleFieldChange('password', e.target.value)}
            error={errors.password}
            isValid={formData.password.length >= 8 && !errors.password}
            leftIcon={<Lock size={16} />}
            placeholder="Tối thiểu 8 ký tự"
            rightElement={
              <button
                type="button"
                onClick={() => setShowPass((prev) => !prev)}
                className={styles.eyeBtn}
                aria-label={showPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            }
          />

          <Input
            label="Xác nhận mật khẩu *"
            type={showPass ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
            error={errors.confirmPassword}
            isValid={
              formData.confirmPassword.length >= 8 &&
              formData.confirmPassword === formData.password
            }
            leftIcon={<Lock size={16} />}
            placeholder="Nhập lại mật khẩu"
          />
        </div>

        {/* Thanh đo độ mạnh mật khẩu */}
        <div className={styles.strengthBox}>
          <div className={styles.strengthBox__row}>
            <span>Độ an toàn mật khẩu:</span>
            <strong style={{ color: passwordStrength.color }}>
              {passwordStrength.label}
            </strong>
          </div>
          <div className={styles.strengthBox__track}>
            <div
              className={styles.strengthBox__fill}
              style={{
                width: `${passwordStrength.score}%`,
                backgroundColor: passwordStrength.color,
              }}
            />
          </div>
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
      </form>

      <SocialPhoneAuthSection mode="register" />

      <div className={styles.switchRow}>
        <span>Đã có tài khoản trên hệ thống?</span>
        <Link to="/login" className={styles.switchLink}>
          <LogIn size={14} />
          Quay lại Đăng nhập
        </Link>
      </div>
    </motion.div>
  );
};
