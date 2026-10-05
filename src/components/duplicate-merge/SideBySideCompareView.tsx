import React, { useState } from 'react';
import {
  Activity,
  AlertCircle,
  Briefcase,
  CheckCircle2,
  GitMerge,
  ShieldAlert,
  Users,
} from 'lucide-react';
import {
  IDuplicatePair,
  IMergeCustomerDTO,
  IMergeFieldSelection,
} from '../../interfaces/duplicate-merge.interface';
import { Button } from '../common';
import styles from './SideBySideCompareView.module.css';

export interface ISideBySideCompareViewProps {
  pair: IDuplicatePair;
  isTeamLeadOrAbove: boolean;
  currentUserName: string;
  currentUserRole: string;
  onConfirmMerge: (dto: IMergeCustomerDTO) => void;
  onCancel: () => void;
}

export const SideBySideCompareView: React.FC<ISideBySideCompareViewProps> = ({
  pair,
  isTeamLeadOrAbove,
  currentUserName,
  currentUserRole,
  onConfirmMerge,
  onCancel,
}) => {
  const p = pair.primaryRecord;
  const d = pair.duplicateRecord;

  const [selections, setSelections] = useState<IMergeFieldSelection>({
    companyName: 'primary',
    taxCode: 'primary',
    website: 'primary',
    industry: 'primary',
    address: 'primary',
    scale: 'primary',
    status: 'primary',
    ownerId: 'primary',
    dealValue: 'sum',
  });

  const [mergeNotes, setMergeNotes] = useState<string>(
    `Đã rà soát trùng lặp do ${pair.matchReason}. Thống nhất giữ lại hồ sơ Master và gom toàn bộ cơ hội bán hàng.`
  );

  const handleSelectField = (
    field: keyof IMergeFieldSelection,
    choice: 'primary' | 'duplicate' | 'sum'
  ) => {
    setSelections((prev) => ({
      ...prev,
      [field]: choice,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isTeamLeadOrAbove) {
      alert('Chỉ Trưởng nhóm kinh doanh hoặc Quản trị viên mới có quyền phê duyệt gộp bản ghi trùng lặp.');
      return;
    }

    const payload: IMergeCustomerDTO = {
      pairId: pair.id,
      primaryId: p.id,
      duplicateId: d.id,
      fieldSelections: selections,
      keepAllContacts: true,
      keepAllDeals: true,
      keepAllActivities: true,
      mergeNotes,
      mergedBy: currentUserName,
      mergedByRole: currentUserRole,
    };

    onConfirmMerge(payload);
  };

  const totalContacts = (p.contactCount || 0) + (d.contactCount || 0);
  const totalDeals = (p.dealCount || 0) + (d.dealCount || 0);
  const totalActivities = (p.activityCount || 0) + (d.activityCount || 0);

  return (
    <form onSubmit={handleSubmit} className={styles.compareContainer}>
      {/* Cảnh báo lý do trùng khớp & Xung đột nhân viên */}
      <div className={styles.reasonNotice}>
        <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <div style={{ fontWeight: 700, marginBottom: '2px' }}>
            Phát hiện Trùng lặp: {pair.matchReason}
          </div>
          <div>
            Xung đột phụ trách: <strong>{p.ownerName}</strong> ({p.ownerTeam}) và{' '}
            <strong>{d.ownerName}</strong> ({d.ownerTeam}) đang cùng tiếp cận một khách hàng.
          </div>
        </div>
      </div>

      {/* Bảng so sánh 2 cột cạnh nhau */}
      <table className={styles.compareTable} aria-label="Bảng so sánh chi tiết hai bản ghi khách hàng trùng lặp">
        <thead>
          <tr>
            <th>Thuộc tính</th>
            <th className={styles.masterCol}>
              Bản ghi A (Hồ sơ Chính / Master)
              <div style={{ fontSize: '0.6875rem', fontWeight: 500, marginTop: '2px' }}>
                Khởi tạo: {new Date(p.createdAt).toLocaleDateString('vi-VN')}
              </div>
            </th>
            <th>
              Bản ghi B (Hồ sơ Phụ / Sẽ gộp vào)
              <div style={{ fontSize: '0.6875rem', fontWeight: 500, marginTop: '2px' }}>
                Khởi tạo: {new Date(d.createdAt).toLocaleDateString('vi-VN')}
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {/* Tên công ty */}
          <tr>
            <td className={styles.fieldLabel}>Tên Doanh nghiệp</td>
            <td
              className={`${styles.optionCell} ${
                selections.companyName === 'primary' ? styles['optionCell--selected'] : ''
              }`}
              onClick={() => handleSelectField('companyName', 'primary')}
            >
              <div className={styles.cellContent}>
                <input
                  type="radio"
                  name="cmp-companyName"
                  checked={selections.companyName === 'primary'}
                  onChange={() => handleSelectField('companyName', 'primary')}
                  className={styles.radioInput}
                />
                <span>{p.companyName}</span>
              </div>
            </td>
            <td
              className={`${styles.optionCell} ${
                selections.companyName === 'duplicate' ? styles['optionCell--selected'] : ''
              }`}
              onClick={() => handleSelectField('companyName', 'duplicate')}
            >
              <div className={styles.cellContent}>
                <input
                  type="radio"
                  name="cmp-companyName"
                  checked={selections.companyName === 'duplicate'}
                  onChange={() => handleSelectField('companyName', 'duplicate')}
                  className={styles.radioInput}
                />
                <span>{d.companyName}</span>
              </div>
            </td>
          </tr>

          {/* Mã số thuế */}
          <tr>
            <td className={styles.fieldLabel}>Mã số thuế</td>
            <td
              className={`${styles.optionCell} ${
                selections.taxCode === 'primary' ? styles['optionCell--selected'] : ''
              }`}
              onClick={() => handleSelectField('taxCode', 'primary')}
            >
              <div className={styles.cellContent}>
                <input
                  type="radio"
                  name="cmp-taxCode"
                  checked={selections.taxCode === 'primary'}
                  onChange={() => handleSelectField('taxCode', 'primary')}
                  className={styles.radioInput}
                />
                <span>{p.taxCode || '(Trống)'}</span>
              </div>
            </td>
            <td
              className={`${styles.optionCell} ${
                selections.taxCode === 'duplicate' ? styles['optionCell--selected'] : ''
              }`}
              onClick={() => handleSelectField('taxCode', 'duplicate')}
            >
              <div className={styles.cellContent}>
                <input
                  type="radio"
                  name="cmp-taxCode"
                  checked={selections.taxCode === 'duplicate'}
                  onChange={() => handleSelectField('taxCode', 'duplicate')}
                  className={styles.radioInput}
                />
                <span>{d.taxCode || '(Trống)'}</span>
              </div>
            </td>
          </tr>

          {/* Website */}
          <tr>
            <td className={styles.fieldLabel}>Website</td>
            <td
              className={`${styles.optionCell} ${
                selections.website === 'primary' ? styles['optionCell--selected'] : ''
              }`}
              onClick={() => handleSelectField('website', 'primary')}
            >
              <div className={styles.cellContent}>
                <input
                  type="radio"
                  name="cmp-website"
                  checked={selections.website === 'primary'}
                  onChange={() => handleSelectField('website', 'primary')}
                  className={styles.radioInput}
                />
                <span>{p.website || '(Trống)'}</span>
              </div>
            </td>
            <td
              className={`${styles.optionCell} ${
                selections.website === 'duplicate' ? styles['optionCell--selected'] : ''
              }`}
              onClick={() => handleSelectField('website', 'duplicate')}
            >
              <div className={styles.cellContent}>
                <input
                  type="radio"
                  name="cmp-website"
                  checked={selections.website === 'duplicate'}
                  onChange={() => handleSelectField('website', 'duplicate')}
                  className={styles.radioInput}
                />
                <span>{d.website || '(Trống)'}</span>
              </div>
            </td>
          </tr>

          {/* Ngành nghề */}
          <tr>
            <td className={styles.fieldLabel}>Ngành nghề</td>
            <td
              className={`${styles.optionCell} ${
                selections.industry === 'primary' ? styles['optionCell--selected'] : ''
              }`}
              onClick={() => handleSelectField('industry', 'primary')}
            >
              <div className={styles.cellContent}>
                <input
                  type="radio"
                  name="cmp-industry"
                  checked={selections.industry === 'primary'}
                  onChange={() => handleSelectField('industry', 'primary')}
                  className={styles.radioInput}
                />
                <span>{p.industry}</span>
              </div>
            </td>
            <td
              className={`${styles.optionCell} ${
                selections.industry === 'duplicate' ? styles['optionCell--selected'] : ''
              }`}
              onClick={() => handleSelectField('industry', 'duplicate')}
            >
              <div className={styles.cellContent}>
                <input
                  type="radio"
                  name="cmp-industry"
                  checked={selections.industry === 'duplicate'}
                  onChange={() => handleSelectField('industry', 'duplicate')}
                  className={styles.radioInput}
                />
                <span>{d.industry}</span>
              </div>
            </td>
          </tr>

          {/* Nhân viên phụ trách sau gộp */}
          <tr>
            <td className={styles.fieldLabel}>Người phụ trách chính thức</td>
            <td
              className={`${styles.optionCell} ${
                selections.ownerId === 'primary' ? styles['optionCell--selected'] : ''
              }`}
              onClick={() => handleSelectField('ownerId', 'primary')}
            >
              <div className={styles.cellContent}>
                <input
                  type="radio"
                  name="cmp-ownerId"
                  checked={selections.ownerId === 'primary'}
                  onChange={() => handleSelectField('ownerId', 'primary')}
                  className={styles.radioInput}
                />
                <div>
                  <strong>{p.ownerName}</strong>
                  <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>{p.ownerTeam}</div>
                </div>
              </div>
            </td>
            <td
              className={`${styles.optionCell} ${
                selections.ownerId === 'duplicate' ? styles['optionCell--selected'] : ''
              }`}
              onClick={() => handleSelectField('ownerId', 'duplicate')}
            >
              <div className={styles.cellContent}>
                <input
                  type="radio"
                  name="cmp-ownerId"
                  checked={selections.ownerId === 'duplicate'}
                  onChange={() => handleSelectField('ownerId', 'duplicate')}
                  className={styles.radioInput}
                />
                <div>
                  <strong>{d.ownerName}</strong>
                  <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>{d.ownerTeam}</div>
                </div>
              </div>
            </td>
          </tr>

          {/* Trạng thái khách hàng */}
          <tr>
            <td className={styles.fieldLabel}>Trạng thái sau gộp</td>
            <td
              className={`${styles.optionCell} ${
                selections.status === 'primary' ? styles['optionCell--selected'] : ''
              }`}
              onClick={() => handleSelectField('status', 'primary')}
            >
              <div className={styles.cellContent}>
                <input
                  type="radio"
                  name="cmp-status"
                  checked={selections.status === 'primary'}
                  onChange={() => handleSelectField('status', 'primary')}
                  className={styles.radioInput}
                />
                <span style={{ textTransform: 'capitalize' }}>{p.status}</span>
              </div>
            </td>
            <td
              className={`${styles.optionCell} ${
                selections.status === 'duplicate' ? styles['optionCell--selected'] : ''
              }`}
              onClick={() => handleSelectField('status', 'duplicate')}
            >
              <div className={styles.cellContent}>
                <input
                  type="radio"
                  name="cmp-status"
                  checked={selections.status === 'duplicate'}
                  onChange={() => handleSelectField('status', 'duplicate')}
                  className={styles.radioInput}
                />
                <span style={{ textTransform: 'capitalize' }}>{d.status}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Cam kết bảo toàn dữ liệu khi gộp */}
      <div className={styles.preservedResourcesBox}>
        <div className={styles.preservedHeader}>
          <CheckCircle2 size={18} />
          <span>Cam kết bảo toàn toàn bộ tài nguyên khi gộp 2 bản ghi:</span>
        </div>
        <div className={styles.preservedList}>
          <div className={styles.preservedItem}>
            <Users size={16} />
            <span>Giữ nguyên {totalContacts} Người liên hệ (Contacts)</span>
          </div>
          <div className={styles.preservedItem}>
            <Briefcase size={16} />
            <span>Giữ nguyên {totalDeals} Cơ hội phễu (Deals)</span>
          </div>
          <div className={styles.preservedItem}>
            <Activity size={16} />
            <span>Giữ nguyên {totalActivities} Lịch sử hoạt động (Timeline)</span>
          </div>
        </div>
      </div>

      {/* Ghi chú lý do gộp */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label htmlFor="merge-notes" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
          Ghi chú phê duyệt của Trưởng nhóm
        </label>
        <textarea
          id="merge-notes"
          rows={2}
          value={mergeNotes}
          onChange={(e) => setMergeNotes(e.target.value)}
          style={{
            padding: '0.625rem',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            fontSize: '0.8125rem',
            fontFamily: 'inherit',
          }}
        />
      </div>

      {/* Kiểm tra phân quyền: Chỉ Trưởng nhóm trở lên */}
      {!isTeamLeadOrAbove && (
        <div className={styles.permissionWarning}>
          <ShieldAlert size={18} style={{ flexShrink: 0 }} />
          <span>
            Bạn đang đăng nhập với vai trò <strong>{currentUserRole}</strong>. Quyền gộp bản ghi chỉ dành cho <strong>Trưởng nhóm kinh doanh (VP of Sales / Manager / Super Admin)</strong> để tránh tranh chấp quyền sở hữu khách hàng.
          </span>
        </div>
      )}

      {/* Buttons */}
      <div className={styles.actionsRow}>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Hủy bỏ
        </Button>
        <Button
          type="submit"
          variant="primary"
          leftIcon={<GitMerge size={16} />}
          disabled={!isTeamLeadOrAbove}
        >
          Xác nhận Gộp & Bảo toàn toàn bộ Dữ liệu
        </Button>
      </div>
    </form>
  );
};
