import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button, Input } from '../components/common';
import { CustomSelect, ICustomSelectOption } from '../components/common/CustomSelect';
import { useLeadCapture } from '../hooks/useLeadCapture';
import { LeadInterestType } from '../interfaces/lead-capture.interface';
import styles from './PublicLeadFormPage.module.css';

const INTEREST_OPTIONS: ICustomSelectOption<LeadInterestType>[] = [
  { value: 'crm_consultation', label: 'Tư vấn CRM Doanh nghiệp' },
  { value: 'enterprise_pricing', label: 'Báo giá Gói Enterprise' },
  { value: 'system_integration', label: 'Tích hợp API Webhook' },
  { value: 'product_demo', label: 'Trải nghiệm Bản Demo' },
  { value: 'partnership', label: 'Hợp tác Đại lý & Đối tác' },
  { value: 'other', label: 'Yêu cầu tùy chỉnh khác' },
];

export const PublicLeadFormPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { config, submitLead } = useLeadCapture();

  const sourceFromUrl = searchParams.get('source') || config.leadSource;
  const formIdFromUrl = searchParams.get('formId') || config.id;

  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [company, setCompany] = useState<string>('');
  const [interest, setInterest] = useState<LeadInterestType>('crm_consultation');
  const [notes, setNotes] = useState<string>('');
  const [honeypot, setHoneypot] = useState<string>('');

  const [fullNameError, setFullNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [companyError, setCompanyError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();

    let hasError = false;
    if (!fullName.trim() || fullName.trim().length < 2) {
      setFullNameError('Vui lòng nhập họ và tên của bạn.');
      hasError = true;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setEmailError('Vui lòng nhập địa chỉ email hợp lệ.');
      hasError = true;
    }
    const phoneRegex = /^[0-9+() -]{9,15}$/;
    if (!phone.trim() || !phoneRegex.test(phone.trim())) {
      setPhoneError('Vui lòng nhập số điện thoại hợp lệ.');
      hasError = true;
    }
    if (!company.trim()) {
      setCompanyError('Vui lòng nhập tên công ty / doanh nghiệp.');
      hasError = true;
    }

    if (hasError) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const result = submitLead({
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      company: company.trim(),
      interest,
      notes: notes.trim() || undefined,
      formId: formIdFromUrl,
      leadSource: sourceFromUrl,
      honeypotValue: honeypot,
    });

    setIsSubmitting(false);

    if (result.success) {
      setIsSubmitted(true);
    } else {
      setSubmitError(result.message || 'Gửi thất bại.');
    }
  };

  return (
    <div className={styles.embedPageContainer}>
      <div className={styles.formCard}>
        {isSubmitted ? (
          <div className={styles.successCard}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(22, 163, 74, 0.12)',
                color: '#16A34A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle2 size={36} />
            </div>
            <h2 className={styles.successTitle}>Gửi Yêu Cầu Thành Công!</h2>
            <p className={styles.successMessage}>
              {config.successMessage ||
                'Cảm ơn bạn! Thông tin đã được gửi đến chuyên viên tư vấn NexusCRM. Chúng tôi sẽ liên hệ trong ít phút.'}
            </p>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => {
                setIsSubmitted(false);
                setFullName('');
                setEmail('');
                setPhone('');
                setCompany('');
                setNotes('');
              }}
            >
              Gửi Yêu Cầu Khác
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className={styles.formHeader}>
              <h1 className={styles.formTitle}>{config.formTitle}</h1>
              <p className={styles.formSubtitle}>{config.formDescription}</p>
            </div>

            {submitError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(220, 38, 38, 0.1)',
                  color: '#DC2626',
                  fontSize: '0.84rem',
                  marginTop: '16px',
                }}
              >
                <AlertCircle size={16} />
                <span>{submitError}</span>
              </div>
            )}

            {/* Hidden Honeypot trap */}
            <input
              type="text"
              name="honeypot_field"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className={styles.honeypotField}
              aria-hidden="true"
            />

            <div className={styles.formGrid} style={{ marginTop: '20px' }}>
              <Input
                label="Họ và tên của bạn"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (fullNameError) setFullNameError(null);
                }}
                error={fullNameError || undefined}
                placeholder="Ví dụ: Lê Hoàng Long"
                required
              />

              <Input
                label="Công ty / Doanh nghiệp"
                value={company}
                onChange={(e) => {
                  setCompany(e.target.value);
                  if (companyError) setCompanyError(null);
                }}
                error={companyError || undefined}
                placeholder="Ví dụ: VietTech Solutions JSC"
                required
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Input
                  label="Email doanh nghiệp"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError(null);
                  }}
                  error={emailError || undefined}
                  placeholder="long.le@viettech.vn"
                  required
                />
                <Input
                  label="Số điện thoại"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (phoneError) setPhoneError(null);
                  }}
                  error={phoneError || undefined}
                  placeholder="0912 345 678"
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-main, #0F172A)' }}>
                  Nhu cầu quan tâm
                </label>
                <CustomSelect
                  options={INTEREST_OPTIONS}
                  value={interest}
                  onChange={(val) => setInterest(val as LeadInterestType)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-main, #0F172A)' }}>
                  Ghi chú hoặc yêu cầu tùy chỉnh
                </label>
                <textarea
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border, #CBD5E1)',
                    backgroundColor: 'var(--color-bg-card, #FFFFFF)',
                    color: 'var(--color-text-main, #0F172A)',
                    fontSize: '0.86rem',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    minHeight: '64px',
                  }}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Nhập quy mô người dùng hoặc yêu cầu tích hợp..."
                  rows={2}
                />
              </div>

              <div style={{ marginTop: '6px' }}>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={isSubmitting}
                  leftIcon={<Send size={18} />}
                >
                  {isSubmitting ? 'Đang Gửi Yêu Cầu...' : config.ctaText || 'Gửi Yêu Cầu Tư Vấn Ngay'}
                </Button>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '0.74rem',
                  color: 'var(--color-text-muted, #64748B)',
                  marginTop: '4px',
                }}
              >
                <ShieldCheck size={14} color="#16A34A" />
                <span>Bảo vệ chống spam tự động bởi Honeypot &amp; NexusCRM Security</span>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
