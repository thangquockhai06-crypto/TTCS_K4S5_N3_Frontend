import React, { useState } from 'react';
import { Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { Button, Card, Input } from '../../../components/common';
import { ChangePasswordField } from '../types/ChangePassword.types';
import { useChangePassword } from '../hooks/useChangePassword';
import styles from './ChangePasswordForm.module.css';

export const ChangePasswordForm: React.FC = () => {
  const {
    values,
    errors,
    submitState,
    apiError,
    successMessage,
    updateField,
    blurField,
    submit,
  } = useChangePassword();
  const [visibleFields, setVisibleFields] = useState<Record<ChangePasswordField, boolean>>({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const toggleVisibility = (field: ChangePasswordField): void => {
    setVisibleFields((previous) => ({ ...previous, [field]: !previous[field] }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    void submit();
  };

  return (
    <Card padding="lg" className={styles.changePassword}>
      <header className={styles.changePassword__header}>
        <div className={styles.changePassword__icon} aria-hidden="true">
          <LockKeyhole size={18} />
        </div>
        <div>
          <h2 className={styles.changePassword__title}>Đổi mật khẩu</h2>
          <p className={styles.changePassword__description}>
            Xác nhận mật khẩu hiện tại để cập nhật mật khẩu tài khoản.
          </p>
        </div>
      </header>

      {apiError && (
        <div className={styles.changePassword__feedback} role="alert">
          {apiError}
        </div>
      )}
      {successMessage && (
        <div
          className={`${styles.changePassword__feedback} ${styles['changePassword__feedback--success']}`}
          role="status"
        >
          {successMessage}
        </div>
      )}

      <form className={styles.changePassword__form} onSubmit={handleSubmit} noValidate>
        <Input
          label="Mật khẩu hiện tại"
          type={visibleFields.currentPassword ? 'text' : 'password'}
          autoComplete="current-password"
          disabled={submitState === 'submitting'}
          value={values.currentPassword}
          onChange={(event) => updateField('currentPassword', event.target.value)}
          onBlur={() => blurField('currentPassword')}
          error={errors.currentPassword}
          leftIcon={<LockKeyhole size={16} />}
          rightElement={
            <button
              type="button"
              className={styles.changePassword__visibilityButton}
              onClick={() => toggleVisibility('currentPassword')}
              aria-label={visibleFields.currentPassword ? 'Ẩn mật khẩu hiện tại' : 'Hiện mật khẩu hiện tại'}
              aria-pressed={visibleFields.currentPassword}
            >
              {visibleFields.currentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        <Input
          label="Mật khẩu mới"
          type={visibleFields.newPassword ? 'text' : 'password'}
          autoComplete="new-password"
          disabled={submitState === 'submitting'}
          value={values.newPassword}
          onChange={(event) => updateField('newPassword', event.target.value)}
          onBlur={() => blurField('newPassword')}
          error={errors.newPassword}
          helperText="Tối thiểu 8 ký tự, gồm ít nhất một chữ cái và một chữ số."
          leftIcon={<LockKeyhole size={16} />}
          rightElement={
            <button
              type="button"
              className={styles.changePassword__visibilityButton}
              onClick={() => toggleVisibility('newPassword')}
              aria-label={visibleFields.newPassword ? 'Ẩn mật khẩu mới' : 'Hiện mật khẩu mới'}
              aria-pressed={visibleFields.newPassword}
            >
              {visibleFields.newPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        <Input
          label="Xác nhận mật khẩu mới"
          type={visibleFields.confirmPassword ? 'text' : 'password'}
          autoComplete="new-password"
          disabled={submitState === 'submitting'}
          value={values.confirmPassword}
          onChange={(event) => updateField('confirmPassword', event.target.value)}
          onBlur={() => blurField('confirmPassword')}
          error={errors.confirmPassword}
          leftIcon={<LockKeyhole size={16} />}
          rightElement={
            <button
              type="button"
              className={styles.changePassword__visibilityButton}
              onClick={() => toggleVisibility('confirmPassword')}
              aria-label={visibleFields.confirmPassword ? 'Ẩn mật khẩu xác nhận' : 'Hiện mật khẩu xác nhận'}
              aria-pressed={visibleFields.confirmPassword}
            >
              {visibleFields.confirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        <div className={styles.changePassword__actions}>
          <Button
            type="submit"
            variant="primary"
            isLoading={submitState === 'submitting'}
            disabled={submitState === 'submitting'}
            leftIcon={<LockKeyhole size={16} />}
          >
            Cập nhật mật khẩu
          </Button>
        </div>
      </form>
    </Card>
  );
};