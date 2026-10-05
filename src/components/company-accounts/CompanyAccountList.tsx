import React from 'react';
import {
  Building2,
  Edit2,
  Eye,
  FileSpreadsheet,
  Plus,
  Trash2,
} from 'lucide-react';
import { ICompanyAccount } from '../../interfaces/company-account.interface';
import { Badge, Button } from '../common';
import { CompanyAccountCard } from './CompanyAccountCard';
import { CompanyStatusBadge } from './CompanyStatusBadge';
import { formatCurrency } from '../../utils/formatters';
import styles from './CompanyAccountList.module.css';

export interface ICompanyAccountListProps {
  accounts: ICompanyAccount[];
  viewMode: 'grid' | 'table';
  onEdit: (account: ICompanyAccount) => void;
  onDelete: (id: string) => void;
  onViewDetail: (account: ICompanyAccount) => void;
  onAddNew: () => void;
}

export const CompanyAccountList: React.FC<ICompanyAccountListProps> = ({
  accounts,
  viewMode,
  onEdit,
  onDelete,
  onViewDetail,
  onAddNew,
}) => {
  if (accounts.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyState__icon}>
          <Building2 size={28} />
        </div>
        <h3 className={styles.emptyState__title}>Không tìm thấy hồ sơ khách hàng doanh nghiệp</h3>
        <p className={styles.emptyState__desc}>
          Không có dữ liệu phù hợp với điều kiện tìm kiếm hoặc phạm vi phân quyền hiện tại.
        </p>
        <Button variant="primary" leftIcon={<Plus size={16} />} onClick={onAddNew}>
          Thêm Khách hàng Doanh nghiệp
        </Button>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className={styles.companiesGrid}>
        {accounts.map((acc) => (
          <CompanyAccountCard
            key={acc.id}
            account={acc}
            onEdit={onEdit}
            onDelete={onDelete}
            onViewDetail={onViewDetail}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.companiesTable} aria-label="Danh sách hồ sơ khách hàng doanh nghiệp chuẩn">
        <thead>
          <tr>
            <th>Doanh nghiệp & Mã số thuế</th>
            <th>Ngành nghề & Quy mô</th>
            <th>Trạng thái</th>
            <th>Người phụ trách & Nhóm</th>
            <th>Doanh số dự kiến</th>
            <th>Đại diện liên hệ</th>
            <th style={{ textAlign: 'right' }}>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((acc) => (
            <tr key={acc.id}>
              <td>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--color-text, #1e293b)' }}>{acc.companyName}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FileSpreadsheet size={11} color="#2563eb" /> MST: <strong>{acc.taxCode}</strong>
                  </div>
                </div>
              </td>

              <td>
                <div>
                  <div style={{ fontWeight: 600 }}>{acc.industry}</div>
                  <Badge tone="neutral" size="sm">
                    {acc.scale.toUpperCase()}
                  </Badge>
                </div>
              </td>

              <td>
                <CompanyStatusBadge status={acc.status} size="sm" />
              </td>

              <td>
                <div>
                  <div style={{ fontWeight: 600, color: '#1e40af' }}>{acc.ownerName}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{acc.ownerTeam}</div>
                </div>
              </td>

              <td>
                <strong style={{ color: '#059669' }}>{formatCurrency(acc.dealValueEstimate || 0)}</strong>
              </td>

              <td>
                <div style={{ fontSize: '0.8125rem' }}>
                  <div>{acc.primaryContactName || 'Chưa cập nhật'}</div>
                  {acc.primaryContactPhone && (
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{acc.primaryContactPhone}</div>
                  )}
                </div>
              </td>

              <td style={{ textAlign: 'right' }}>
                <div className={styles.tableActions} style={{ justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className={styles.tableActionBtn}
                    onClick={() => onViewDetail(acc)}
                    title="Xem chi tiết"
                  >
                    <Eye size={12} />
                  </button>

                  <button
                    type="button"
                    className={styles.tableActionBtn}
                    onClick={() => onEdit(acc)}
                    title="Chỉnh sửa"
                  >
                    <Edit2 size={12} />
                  </button>

                  <button
                    type="button"
                    className={styles.tableActionBtn}
                    onClick={() => {
                      if (window.confirm(`Xác nhận xóa hồ sơ ${acc.companyName}?`)) {
                        onDelete(acc.id);
                      }
                    }}
                    style={{ color: '#e11d48' }}
                    title="Xóa"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
