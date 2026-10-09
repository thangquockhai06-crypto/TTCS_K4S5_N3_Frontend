import { useState } from 'react';
import { changePassword } from '../services/ChangePasswordService';
import {
  ChangePasswordField,
  ChangePasswordFieldErrors,
  ChangePasswordFormValues,
  ChangePasswordSubmitState,
} from '../types/ChangePassword.types';
import { validateChangePassword } from '../utils/ValidateChangePassword';
import { showGlobalToast } from '../../../context/ToastContext';

const INITIAL_FORM_VALUES: ChangePasswordFormValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

const ALL_FIELDS_TOUCHED: Record<ChangePasswordField, boolean> = {
  currentPassword: true,
  newPassword: true,
  confirmPassword: true,
};

export function useChangePassword() {
  const [values, setValues] = useState<ChangePasswordFormValues>(INITIAL_FORM_VALUES);
  const [touched, setTouched] = useState<Partial<Record<ChangePasswordField, boolean>>>({});
  const [errors, setErrors] = useState<ChangePasswordFieldErrors>({});
  const [submitState, setSubmitState] = useState<ChangePasswordSubmitState>('idle');
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const updateField = (field: ChangePasswordField, value: string): void => {
    const nextValues = { ...values, [field]: value };
    const nextErrors = validateChangePassword(nextValues);

    setValues(nextValues);
    setErrors((previousErrors) => {
      const updatedErrors = { ...previousErrors };
      if (touched[field]) {
        updatedErrors[field] = nextErrors[field];
      }
      if (field === 'newPassword' && touched.confirmPassword) {
        updatedErrors.confirmPassword = nextErrors.confirmPassword;
      }
      return updatedErrors;
    });
    setApiError(null);
    setSuccessMessage(null);
    setSubmitState('idle');
  };

  const blurField = (field: ChangePasswordField): void => {
    const nextTouched = { ...touched, [field]: true };
    const nextErrors = validateChangePassword(values);
    setTouched(nextTouched);
    setErrors((previousErrors) => ({
      ...previousErrors,
      [field]: nextErrors[field],
      ...(field === 'newPassword' && touched.confirmPassword
        ? { confirmPassword: nextErrors.confirmPassword }
        : {}),
    }));
  };

  const submit = async (): Promise<void> => {
    const validationErrors = validateChangePassword(values);
    setTouched(ALL_FIELDS_TOUCHED);
    setErrors(validationErrors);
    setApiError(null);
    setSuccessMessage(null);

    if (Object.values(validationErrors).some(Boolean)) {
      setSubmitState('idle');
      return;
    }

    setSubmitState('submitting');
    try {
      const response = await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      setValues(INITIAL_FORM_VALUES);
      setTouched({});
      setErrors({});
      setSuccessMessage(response.message);
      showGlobalToast(response.message || 'Đổi mật khẩu thành công!', 'success');
      setSubmitState('success');
    } catch (error: unknown) {
      const errMsg =
        error instanceof Error
          ? error.message
          : 'Không thể đổi mật khẩu. Vui lòng thử lại.';
      setApiError(errMsg);
      showGlobalToast(errMsg, 'error');
      setSubmitState('api-error');
    }
  };

  return {
    values,
    errors,
    submitState,
    apiError,
    successMessage,
    updateField,
    blurField,
    submit,
  };
}