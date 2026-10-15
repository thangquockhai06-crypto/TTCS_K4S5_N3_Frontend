import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Mail, Phone, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button, Modal } from '../../../components/common';
import { ILead } from '../../lead-management/types/Lead.types';
import {
  ILeadConversionDraft,
  ILeadConversionRequest,
  ILeadConversionResponse,
  ILeadConversionValidationErrors,
} from '../types/LeadConversion.types';
import styles from '../styles/LeadConversion.module.css';

export interface ILeadConversionDialogProps {
  lead: ILead | null;
  isOpen: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  success: ILeadConversionResponse | null;
  onClose: () => void;
  onSubmit: (request: ILeadConversionRequest) => Promise<ILeadConversionResponse>;
}

function createDraftFromLead(lead: ILead | null): ILeadConversionDraft {
  return {
    companyName: lead?.company ?? '',
    taxCode: '',
    industry: 'Technology',
    companySize: '11-50',
    region: 'Hà Nội',
    contactName: lead?.fullName ?? '',
    email: lead?.email ?? '',
    phone: lead?.phone ?? '',
    leadSource: lead?.source ?? 'website',
    leadOwner: lead?.owner.name ?? '',
    notes: '',
  };
}

const DEFAULT_ERRORS: ILeadConversionValidationErrors = {};

export const LeadConversionDialog: React.FC<ILeadConversionDialogProps> = ({
  lead,
  isOpen,
  isSubmitting,
  errorMessage,
  success,
  onClose,
  onSubmit,
}) => {
  const [draft, setDraft] = useState<ILeadConversionDraft>(createDraftFromLead(lead));
  const [errors, setErrors] = useState<ILeadConversionValidationErrors>(DEFAULT_ERRORS);

  useEffect(() => {
    setDraft(createDraftFromLead(lead));
    setErrors(DEFAULT_ERRORS);
  }, [lead, isOpen]);

  const requiredErrorMap = useMemo(() => {
    const nextErrors: ILeadConversionValidationErrors = {};
    if (!draft.companyName.trim()) {
      nextErrors.companyName = 'Tên công ty là bắt buộc.';
    }
    if (!draft.contactName.trim()) {
      nextErrors.contactName = 'Tên người liên hệ là bắt buộc.';
    }
    if (!draft.email.trim()) {
      nextErrors.email = 'Email liên hệ là bắt buộc.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
      nextErrors.email = 'Email không hợp lệ.';
    }
    if (!draft.phone.trim()) {
      nextErrors.phone = 'Số điện thoại là bắt buộc.';
    }
    if (!draft.leadOwner.trim()) {
      nextErrors.leadOwner = 'Người phụ trách lead là bắt buộc.';
    }
    return nextErrors;
  }, [draft]);

  const handleFieldChange = <K extends keyof ILeadConversionDraft>(
    field: K,
    value: ILeadConversionDraft[K]
  ): void => {
    const nextDraft = { ...draft, [field]: value };
    setDraft(nextDraft);
    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const nextErrors = { ...requiredErrorMap };
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    await onSubmit({
      leadId: lead?.id ?? '',
      companyName: draft.companyName,
      taxCode: draft.taxCode,
      industry: draft.industry,
      companySize: draft.companySize,
      region: draft.region,
      contactName: draft.contactName,
      email: draft.email,
      phone: draft.phone,
      leadSource: draft.leadSource,
      leadOwner: draft.leadOwner,
      notes: draft.notes,
    });
  };

  const modalBody = success ? (
    <div className={styles.successPanel}>
      <div className={styles.successHeader}>
        <CheckCircle2 size={28} aria-hidden="true" />
        <div>
          <h3>Lead đã được chuyển đổi</h3>
          <p>Thông tin khách hàng, người liên hệ và cơ hội đã được tạo dựa trên dữ liệu lead.</p>
        </div>
      </div>

      <div className={styles.successMeta}>
        <p>
          <strong>Khách hàng:</strong> {success.customerName}
        </p>
        <p>
          <strong>Cơ hội:</strong> {success.opportunityName}
        </p>
        <p>
          <strong>Ngày chuyển đổi:</strong>{' '}
          {new Date(success.convertedAt).toLocaleString('vi-VN')}
        </p>
      </div>

      <div className={styles.successActions}>
        <Link className={styles.routeLink} to={success.customerRoute}>
          Mở khách hàng
        </Link>
        <Link className={styles.routeLink} to={success.opportunityRoute}>
          Mở cơ hội
        </Link>
      </div>

      <div className={styles.devWarning} role="alert">
        <AlertTriangle size={16} aria-hidden="true" />
        <span>{success.warning}</span>
      </div>
    </div>
  ) : (
    <form id="lead-conversion-form" className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.summaryCard}>
        <div>
          <p className={styles.summaryLabel}>Lead</p>
          <h3>{lead?.fullName ?? 'Lead không xác định'}</h3>
        </div>
        <span className={styles.summaryBadge}>{lead?.company ?? 'Công ty chưa rõ'}</span>
      </div>

      <div className={styles.formGrid}>
        <label className={styles.formField}>
          <span>Tên công ty</span>
          <input
            value={draft.companyName}
            onChange={(event) => handleFieldChange('companyName', event.target.value)}
          />
          {errors.companyName && <small>{errors.companyName}</small>}
        </label>

        <label className={styles.formField}>
          <span>Mã thuế</span>
          <input
            value={draft.taxCode}
            onChange={(event) => handleFieldChange('taxCode', event.target.value)}
          />
        </label>

        <label className={styles.formField}>
          <span>Ngành nghề</span>
          <input
            value={draft.industry}
            onChange={(event) => handleFieldChange('industry', event.target.value)}
          />
        </label>

        <label className={styles.formField}>
          <span>Quy mô công ty</span>
          <input
            value={draft.companySize}
            onChange={(event) => handleFieldChange('companySize', event.target.value)}
          />
        </label>

        <label className={styles.formField}>
          <span>Khu vực</span>
          <input
            value={draft.region}
            onChange={(event) => handleFieldChange('region', event.target.value)}
          />
        </label>

        <label className={styles.formField}>
          <span>Người liên hệ</span>
          <input
            value={draft.contactName}
            onChange={(event) => handleFieldChange('contactName', event.target.value)}
          />
          {errors.contactName && <small>{errors.contactName}</small>}
        </label>

        <label className={styles.formField}>
          <span>Email</span>
          <input
            type="email"
            value={draft.email}
            onChange={(event) => handleFieldChange('email', event.target.value)}
          />
          {errors.email && <small>{errors.email}</small>}
        </label>

        <label className={styles.formField}>
          <span>Số điện thoại</span>
          <input
            value={draft.phone}
            onChange={(event) => handleFieldChange('phone', event.target.value)}
          />
          {errors.phone && <small>{errors.phone}</small>}
        </label>

        <label className={styles.formField}>
          <span>Lead source</span>
          <input
            value={draft.leadSource}
            onChange={(event) => handleFieldChange('leadSource', event.target.value)}
          />
        </label>

        <label className={styles.formField}>
          <span>Lead owner</span>
          <input
            value={draft.leadOwner}
            onChange={(event) => handleFieldChange('leadOwner', event.target.value)}
          />
          {errors.leadOwner && <small>{errors.leadOwner}</small>}
        </label>

        <label className={`${styles.formField} ${styles['formField--wide']}`}>
          <span>Ghi chú / hoạt động</span>
          <textarea
            rows={4}
            value={draft.notes}
            onChange={(event) => handleFieldChange('notes', event.target.value)}
          />
        </label>
      </div>

      <div className={styles.contactSummary}>
        <div>
          <UserRound size={16} aria-hidden="true" />
          {draft.contactName || 'Chưa có người liên hệ'}
        </div>
        <div>
          <Mail size={16} aria-hidden="true" />
          {draft.email || 'Chưa có email'}
        </div>
        <div>
          <Phone size={16} aria-hidden="true" />
          {draft.phone || 'Chưa có số điện thoại'}
        </div>
      </div>

      {errorMessage && (
        <div className={styles.errorBanner} role="alert">
          {errorMessage}
        </div>
      )}

      <div className={styles.devWarning} role="alert">
        <AlertTriangle size={16} aria-hidden="true" />
        <span>DEVELOPMENT MOCK DATA — No real customer, contact, opportunity, or activity records have been created.</span>
      </div>
    </form>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={success ? 'Chuyển đổi thành công' : 'Xem trước chuyển đổi Lead'}
      subtitle={
        success
          ? 'Lead đã chuyển đổi sang khách hàng và cơ hội mới.'
          : 'Xác nhận thông tin được map từ Lead sang khách hàng, contact và cơ hội.'
      }
      maxWidth="lg"
      footer={
        !success ? (
          <div className={styles.footerActions}>
            <Button type="button" variant="secondary" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" form="lead-conversion-form" isLoading={isSubmitting}>
              Xác nhận chuyển đổi
            </Button>
          </div>
        ) : undefined
      }
    >
      {modalBody}
    </Modal>
  );
};
