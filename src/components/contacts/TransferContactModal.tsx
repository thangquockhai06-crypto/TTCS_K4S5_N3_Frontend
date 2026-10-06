import React, { useEffect, useState } from 'react';
import { ArrowRightLeft, Info } from 'lucide-react';
import {
  ContactRoleType,
  IContact,
  TransferContactDTO,
} from '../../interfaces/contact.interface';
import { ICustomer } from '../../interfaces/customer.interface';
import { useAuth } from '../../hooks/useAuth';
import { Avatar, Button, Modal } from '../common';
import { ContactRoleBadge } from './ContactRoleBadge';
import styles from './TransferContactModal.module.css';

export interface ITransferContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: IContact | null;
  customers: ICustomer[];
  onTransfer: (dto: TransferContactDTO) => void;
}

export const TransferContactModal: React.FC<ITransferContactModalProps> = ({
  isOpen,
  onClose,
  contact,
  customers,
  onTransfer,
}) => {
  const { user } = useAuth();
  const [newCustomerId, setNewCustomerId] = useState<string>('');
  const [newJobTitle, setNewJobTitle] = useState<string>('');
  const [newRoleInBuying, setNewRoleInBuying] = useState<ContactRoleType>('influencer');
  const [newDepartment, setNewDepartment] = useState<string>('');
  const [isPrimaryInNewCompany, setIsPrimaryInNewCompany] = useState<boolean>(false);
  const [reason, setReason] = useState<string>('');

  // Destination customer options (excluding the current one)
  const destinationCustomers = customers.filter((c) => c.id !== contact?.customerId);

  useEffect(() => {
    if (contact) {
      const firstAvailable = destinationCustomers[0]?.id ?? '';
      setNewCustomerId(firstAvailable);
      setNewJobTitle(contact.jobTitle);
      setNewRoleInBuying(contact.roleInBuying);
      setNewDepartment(contact.department || '');
      setIsPrimaryInNewCompany(false);
      setReason('');
    }
  }, [contact, isOpen]);

  if (!contact) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newCustomerId || !newJobTitle.trim() || !reason.trim()) {
      return;
    }

    const payload: TransferContactDTO = {
      contactId: contact.id,
      newCustomerId,
      newJobTitle: newJobTitle.trim(),
      newRoleInBuying,
      newDepartment: newDepartment.trim() || undefined,
      isPrimaryInNewCompany,
      reason: reason.trim(),
      transferredBy: user?.fullName || 'Quản Trị Viên Hệ Thống',
    };

    onTransfer(payload);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chuyển công ty cho Người liên hệ"
      subtitle="Gắn người liên hệ sang khách hàng / doanh nghiệp mới mà vẫn giữ nguyên toàn bộ lịch sử công tác trước đây"
    >
      <form onSubmit={handleSubmit} className={styles.transferModalForm}>
        {/* Thông tin hiện tại */}
        <div className={styles.transferCurrentBox}>
          <span className={styles.transferCurrentBox__title}>Thông tin công tác hiện tại</span>
          <div className={styles.transferCurrentBox__content}>
            <Avatar src={contact.avatarUrl} name={contact.fullName} size="md" />
            <div className={styles.transferCurrentBox__info}>
              <span className={styles.transferCurrentBox__name}>{contact.fullName}</span>
              <span className={styles.transferCurrentBox__meta}>
                {contact.jobTitle} tại <strong>{contact.companyName}</strong>
              </span>
              <div style={{ marginTop: '4px' }}>
                <ContactRoleBadge role={contact.roleInBuying} size="sm" />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.transferModalForm__notice}>
          <Info size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            Hệ thống sẽ lưu lại bản ghi chuyển giao này vào <strong>Lịch sử luân chuyển</strong>.
            Dữ liệu cũ tại {contact.companyName} sẽ được lưu trữ để phục vụ phân tích quan hệ khách hàng.
          </span>
        </div>

        {/* Khách hàng / Doanh nghiệp đích */}
        <div className={styles.transferModalForm__field}>
          <label htmlFor="transfer-target-company" className={styles.transferModalForm__label}>
            Chuyển sang Khách hàng / Doanh nghiệp mới{' '}
            <span className={styles.transferModalForm__required}>*</span>
          </label>
          <select
            id="transfer-target-company"
            required
            value={newCustomerId}
            onChange={(e) => setNewCustomerId(e.target.value)}
            className={styles.transferModalForm__select}
          >
            {destinationCustomers.length === 0 ? (
              <option value="">(Không có doanh nghiệp khác để chuyển)</option>
            ) : (
              destinationCustomers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company} — Đại diện: {c.fullName}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Chức danh & Phòng ban mới */}
        <div className={styles.transferModalForm__grid}>
          <div className={styles.transferModalForm__field}>
            <label htmlFor="transfer-new-jobtitle" className={styles.transferModalForm__label}>
              Chức danh mới tại công ty mới{' '}
              <span className={styles.transferModalForm__required}>*</span>
            </label>
            <input
              id="transfer-new-jobtitle"
              type="text"
              required
              value={newJobTitle}
              onChange={(e) => setNewJobTitle(e.target.value)}
              placeholder="VD: Giám đốc Kỹ thuật / Trưởng phòng Công nghệ"
              className={styles.transferModalForm__input}
            />
          </div>

          <div className={styles.transferModalForm__field}>
            <label htmlFor="transfer-new-dept" className={styles.transferModalForm__label}>
              Phòng ban mới
            </label>
            <input
              id="transfer-new-dept"
              type="text"
              value={newDepartment}
              onChange={(e) => setNewDepartment(e.target.value)}
              placeholder="VD: R&D / Ban Điều hành"
              className={styles.transferModalForm__input}
            />
          </div>
        </div>

        {/* Vai trò quyết định mua tại công ty mới */}
        <div className={styles.transferModalForm__field}>
          <label htmlFor="transfer-new-role" className={styles.transferModalForm__label}>
            Vai trò quyết định mua tại công ty mới{' '}
            <span className={styles.transferModalForm__required}>*</span>
          </label>
          <select
            id="transfer-new-role"
            value={newRoleInBuying}
            onChange={(e) => setNewRoleInBuying(e.target.value as ContactRoleType)}
            className={styles.transferModalForm__select}
          >
            <option value="decision_maker">Người quyết định — Có quyền chốt mua và ký kết</option>
            <option value="influencer">Người ảnh hưởng — Tham mưu kỹ thuật</option>
            <option value="end_user">Người dùng cuối — Vận hành trực tiếp</option>
            <option value="blocker">Người cản trở — Cần gỡ bỏ nghi ngại</option>
          </select>
        </div>

        {/* Checkbox làm đầu mối chính tại công ty mới */}
        <div className={styles.transferModalForm__switchRow}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
              Đặt làm Đầu mối chính tại doanh nghiệp mới
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Tự động cập nhật thành liên hệ ưu tiên hàng đầu của công ty mới
            </div>
          </div>
          <input
            type="checkbox"
            checked={isPrimaryInNewCompany}
            onChange={(e) => setIsPrimaryInNewCompany(e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#2563eb' }}
          />
        </div>

        {/* Lý do chuyển công ty & Ghi chú lịch sử */}
        <div className={styles.transferModalForm__field}>
          <label htmlFor="transfer-reason" className={styles.transferModalForm__label}>
            Lý do chuyển công tác / Ghi chú lịch sử{' '}
            <span className={styles.transferModalForm__required}>*</span>
          </label>
          <textarea
            id="transfer-reason"
            required
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="VD: Nhận quyết định bổ nhiệm Giám đốc Kỹ thuật tại công ty mới. Tiếp tục duy trì quan hệ để chào gói Enterprise."
            className={styles.transferModalForm__textarea}
          />
        </div>

        <div className={styles.transferModalForm__actions}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            variant="primary"
            leftIcon={<ArrowRightLeft size={16} />}
            disabled={!newCustomerId || destinationCustomers.length === 0}
          >
            Xác nhận Chuyển & Lưu Lịch sử
          </Button>
        </div>
      </form>
    </Modal>
  );
};
