import React, { useEffect } from 'react';
import { Button, Input, Modal } from '../../../components/common';
import { useSalesCatalogForm } from '../hooks/useSalesCatalogForm';
import { ISalesCatalogFormValues } from '../types/SalesCatalog.types';
import styles from './SalesCatalogManager.module.css';

interface ISalesCatalogItemFormModalProps {
  isOpen: boolean;
  isEditing: boolean;
  isSubmitting: boolean;
  error: string | null;
  initialValues: ISalesCatalogFormValues;
  onClose: () => void;
  onSubmit: (values: ISalesCatalogFormValues) => Promise<boolean>;
}

export const SalesCatalogItemFormModal: React.FC<
  ISalesCatalogItemFormModalProps
> = ({
  isOpen,
  isEditing,
  isSubmitting,
  error,
  initialValues,
  onClose,
  onSubmit,
}) => {
  const { values, nameError, codeError, resetForm, handleChange, handleSubmit } =
    useSalesCatalogForm({ initialValues, onSubmit });

  useEffect(() => {
    if (isOpen) {
      resetForm(initialValues);
    }
  }, [initialValues.code, initialValues.name, isOpen, resetForm]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Chỉnh sửa danh mục' : 'Thêm danh mục'}
      subtitle="Tên và mã danh mục được gửi đến API để kiểm tra tính hợp lệ."
      maxWidth="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button
            type="submit"
            form="sales-catalog-item-form"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            Lưu
          </Button>
        </>
      }
    >
      <form
        id="sales-catalog-item-form"
        onSubmit={(event) => void handleSubmit(event)}
        noValidate
      >
        {error && (
          <p role="alert" className={styles.salesCatalog__formError}>
            {error}
          </p>
        )}
        <Input
          label="Tên danh mục *"
          value={values.name}
          onChange={(event) => handleChange('name', event.target.value)}
          placeholder="Nhập tên danh mục"
          autoFocus
          required
          error={nameError ?? undefined}
          disabled={isSubmitting}
        />
        <Input
          label="Mã danh mục *"
          value={values.code}
          onChange={(event) => handleChange('code', event.target.value)}
          placeholder="Nhập mã danh mục"
          required
          error={codeError ?? undefined}
          disabled={isSubmitting}
        />
      </form>
    </Modal>
  );
};
