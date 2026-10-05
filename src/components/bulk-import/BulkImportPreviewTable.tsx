import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { DuplicateActionType, IBulkImportRow, IBulkImportStats } from '../../interfaces/bulk-import.interface';
import styles from './BulkImportPreviewTable.module.css';

export interface IBulkImportPreviewTableProps {
  rows: IBulkImportRow[];
  stats: IBulkImportStats;
  onDuplicateAction: (rowIndex: number, action: DuplicateActionType) => void;
}

const STATUS_LABEL: Record<string, string> = {
  valid: '✓ Hợp lệ',
  duplicate: '⚠ Trùng lặp',
  error: '✕ Lỗi dữ liệu',
};

const STATUS_STYLE: Record<string, string> = {
  valid: styles['statusBadge--valid'],
  duplicate: styles['statusBadge--duplicate'],
  error: styles['statusBadge--error'],
};

const ROW_STYLE: Record<string, string> = {
  valid: styles['row--valid'],
  duplicate: styles['row--duplicate'],
  error: styles['row--error'],
};

export const BulkImportPreviewTable: React.FC<IBulkImportPreviewTableProps> = ({
  rows,
  stats,
  onDuplicateAction,
}) => {
  return (
    <div className={styles.previewWrapper}>
      {/* Stats bar */}
      <div className={styles.statsBar} role="region" aria-label="Thống kê phân tích file">
        <div className={`${styles.statPill} ${styles['statPill--total']}`}>
          <span className={styles.statPill__value}>{stats.total}</span>
          <span>Tổng dòng</span>
        </div>
        <div className={`${styles.statPill} ${styles['statPill--valid']}`}>
          <span className={styles.statPill__value}>{stats.valid}</span>
          <span>Hợp lệ</span>
        </div>
        <div className={`${styles.statPill} ${styles['statPill--dup']}`}>
          <span className={styles.statPill__value}>{stats.duplicates}</span>
          <span>Trùng lặp</span>
        </div>
        <div className={`${styles.statPill} ${styles['statPill--error']}`}>
          <span className={styles.statPill__value}>{stats.errors}</span>
          <span>Lỗi dữ liệu</span>
        </div>
      </div>

      {/* Scrollable table */}
      <div className={styles.tableContainer}>
        <table className={styles.previewTable} aria-label="Bảng xem trước dữ liệu nhập hàng loạt">
          <thead>
            <tr>
              <th className={styles.rowNum}>#</th>
              <th>Trạng thái</th>
              <th>Họ và tên</th>
              <th>Công ty</th>
              <th>Email</th>
              <th>Điện thoại</th>
              <th>Chức danh</th>
              <th>Phân khúc</th>
              <th>Chi tiết lỗi / Xử lý trùng</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.rowIndex}
                className={`${ROW_STYLE[row.status] ?? ''}`}
              >
                {/* Row number */}
                <td className={styles.rowNum}>{row.rowIndex}</td>

                {/* Status badge */}
                <td>
                  <span className={`${styles.statusBadge} ${STATUS_STYLE[row.status] ?? ''}`}>
                    {row.status === 'valid' && <CheckCircle2 size={11} />}
                    {row.status === 'duplicate' && <AlertTriangle size={11} />}
                    {row.status === 'error' && <AlertCircle size={11} />}
                    {STATUS_LABEL[row.status]}
                  </span>
                </td>

                {/* Name */}
                <td>
                  <div className={styles.cellPrimary}>{row.fullName || '—'}</div>
                </td>

                {/* Company */}
                <td>
                  <div className={styles.cellPrimary}>{row.company || '—'}</div>
                  {row.location && (
                    <div className={styles.cellSecondary}>{row.location}</div>
                  )}
                </td>

                {/* Email */}
                <td>
                  <div>{row.email || '—'}</div>
                </td>

                {/* Phone */}
                <td>
                  <div>{row.phone || '—'}</div>
                </td>

                {/* Role */}
                <td>
                  <div>{row.role || '—'}</div>
                </td>

                {/* Tier */}
                <td>
                  <div>{row.tier}</div>
                </td>

                {/* Errors / Duplicate actions */}
                <td>
                  {row.status === 'error' && row.errors.length > 0 && (
                    <ul className={styles.errorList}>
                      {row.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  )}

                  {row.status === 'duplicate' && (
                    <div>
                      <div className={styles.cellSecondary}>
                        Trùng: <strong>{row.duplicateCustomerName}</strong>
                      </div>
                      <div className={styles.dupActions}>
                        <button
                          type="button"
                          className={`${styles.dupActionBtn} ${styles['dupActionBtn--skip']} ${row.duplicateAction === 'skip' || !row.duplicateAction ? styles.active : ''}`}
                          onClick={() => onDuplicateAction(row.rowIndex, 'skip')}
                          title="Bỏ qua dòng này"
                        >
                          Bỏ qua
                        </button>
                        <button
                          type="button"
                          className={`${styles.dupActionBtn} ${styles['dupActionBtn--update']} ${row.duplicateAction === 'update' ? styles.active : ''}`}
                          onClick={() => onDuplicateAction(row.rowIndex, 'update')}
                          title="Cập nhật bản ghi đã tồn tại"
                        >
                          Cập nhật
                        </button>
                      </div>
                    </div>
                  )}

                  {row.status === 'valid' && (
                    <span className={styles.cellSecondary}>Sẵn sàng nhập</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary footer */}
      <div className={styles.summaryFooter}>
        <span>
          Sẽ nhập: <strong>{stats.valid}</strong> bản ghi mới ·
          Trùng lặp cần xử lý: <strong>{stats.duplicates}</strong> ·
          Lỗi (bỏ qua): <strong>{stats.errors}</strong>
        </span>
        <span className={styles.summaryFooter__note}>
          <AlertCircle size={13} />
          Dòng lỗi sẽ tự động bỏ qua khi nhập
        </span>
      </div>
    </div>
  );
};
