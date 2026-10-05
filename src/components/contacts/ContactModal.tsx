import React, { useEffect, useState } from 'react';
import { Crown, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  ContactRoleType,
  CreateContactDTO,
  IContact,
  InfluenceLevelType,
  UpdateContactDTO,
} from '../../interfaces/contact.interface';
import { ICustomer } from '../../interfaces/customer.interface';
import { Button, Modal } from '../common';
import styles from './ContactModal.module.css';

export interface IContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateContactDTO | UpdateContactDTO) => void;
  customers: ICustomer[];
  editingContact?: IContact | null;
  defaultCustomerId?: string;
}

const ROLES_INFO: Array<{
  role: ContactRoleType;
  title: string;
  desc: string;
  icon: React.ReactNode;
}> = [
  {
    role: 'decision_maker',
    title: 'Người quyết định',
    desc: 'Có quyền ký kết hợp đồng, duyệt ngân sách',
    icon: <Crown size={15} color="#7e22ce" />,
  },
  {
    role: 'influencer',
    title: 'Người ảnh hưởng',
    desc: 'Tham mưu kỹ thuật, chuyên môn và tư vấn lãnh đạo',
    icon: <Sparkles size={15} color="#1d4ed8" />,
  },
  {
    role: 'end_user',
    title: 'Người dùng cuối',
    desc: 'Trực tiếp thao tác và vận hành hệ thống',
    icon: <CheckCircle2 size={15} color="#047857" />,
  },
  {
    role: 'blocker',
    title: 'Người cản trở',
    desc: 'Có thể phản đối, nghi ngại về rủi ro, bảo mật, chi phí',
    icon: <AlertCircle size={15} color="#be123c" />,
  },
];

export const ContactModal: React.FC<IContactModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  customers,
  editingContact,
  defaultCustomerId,
}) => {
  const [customerId, setCustomerId] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [jobTitle, setJobTitle] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [roleInBuying, setRoleInBuying] = useState<ContactRoleType>('decision_maker');
  const [influenceLevel, setInfluenceLevel] = useState<InfluenceLevelType>('high');
  const [isPrimary, setIsPrimary] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (editingContact) {
      setCustomerId(editingContact.customerId);
      setFullName(editingContact.fullName);
      setJobTitle(editingContact.jobTitle);
      setEmail(editingContact.email);
      setPhone(editingContact.phone);
      setDepartment(editingContact.department || '');
      setRoleInBuying(editingContact.roleInBuying);
      setInfluenceLevel(editingContact.influenceLevel || 'high');
      setIsPrimary(editingContact.isPrimary);
      setNotes(editingContact.notes || '');
    } else {
      setCustomerId(defaultCustomerId || (customers[0]?.id ?? ''));
      setFullName('');
      setJobTitle('');
      setEmail('');
      setPhone('');
      setDepartment('');
      setRoleInBuying('decision_maker');
      setInfluenceLevel('high');
      setIsPrimary(false);
      setNotes('');
    }
  }, [editingContact, defaultCustomerId, customers, isOpen]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !jobTitle.trim() || !customerId) {
      return;
    }

    const payload: CreateContactDTO = {
      customerId,
      fullName: fullName.trim(),
      jobTitle: jobTitle.trim(),
      email: email.trim(),
      phone: phone.trim(),
      department: department.trim() || undefined,
      roleInBuying,
      influenceLevel,
      isPrimary,
      notes: notes.trim() || undefined,
    };

    onSubmit(payload);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingContact ? 'Chỉnh sửa Người liên hệ' : 'Thêm Người liên hệ Mới'}
      subtitle={
        editingContact
          ? `Cập nhật thông tin và vai trò quyết định mua của ${editingContact.fullName}`
          : 'Quản lý người liên hệ, chức danh và phân loại vai trò mua hàng trong doanh nghiệp'
      }
    >
      <form onSubmit={handleSubmit} className={styles.contactForm}>
        {/* Doanh nghiệp / Khách hàng */}
        <div className={styles.contactForm__field}>
          <label htmlFor="contact-customer" className={styles.contactForm__label}>
            Khách hàng / Doanh nghiệp <span className={styles.contactForm__required}>*</span>
          </label>
          <select
            id="contact-customer"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            required
            className={styles.contactForm__select}
            disabled={!!editingContact}
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company} — ({c.fullName})
              </option>
            ))}
          </select>
        </div>

        {/* Họ tên & Chức danh */}
        <div className={styles.contactForm__grid}>
          <div className={styles.contactForm__field}>
            <label htmlFor="contact-fullname" className={styles.contactForm__label}>
              Họ và tên <span className={styles.contactForm__required}>*</span>
            </label>
            <input
              id="contact-fullname"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="VD: Nguyễn Văn An"
              className={styles.contactForm__input}
            />
          </div>

          <div className={styles.contactForm__field}>
            <label htmlFor="contact-jobtitle" className={styles.contactForm__label}>
              Chức danh <span className={styles.contactForm__required}>*</span>
            </label>
            <input
              id="contact-jobtitle"
              type="text"
              required
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="VD: Giám đốc Công nghệ (CTO)"
              className={styles.contactForm__input}
            />
          </div>
        </div>

        {/* Email & Số điện thoại */}
        <div className={styles.contactForm__grid}>
          <div className={styles.contactForm__field}>
            <label htmlFor="contact-email" className={styles.contactForm__label}>
              Email làm việc <span className={styles.contactForm__required}>*</span>
            </label>
            <input
              id="contact-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="VD: ten@congty.vn"
              className={styles.contactForm__input}
            />
          </div>

          <div className={styles.contactForm__field}>
            <label htmlFor="contact-phone" className={styles.contactForm__label}>
              Số điện thoại <span className={styles.contactForm__required}>*</span>
            </label>
            <input
              id="contact-phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+84 90 123 4567"
              className={styles.contactForm__input}
            />
          </div>
        </div>

        {/* Phòng ban & Mức độ ảnh hưởng */}
        <div className={styles.contactForm__grid}>
          <div className={styles.contactForm__field}>
            <label htmlFor="contact-department" className={styles.contactForm__label}>
              Phòng ban
            </label>
            <input
              id="contact-department"
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="VD: Ban Giám đốc / IT / Mua sắm"
              className={styles.contactForm__input}
            />
          </div>

          <div className={styles.contactForm__field}>
            <label htmlFor="contact-influence" className={styles.contactForm__label}>
              Mức độ ảnh hưởng
            </label>
            <select
              id="contact-influence"
              value={influenceLevel}
              onChange={(e) => setInfluenceLevel(e.target.value as InfluenceLevelType)}
              className={styles.contactForm__select}
            >
              <option value="high">Cao — Tác động mạnh đến quyết định</option>
              <option value="medium">Trung bình — Tác động vừa phải</option>
              <option value="low">Thấp — Ảnh hưởng hạn chế</option>
            </select>
          </div>
        </div>

        {/* Vai trò trong quyết định mua */}
        <div className={styles.contactForm__field}>
          <label className={styles.contactForm__label}>
            Vai trò trong Quyết định Mua hàng (Buying Role){' '}
            <span className={styles.contactForm__required}>*</span>
          </label>
          <div className={styles.contactForm__roleSelector} role="radiogroup" aria-label="Vai trò quyết định mua">
            {ROLES_INFO.map((item) => {
              const isSelected = roleInBuying === item.role;
              return (
                <button
                  key={item.role}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`${styles.contactForm__roleOption} ${
                    isSelected ? styles['contactForm__roleOption--selected'] : ''
                  }`}
                  onClick={() => setRoleInBuying(item.role)}
                >
                  <div className={styles.contactForm__roleOptionHeader}>
                    <span>{item.title}</span>
                    {item.icon}
                  </div>
                  <span className={styles.contactForm__roleOptionDesc}>{item.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Đánh dấu là đầu mối chính */}
        <div className={styles.contactForm__switchRow}>
          <div className={styles.contactForm__switchInfo}>
            <span className={styles.contactForm__switchTitle}>⭐ Đầu mối liên hệ chính (Đại diện giao dịch)</span>
            <span className={styles.contactForm__switchSub}>
              Đặt người này làm đại diện giao dịch ưu tiên cao nhất của doanh nghiệp
            </span>
          </div>
          <input
            type="checkbox"
            id="contact-is-primary"
            checked={isPrimary}
            onChange={(e) => setIsPrimary(e.target.checked)}
            className={styles.contactForm__checkbox}
          />
        </div>

        {/* Ghi chú chiến lược tiếp cận */}
        <div className={styles.contactForm__field}>
          <label htmlFor="contact-notes" className={styles.contactForm__label}>
            Ghi chú Chiến lược Bán hàng / Đặc điểm cá nhân
          </label>
          <textarea
            id="contact-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="VD: Cần cung cấp báo cáo thẩm định kỹ thuật, quan tâm tới khả năng giảm chi phí vận hành..."
            className={styles.contactForm__textarea}
          />
        </div>

        <div className={styles.contactForm__actions}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Hủy bỏ
          </Button>
          <Button type="submit" variant="primary">
            {editingContact ? 'Lưu Thay đổi' : 'Tạo Người liên hệ'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
