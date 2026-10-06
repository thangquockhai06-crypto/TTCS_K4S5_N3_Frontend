import React, { useEffect, useState } from 'react';
import { Crown, GitFork } from 'lucide-react';
import {
  CorporateRoleType,
  IAssignSubsidiaryDTO,
  ICorporateNode,
} from '../../interfaces/corporate-hierarchy.interface';
import { Button, Modal } from '../common';
import styles from './AssignSubsidiaryModal.module.css';

export interface IAssignSubsidiaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentCompany: ICorporateNode | null;
  availableCandidates: ICorporateNode[];
  onAssign: (dto: IAssignSubsidiaryDTO) => void;
}

export const AssignSubsidiaryModal: React.FC<IAssignSubsidiaryModalProps> = ({
  isOpen,
  onClose,
  parentCompany,
  availableCandidates,
  onAssign,
}) => {
  const [subsidiaryId, setSubsidiaryId] = useState<string>('');
  const [corporateRole, setCorporateRole] = useState<CorporateRoleType>('operating_subsidiary');
  const [ownershipPercentage, setOwnershipPercentage] = useState<number>(100);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (availableCandidates.length > 0) {
      setSubsidiaryId(availableCandidates[0].id);
    } else {
      setSubsidiaryId('');
    }
    setCorporateRole('operating_subsidiary');
    setOwnershipPercentage(100);
    setNotes('');
  }, [availableCandidates, isOpen]);

  if (!parentCompany) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subsidiaryId) return;

    onAssign({
      parentCompanyId: parentCompany.id,
      subsidiaryId,
      corporateRole,
      ownershipPercentage: Number(ownershipPercentage) || 100,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gắn Khách hàng làm Công ty Con trong Tập đoàn"
      subtitle={`Thiết lập quan hệ pháp nhân con trực thuộc ${parentCompany.companyName} để tổng hợp giá trị tập đoàn`}
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.parentInfo}>
          <Crown size={18} style={{ flexShrink: 0 }} />
          <div>
            Công ty Mẹ (Holding): <strong>{parentCompany.companyName}</strong> (MST: {parentCompany.taxCode})
          </div>
        </div>

        {availableCandidates.length === 0 ? (
          <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>
            Không còn pháp nhân độc lập nào khả dụng để gắn vào tập đoàn này.
          </div>
        ) : (
          <>
            <div className={styles.field}>
              <label htmlFor="select-subsidiary" className={styles.label}>
                Chọn Khách hàng / Pháp nhân con <span className={styles.required}>*</span>
              </label>
              <select
                id="select-subsidiary"
                required
                value={subsidiaryId}
                onChange={(e) => setSubsidiaryId(e.target.value)}
                className={styles.select}
              >
                {availableCandidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName} — MST: {c.taxCode} ({c.industry})
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.grid}>
              <div className={styles.field}>
                <label htmlFor="select-role" className={styles.label}>
                  Vai trò trong Tập đoàn <span className={styles.required}>*</span>
                </label>
                <select
                  id="select-role"
                  value={corporateRole}
                  onChange={(e) => setCorporateRole(e.target.value as CorporateRoleType)}
                  className={styles.select}
                >
                  <option value="operating_subsidiary">Công ty Con Vận hành (Operating Subsidiary)</option>
                  <option value="regional_branch">Chi nhánh Pháp nhân Vùng (Regional Branch)</option>
                  <option value="joint_venture">Công ty Liên doanh (Joint Venture)</option>
                </select>
              </div>

              <div className={styles.field}>
                <label htmlFor="ownership-pct" className={styles.label}>
                  Tỷ lệ sở hữu vốn (%) <span className={styles.required}>*</span>
                </label>
                <input
                  id="ownership-pct"
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={ownershipPercentage}
                  onChange={(e) => setOwnershipPercentage(Number(e.target.value))}
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="assign-notes" className={styles.label}>
                Ghi chú cơ cấu tập đoàn
              </label>
              <textarea
                id="assign-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="VD: Công ty mẹ nắm giữ 100% cổ phần biểu quyết, thực hiện mua sắm phần mềm tập trung..."
                className={styles.textarea}
              />
            </div>
          </>
        )}

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            variant="primary"
            leftIcon={<GitFork size={16} />}
            disabled={availableCandidates.length === 0}
          >
            Xác nhận Gắn vào Tập đoàn
          </Button>
        </div>
      </form>
    </Modal>
  );
};
