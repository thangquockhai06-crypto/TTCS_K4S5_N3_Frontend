import React, { useEffect, useState } from 'react';
import { AlertCircle, Building, Check, UserCheck } from 'lucide-react';
import {
  CompanyScaleType,
  CompanyStatusType,
  CreateCompanyAccountDTO,
  ICompanyAccount,
  UpdateCompanyAccountDTO,
} from '../../interfaces/company-account.interface';
import { INITIAL_USERS } from '../../mock/users.mock';
import { Button, Modal } from '../common';
import styles from './CompanyAccountModal.module.css';

export interface ICompanyAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateCompanyAccountDTO | UpdateCompanyAccountDTO, ownerName: string, ownerEmail: string, ownerTeam: string) => void;
  editingAccount?: ICompanyAccount | null;
  onCheckTaxCodeUnique: (taxCode: string, excludeId?: string) => boolean;
}

const SCALE_OPTIONS: Array<{ value: CompanyScaleType; label: string }> = [
  { value: 'startup', label: 'Startup (1 - 20 nhân sự)' },
  { value: 'sme', label: 'SME / Vừa & Nhỏ (21 - 100 nhân sự)' },
  { value: 'mid_market', label: 'Mid-Market / Tầm trung (101 - 500 nhân sự)' },
  { value: 'enterprise', label: 'Enterprise / Tập đoàn lớn (500+ nhân sự)' },
];

const STATUS_OPTIONS: Array<{ value: CompanyStatusType; label: string; desc: string }> = [
  { value: 'lead', label: 'Tiềm năng', desc: 'Đang tiếp cận & tìm hiểu' },
  { value: 'negotiation', label: 'Đang giao dịch', desc: 'Đang gửi báo giá / thương thảo' },
  { value: 'customer', label: 'Khách hàng', desc: 'Đang hợp tác chính thức' },
  { value: 'churned', label: 'Ngừng hợp tác', desc: 'Đã ngừng / Hủy hợp đồng' },
];

export const CompanyAccountModal: React.FC<ICompanyAccountModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingAccount,
  onCheckTaxCodeUnique,
}) => {
  const [companyName, setCompanyName] = useState<string>('');
  const [taxCode, setTaxCode] = useState<string>('');
  const [taxCodeError, setTaxCodeError] = useState<string>('');
  const [industry, setIndustry] = useState<string>('');
  const [scale, setScale] = useState<CompanyScaleType>('sme');
  const [website, setWebsite] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [status, setStatus] = useState<CompanyStatusType>('lead');
  const [ownerId, setOwnerId] = useState<string>('');
  const [dealValueEstimate, setDealValueEstimate] = useState<number>(50000);
  const [primaryContactName, setPrimaryContactName] = useState<string>('');
  const [primaryContactPhone, setPrimaryContactPhone] = useState<string>('');
  const [primaryContactEmail, setPrimaryContactEmail] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (editingAccount) {
      setCompanyName(editingAccount.companyName);
      setTaxCode(editingAccount.taxCode);
      setTaxCodeError('');
      setIndustry(editingAccount.industry);
      setScale(editingAccount.scale);
      setWebsite(editingAccount.website);
      setAddress(editingAccount.address);
      setStatus(editingAccount.status);
      setOwnerId(editingAccount.ownerId);
      setDealValueEstimate(editingAccount.dealValueEstimate || 0);
      setPrimaryContactName(editingAccount.primaryContactName || '');
      setPrimaryContactPhone(editingAccount.primaryContactPhone || '');
      setPrimaryContactEmail(editingAccount.primaryContactEmail || '');
      setNotes(editingAccount.notes || '');
    } else {
      setCompanyName('');
      setTaxCode('');
      setTaxCodeError('');
      setIndustry('Công nghệ Thông tin & Phần mềm');
      setScale('sme');
      setWebsite('');
      setAddress('');
      setStatus('lead');
      setOwnerId(INITIAL_USERS[1]?.id || INITIAL_USERS[0]?.id || 'usr-001');
      setDealValueEstimate(50000);
      setPrimaryContactName('');
      setPrimaryContactPhone('');
      setPrimaryContactEmail('');
      setNotes('');
    }
  }, [editingAccount, isOpen]);

  const handleTaxCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTaxCode(val);

    if (val.trim()) {
      const isUnique = onCheckTaxCodeUnique(val.trim(), editingAccount?.id);
      if (!isUnique) {
        setTaxCodeError('Mã số thuế này đã tồn tại trên hệ thống. Mã số thuế phải là duy nhất.');
      } else {
        setTaxCodeError('');
      }
    } else {
      setTaxCodeError('');
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!companyName.trim()) {
      return;
    }

    if (taxCode.trim()) {
      const isUnique = onCheckTaxCodeUnique(taxCode.trim(), editingAccount?.id);
      if (!isUnique) {
        setTaxCodeError('Mã số thuế này đã tồn tại trên hệ thống. Vui lòng nhập mã số thuế duy nhất.');
        return;
      }
    }

    // Find chosen owner details
    const selectedUser = INITIAL_USERS.find((u) => u.id === ownerId) || INITIAL_USERS[0];
    const ownerName = selectedUser?.name || 'Quản Trị Viên';
    const ownerEmail = selectedUser?.email || 'admin@nexuscrm.vn';
    const ownerTeam = selectedUser?.group || 'Ban Quản trị & Vận hành Doanh thu';

    const payload: CreateCompanyAccountDTO = {
      companyName: companyName.trim(),
      taxCode: taxCode.trim(),
      industry: industry.trim() || 'Thương mại & Dịch vụ',
      scale,
      website: website.trim(),
      address: address.trim(),
      status,
      ownerId,
      dealValueEstimate: Number(dealValueEstimate) || 0,
      primaryContactName: primaryContactName.trim() || undefined,
      primaryContactPhone: primaryContactPhone.trim() || undefined,
      primaryContactEmail: primaryContactEmail.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    onSubmit(payload, ownerName, ownerEmail, ownerTeam);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingAccount ? 'Chỉnh sửa Hồ sơ Khách hàng Doanh nghiệp' : 'Thêm Hồ sơ Khách hàng Doanh nghiệp Mới'}
      subtitle="Khai báo thông tin chuẩn hóa doanh nghiệp (Tên, Mã số thuế duy nhất, Quy mô, Ngành nghề, Người sở hữu)"
    >
      <form onSubmit={handleSubmit} className={styles.companyModalForm}>
        {/* THÔNG TIN DOANH NGHIỆP */}
        <div className={styles.formSectionHeader}>
          <Building size={16} /> Thông tin Pháp lý & Định danh Doanh nghiệp
        </div>

        <div className={styles.formField}>
          <label htmlFor="company-name" className={styles.formLabel}>
            Tên Công ty / Doanh nghiệp <span className={styles.formRequired}>*</span>
          </label>
          <input
            id="company-name"
            type="text"
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="VD: Công ty Cổ phần Công nghệ Nexus SaaS"
            className={styles.formInput}
          />
        </div>

        <div className={styles.formGrid}>
          <div className={styles.formField}>
            <label htmlFor="company-taxcode" className={styles.formLabel}>
              Mã số thuế (Duy nhất) <span className={styles.formRequired}>*</span>
            </label>
            <input
              id="company-taxcode"
              type="text"
              required
              value={taxCode}
              onChange={handleTaxCodeChange}
              placeholder="VD: 0101234567 (10 hoặc 13 số)"
              className={`${styles.formInput} ${taxCodeError ? styles['formInput--error'] : ''}`}
            />
            {taxCodeError && (
              <span className={styles.formErrorText}>
                <AlertCircle size={12} /> {taxCodeError}
              </span>
            )}
          </div>

          <div className={styles.formField}>
            <label htmlFor="company-industry" className={styles.formLabel}>
              Ngành nghề kinh doanh <span className={styles.formRequired}>*</span>
            </label>
            <input
              id="company-industry"
              type="text"
              required
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="VD: Công nghệ thông tin, Bán lẻ, Logistics..."
              className={styles.formInput}
            />
          </div>
        </div>

        <div className={styles.formGrid}>
          <div className={styles.formField}>
            <label htmlFor="company-scale" className={styles.formLabel}>
              Quy mô nhân sự <span className={styles.formRequired}>*</span>
            </label>
            <select
              id="company-scale"
              value={scale}
              onChange={(e) => setScale(e.target.value as CompanyScaleType)}
              className={styles.formSelect}
            >
              {SCALE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formField}>
            <label htmlFor="company-website" className={styles.formLabel}>
              Website công ty
            </label>
            <input
              id="company-website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://company.vn"
              className={styles.formInput}
            />
          </div>
        </div>

        <div className={styles.formField}>
          <label htmlFor="company-address" className={styles.formLabel}>
            Địa chỉ trụ sở chính <span className={styles.formRequired}>*</span>
          </label>
          <input
            id="company-address"
            type="text"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="VD: Tòa nhà Bitexco, Số 2 Hải Triều, Quận 1, TP. Hồ Chí Minh"
            className={styles.formInput}
          />
        </div>

        {/* TRẠNG THÁI HỒ SƠ */}
        <div className={styles.formField}>
          <label className={styles.formLabel}>
            Trạng thái Hồ sơ Khách hàng <span className={styles.formRequired}>*</span>
          </label>
          <div className={styles.statusRadioGroup} role="radiogroup" aria-label="Trạng thái khách hàng">
            {STATUS_OPTIONS.map((st) => {
              const isSelected = status === st.value;
              return (
                <button
                  key={st.value}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`${styles.statusOption} ${
                    isSelected ? styles['statusOption--selected'] : ''
                  }`}
                  onClick={() => setStatus(st.value)}
                >
                  <span className={styles.statusOptionTitle}>
                    {isSelected && <Check size={12} style={{ display: 'inline', marginRight: '3px' }} />}
                    {st.label}
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>{st.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* PHÂN CÔNG & QUẢN LÝ DOANH SỐ */}
        <div className={styles.formSectionHeader}>
          <UserCheck size={16} /> Phân quyền Sở hữu & Đại diện Liên hệ
        </div>

        <div className={styles.formGrid}>
          <div className={styles.formField}>
            <label htmlFor="company-owner" className={styles.formLabel}>
              Nhân viên sở hữu / Phụ trách <span className={styles.formRequired}>*</span>
            </label>
            <select
              id="company-owner"
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              required
              className={styles.formSelect}
            >
              {INITIAL_USERS.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} — {u.group}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formField}>
            <label htmlFor="company-deal-value" className={styles.formLabel}>
              Doanh số dự kiến (USD / ARR)
            </label>
            <input
              id="company-deal-value"
              type="number"
              min="0"
              step="1000"
              value={dealValueEstimate}
              onChange={(e) => setDealValueEstimate(Number(e.target.value))}
              placeholder="50000"
              className={styles.formInput}
            />
          </div>
        </div>

        {/* THÔNG TIN LIÊN HỆ ĐẠI DIỆN */}
        <div className={styles.formGrid}>
          <div className={styles.formField}>
            <label htmlFor="company-contact-name" className={styles.formLabel}>
              Người liên hệ chính
            </label>
            <input
              id="company-contact-name"
              type="text"
              value={primaryContactName}
              onChange={(e) => setPrimaryContactName(e.target.value)}
              placeholder="VD: Trần Văn Nam (Giám đốc Mua hàng)"
              className={styles.formInput}
            />
          </div>

          <div className={styles.formField}>
            <label htmlFor="company-contact-phone" className={styles.formLabel}>
              Số điện thoại liên hệ
            </label>
            <input
              id="company-contact-phone"
              type="tel"
              value={primaryContactPhone}
              onChange={(e) => setPrimaryContactPhone(e.target.value)}
              placeholder="VD: 0901234567"
              className={styles.formInput}
            />
          </div>
        </div>

        <div className={styles.formField}>
          <label htmlFor="company-notes" className={styles.formLabel}>
            Ghi chú nội bộ về tài khoản doanh nghiệp
          </label>
          <textarea
            id="company-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Nhu cầu triển khai, giai đoạn tiếp cận, lưu ý đối thủ cạnh tranh..."
            className={styles.formTextarea}
          />
        </div>

        <div className={styles.formActions}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Hủy bỏ
          </Button>
          <Button type="submit" variant="primary" disabled={!!taxCodeError}>
            {editingAccount ? 'Lưu Thay đổi' : 'Tạo Hồ sơ Doanh nghiệp'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
