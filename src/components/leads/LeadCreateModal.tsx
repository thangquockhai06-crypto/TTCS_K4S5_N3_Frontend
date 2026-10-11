import React, { useState } from 'react';
import { CreditCard, Info } from 'lucide-react';
import { Button, Input, Modal } from '../common';
import { CustomSelect, ICustomSelectOption } from '../common/CustomSelect';
import { useLeadCapture } from '../../hooks/useLeadCapture';
import {
  ICreateManualLeadDTO,
  LeadInterestType,
} from '../../interfaces/lead-capture.interface';
import styles from './LeadCreateModal.module.css';

export interface ILeadCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  formId?: string;
}

const INTEREST_OPTIONS: ICustomSelectOption<LeadInterestType>[] = [
  { value: 'crm_consultation', label: 'Tư vấn CRM Doanh nghiệp' },
  { value: 'enterprise_pricing', label: 'Báo giá Gói Enterprise' },
  { value: 'system_integration', label: 'Tích hợp API Webhook' },
  { value: 'product_demo', label: 'Trải nghiệm Bản Demo' },
  { value: 'partnership', label: 'Hợp tác Đại lý & Đối tác' },
  { value: 'other', label: 'Yêu cầu tùy chỉnh khác' },
];

const PRESET_SOURCE_OPTIONS: ICustomSelectOption<string>[] = [
  { value: 'Hội thảo Công nghệ TechExpo', label: 'Hội thảo Công nghệ TechExpo' },
  { value: 'Sự kiện Kết nối Đối tác B2B', label: 'Sự kiện Kết nối Đối tác B2B' },
  { value: 'Danh thiếp Trực tiếp (Card Visit)', label: 'Danh thiếp Trực tiếp (Card Visit)' },
  { value: 'Triển lãm Thương mại Quốc tế', label: 'Triển lãm Thương mại Quốc tế' },
  { value: 'Giới thiệu từ Đối tác', label: 'Giới thiệu từ Đối tác' },
  { value: 'custom', label: 'Nguồn khác (Nhập tùy chỉnh)...' },
];

export const LeadCreateModal: React.FC<ILeadCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  formId,
}) => {
  const { createManualLead } = useLeadCapture();

  // Form states
  const [fullName, setFullName] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [company, setCompany] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [sourceType, setSourceType] = useState<string>('Hội thảo Công nghệ TechExpo');
  const [customSource, setCustomSource] = useState<string>('');
  const [interest, setInterest] = useState<LeadInterestType>('crm_consultation');
  const [notes, setNotes] = useState<string>('');

  // Validation error states (real-time error message directly under input)
  const [fullNameError, setFullNameError] = useState<string | null>(null);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [sourceError, setSourceError] = useState<string | null>(null);

  // Helper to determine effective lead source
  const getEffectiveSource = (): string => {
    if (sourceType === 'custom') {
      return customSource.trim();
    }
    return sourceType.trim();
  };

  // Real-time validation handlers
  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const val = e.target.value;
    setFullName(val);
    if (!val.trim()) {
      setFullNameError('Vui lòng nhập họ và tên của khách hàng.');
    } else if (val.trim().length < 2) {
      setFullNameError('Họ và tên phải có ít nhất 2 ký tự.');
    } else {
      setFullNameError(null);
    }
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setRole(e.target.value);
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const val = e.target.value;
    setCompany(val);
    if (!val.trim()) {
      setCompanyError('Vui lòng nhập tên công ty / doanh nghiệp.');
    } else {
      setCompanyError(null);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const val = e.target.value;
    setEmail(val);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!val.trim()) {
      setEmailError('Vui lòng nhập email liên hệ.');
    } else if (!emailRegex.test(val.trim())) {
      setEmailError('Định dạng email không hợp lệ (ví dụ: contact@company.com).');
    } else {
      setEmailError(null);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const val = e.target.value;
    setPhone(val);
    const phoneRegex = /^[0-9+() -]{9,15}$/;
    if (!val.trim()) {
      setPhoneError('Vui lòng nhập số điện thoại liên hệ.');
    } else if (!phoneRegex.test(val.trim())) {
      setPhoneError('Số điện thoại không hợp lệ (từ 9 đến 15 chữ số).');
    } else {
      setPhoneError(null);
    }
  };

  const handleSourceTypeChange = (val: string): void => {
    setSourceType(val);
    if (val === 'custom') {
      if (!customSource.trim()) {
        setSourceError('Mọi lead nhập vào đều bắt buộc phải có nguồn. Vui lòng nhập nguồn.');
      } else {
        setSourceError(null);
      }
    } else {
      setSourceError(null);
    }
  };

  const handleCustomSourceChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const val = e.target.value;
    setCustomSource(val);
    if (!val.trim()) {
      setSourceError('Mọi lead nhập vào đều bắt buộc phải có nguồn. Vui lòng nhập tên nguồn.');
    } else {
      setSourceError(null);
    }
  };

  const resetForm = (): void => {
    setFullName('');
    setRole('');
    setCompany('');
    setEmail('');
    setPhone('');
    setSourceType('Hội thảo Công nghệ TechExpo');
    setCustomSource('');
    setInterest('crm_consultation');
    setNotes('');
    setFullNameError(null);
    setCompanyError(null);
    setEmailError(null);
    setPhoneError(null);
    setSourceError(null);
  };

  const handleClose = (): void => {
    resetForm();
    onClose();
  };

  // Form submission handler
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();

    let hasError = false;

    // Validate Full Name
    if (!fullName.trim() || fullName.trim().length < 2) {
      setFullNameError('Vui lòng nhập họ và tên hợp lệ (tối thiểu 2 ký tự).');
      hasError = true;
    }

    // Validate Company
    if (!company.trim()) {
      setCompanyError('Vui lòng nhập tên công ty / doanh nghiệp.');
      hasError = true;
    }

    // Validate Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setEmailError('Vui lòng nhập email liên hệ hợp lệ.');
      hasError = true;
    }

    // Validate Phone
    const phoneRegex = /^[0-9+() -]{9,15}$/;
    if (!phone.trim() || !phoneRegex.test(phone.trim())) {
      setPhoneError('Vui lòng nhập số điện thoại hợp lệ (9-15 chữ số).');
      hasError = true;
    }

    // Mandatory: Lead source must not be empty
    const effectiveSource = getEffectiveSource();
    if (!effectiveSource) {
      setSourceError('Mọi lead nhập vào đều bắt buộc phải có nguồn. Vui lòng chọn hoặc nhập nguồn lead.');
      hasError = true;
    }

    if (hasError) return;

    const leadDTO: ICreateManualLeadDTO = {
      fullName: fullName.trim(),
      role: role.trim() || undefined,
      company: company.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      leadSource: effectiveSource,
      interest,
      notes: notes.trim() || undefined,
    };

    const result = createManualLead(leadDTO, formId);
    if (result.success) {
      resetForm();
      onClose();
      onSuccess?.();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Tạo Lead Thủ Công (Card Visit / Sự Kiện)"
      subtitle="Nhập nhanh thông tin từ danh thiếp hoặc gặp gỡ trực tiếp tại hội thảo"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className={styles.modalContent}>
        {/* Notice rule box */}
        <div className={styles.noticeBox}>
          <Info size={17} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>
            <strong>Quy định hệ thống:</strong> Mọi lead nhập vào đều bắt buộc phải có nguồn rõ ràng để phân loại và theo dõi hành trình chuyển đổi trong CRM.
          </span>
        </div>

        <div className={styles.formGrid}>
          {/* Họ và tên */}
          <div className={styles.fieldGroup}>
            <Input
              label="Họ và tên khách hàng"
              value={fullName}
              onChange={handleFullNameChange}
              error={fullNameError || undefined}
              placeholder="Ví dụ: Nguyễn Văn Hải"
              required
            />
          </div>

          {/* Chức danh / Vị trí */}
          <div className={styles.fieldGroup}>
            <Input
              label="Chức danh / Vị trí (Từ danh thiếp)"
              value={role}
              onChange={handleRoleChange}
              placeholder="Ví dụ: Giám đốc công nghệ (CTO)"
            />
          </div>

          {/* Công ty / Doanh nghiệp */}
          <div className={styles.fieldGroup}>
            <Input
              label="Tên công ty / Doanh nghiệp"
              value={company}
              onChange={handleCompanyChange}
              error={companyError || undefined}
              placeholder="Ví dụ: An Phát Logistics JSC"
              required
            />
          </div>

          {/* Số điện thoại */}
          <div className={styles.fieldGroup}>
            <Input
              label="Số điện thoại"
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              error={phoneError || undefined}
              placeholder="Ví dụ: 0987 654 321"
              required
            />
          </div>

          {/* Email */}
          <div className={styles.fieldGroup}>
            <Input
              label="Email liên hệ"
              type="email"
              value={email}
              onChange={handleEmailChange}
              error={emailError || undefined}
              placeholder="Ví dụ: hai.nguyen@anphat.com"
              required
            />
          </div>

          {/* Nhu cầu quan tâm */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              Nhu cầu quan tâm
            </label>
            <CustomSelect
              options={INTEREST_OPTIONS}
              value={interest}
              onChange={(val) => setInterest(val as LeadInterestType)}
            />
          </div>

          {/* Nguồn Lead - BẮT BUỘC */}
          <div className={styles.fullWidth}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                Nguồn Lead <span className={styles.requiredAsterisk}>* (Bắt buộc)</span>
              </label>
              <CustomSelect
                options={PRESET_SOURCE_OPTIONS}
                value={sourceType}
                onChange={handleSourceTypeChange}
              />

              {sourceType === 'custom' && (
                <div style={{ marginTop: '8px' }}>
                  <Input
                    label="Nhập tên nguồn lead tùy chỉnh"
                    value={customSource}
                    onChange={handleCustomSourceChange}
                    error={sourceError || undefined}
                    placeholder="Ví dụ: Hội thảo Chuyển đổi số 2026..."
                    required
                  />
                </div>
              )}

              {sourceType !== 'custom' && sourceError && (
                <span className={styles.fieldError}>{sourceError}</span>
              )}
            </div>
          </div>

          {/* Ghi chú nhanh từ Card Visit */}
          <div className={styles.fullWidth}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                Ghi chú nhanh từ Card Visit / Hội thảo
              </label>
              <textarea
                className={styles.textarea}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ví dụ: Gặp gỡ tại gian hàng B05. Quan tâm gói Enterprise cho 50 người dùng, đề nghị gửi báo giá trong tuần tới..."
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Modal actions footer */}
        <div className={styles.modalFooter}>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleClose}
          >
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            leftIcon={<CreditCard size={16} />}
          >
            Tạo &amp; Lưu Vào CRM
          </Button>
        </div>
      </form>
    </Modal>
  );
};
