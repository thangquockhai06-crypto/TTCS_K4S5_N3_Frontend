import React, { useEffect, useState } from 'react';
import { Button, Modal } from '../../../components/common';
import styles from '../styles/LeadManagement.module.css';

export interface ISaveLeadFilterDialogProps {
  isOpen: boolean;
  initialName: string;
  isRename: boolean;
  error: string | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<boolean>;
}

export const SaveLeadFilterDialog: React.FC<ISaveLeadFilterDialogProps> = ({
  isOpen,
  initialName,
  isRename,
  error,
  isSubmitting,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(initialName);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setValidationError(null);
    }
  }, [isOpen, initialName]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const normalizedName = name.trim();
    if (!normalizedName) {
      setValidationError('Nhập tên bộ lọc trước khi lưu.');
      return;
    }
    setValidationError(null);
    if (await onSave(normalizedName)) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isRename ? 'Đổi tên bộ lọc' : 'Lưu bộ lọc Lead'}
      subtitle={
        isRename
          ? 'Tên bộ lọc phải khác các bộ lọc đã lưu.'
          : 'Lưu các điều kiện đang áp dụng trong phiên hiện tại.'
      }
      maxWidth="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button variant="primary" type="submit" form="save-lead-filter-form" isLoading={isSubmitting}>
            {isRename ? 'Cập nhật tên' : 'Lưu bộ lọc'}
          </Button>
        </>
      }
    >
      <form id="save-lead-filter-form" className={styles.saveForm} onSubmit={handleSubmit}>
        <label htmlFor="lead-filter-name">Tên bộ lọc</label>
        <input
          id="lead-filter-name"
          type="text"
          maxLength={60}
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoFocus
          aria-invalid={Boolean(validationError || error)}
          aria-describedby={validationError || error ? 'lead-filter-name-error' : undefined}
        />
        {(validationError || error) && (
          <p className={styles.inlineError} id="lead-filter-name-error" role="alert">
            {validationError ?? error}
          </p>
        )}
      </form>
    </Modal>
  );
};
