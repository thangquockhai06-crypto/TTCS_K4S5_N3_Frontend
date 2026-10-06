import React from 'react';
import { Crown, Trash2 } from 'lucide-react';
import { ICorporateGroupSummary } from '../../interfaces/corporate-hierarchy.interface';
import { CorporateRoleBadge } from './CorporateRoleBadge';
import { formatCurrency } from '../../utils/formatters';
import styles from './SubsidiaryBreakdownTable.module.css';

export interface ISubsidiaryBreakdownTableProps {
  groupSummary: ICorporateGroupSummary;
  onRemoveSubsidiary: (subsidiaryId: string) => void;
}

export const SubsidiaryBreakdownTable: React.FC<ISubsidiaryBreakdownTableProps> = ({
  groupSummary,
  onRemoveSubsidiary,
}) => {
  const p = groupSummary.parentCompany;
  const subsidiaries = groupSummary.subsidiaries;
  const totalVal = groupSummary.totalGroupDealValue || 1;

  const parentPct = ((groupSummary.parentOnlyDealValue / totalVal) * 100).toFixed(1);

  return (
    <div className={styles.tableContainer}>
      <table className={styles.breakdownTable} aria-label="Bảng cơ cấu các pháp nhân thành viên trong tập đoàn">
        <thead>
          <tr>
            <th>Pháp nhân Doanh nghiệp</th>
            <th>Mã số thuế</th>
            <th>Vai trò trong Tập đoàn</th>
            <th>Tỷ lệ sở hữu vốn</th>
            <th>Giá trị Hợp đồng (ARR)</th>
            <th>Tỷ trọng đóng góp</th>
            <th>Nhân viên phụ trách</th>
            <th style={{ textAlign: 'right' }}>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {/* PARENT ROW */}
          <tr className={styles.parentRow}>
            <td>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: '#7e22ce' }}>
                <Crown size={15} color="#9333ea" />
                <span>{p.companyName}</span>
              </div>
            </td>
            <td><strong>{p.taxCode}</strong></td>
            <td>
              <CorporateRoleBadge role="parent_holding" />
            </td>
            <td>
              <strong style={{ color: '#7e22ce' }}>100% (Công ty Mẹ)</strong>
            </td>
            <td>
              <strong style={{ color: '#059669', fontSize: '0.9375rem' }}>
                {formatCurrency(p.dealValue || 0)}
              </strong>
            </td>
            <td>
              <strong>{parentPct}%</strong>
            </td>
            <td>
              <div>{p.ownerName}</div>
              <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>{p.ownerTeam}</div>
            </td>
            <td style={{ textAlign: 'right', color: '#64748b' }}>
              <span>(Gốc Tập đoàn)</span>
            </td>
          </tr>

          {/* SUBSIDIARIES ROWS */}
          {subsidiaries.map((sub) => {
            const subPct = (((sub.dealValue || 0) / totalVal) * 100).toFixed(1);

            return (
              <tr key={sub.id}>
                <td style={{ paddingLeft: '2rem' }}>
                  <div style={{ fontWeight: 600 }}>↳ {sub.companyName}</div>
                  <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>{sub.industry}</div>
                </td>
                <td>{sub.taxCode}</td>
                <td>
                  <CorporateRoleBadge role={sub.corporateRole} />
                </td>
                <td>
                  <span style={{ fontWeight: 600 }}>{sub.ownershipPercentage || 100}% vốn</span>
                </td>
                <td>
                  <span style={{ fontWeight: 700, color: '#059669' }}>
                    {formatCurrency(sub.dealValue || 0)}
                  </span>
                </td>
                <td>
                  <span>{subPct}%</span>
                </td>
                <td>
                  <div>{sub.ownerName}</div>
                  <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>{sub.ownerTeam}</div>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Xác nhận tách "${sub.companyName}" ra khỏi tập đoàn?`)) {
                        onRemoveSubsidiary(sub.id);
                      }
                    }}
                    style={{
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                      color: '#e11d48',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                    title="Tách công ty con khỏi tập đoàn"
                  >
                    <Trash2 size={12} style={{ display: 'inline', marginRight: '3px' }} />
                    Tách
                  </button>
                </td>
              </tr>
            );
          })}

          {/* TOTAL SUMMARY ROW */}
          <tr className={styles.tableTotalRow}>
            <td colSpan={4}>
              <span style={{ color: '#7e22ce' }}>
                TỔNG GIÁ TRỊ TOÀN BỘ TẬP ĐOÀN ({subsidiaries.length + 1} pháp nhân thành viên)
              </span>
            </td>
            <td>
              <span style={{ color: '#047857', fontSize: '1.0625rem' }}>
                {formatCurrency(groupSummary.totalGroupDealValue)}
              </span>
            </td>
            <td>
              <span>100.0%</span>
            </td>
            <td colSpan={2}>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Tổng {groupSummary.totalGroupContactsCount} người liên hệ
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
