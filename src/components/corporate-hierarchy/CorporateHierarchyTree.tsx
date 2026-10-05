import React from 'react';
import {
  Crown,
  FileSpreadsheet,
  GitFork,
  Plus,
  Trash2,
  UserCheck,
} from 'lucide-react';
import {
  ICorporateGroupSummary,
} from '../../interfaces/corporate-hierarchy.interface';
import { Badge, Button } from '../common';
import { CorporateRoleBadge } from './CorporateRoleBadge';
import { formatCurrency } from '../../utils/formatters';
import styles from './CorporateHierarchyTree.module.css';

export interface ICorporateHierarchyTreeProps {
  groupSummary: ICorporateGroupSummary;
  onOpenAssignModal: () => void;
  onRemoveSubsidiary: (subsidiaryId: string) => void;
}

export const CorporateHierarchyTree: React.FC<ICorporateHierarchyTreeProps> = ({
  groupSummary,
  onOpenAssignModal,
  onRemoveSubsidiary,
}) => {
  const p = groupSummary.parentCompany;
  const subsidiaries = groupSummary.subsidiaries;

  return (
    <div className={styles.treeContainer}>
      {/* 1. ROOT NODE: PARENT HOLDING COMPANY CARD */}
      <div className={styles.parentCard}>
        <div className={styles.parentHeader}>
          <div className={styles.parentTitleGroup}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <Crown size={22} color="#9333ea" />
              <h2 className={styles.parentName}>{p.companyName}</h2>
              <CorporateRoleBadge role="parent_holding" />
            </div>
            <div className={styles.parentMeta}>
              <span>
                <FileSpreadsheet size={13} style={{ display: 'inline', marginRight: '4px' }} />
                MST: <strong>{p.taxCode}</strong>
              </span>
              <span>Ngành nghề: <strong>{p.industry}</strong></span>
              <span>
                <UserCheck size={13} style={{ display: 'inline', marginRight: '4px' }} />
                Phụ trách: <strong>{p.ownerName}</strong> ({p.ownerTeam})
              </span>
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={16} />}
            onClick={onOpenAssignModal}
          >
            + Gắn Công ty Con vào Tập đoàn
          </Button>
        </div>

        {/* TỔNG GIÁ TRỊ HỢP ĐỒNG CẢ NHÓM CÔNG TY (GROUP ARR BANNER) */}
        <div className={styles.groupTotalBanner}>
          <div className={styles.bannerCol}>
            <span className={styles.bannerLabel}>TỔNG GIÁ TRỊ TOÀN BỘ TẬP ĐOÀN (GROUP ARR)</span>
            <span className={styles.bannerValue}>
              {formatCurrency(groupSummary.totalGroupDealValue)}
            </span>
            <span className={styles.bannerSubText}>
              Bao gồm công ty mẹ và toàn bộ {groupSummary.totalGroupSubsidiariesCount} công ty con thành viên
            </span>
          </div>

          <div className={styles.bannerCol}>
            <span className={styles.bannerLabel}>Giá trị Pháp nhân Mẹ</span>
            <span className={styles.bannerSubValue}>
              {formatCurrency(groupSummary.parentOnlyDealValue)}
            </span>
            <span className={styles.bannerSubText}>
              Đóng góp {((groupSummary.parentOnlyDealValue / (groupSummary.totalGroupDealValue || 1)) * 100).toFixed(0)}% tổng giá trị
            </span>
          </div>

          <div className={styles.bannerCol}>
            <span className={styles.bannerLabel}>Tổng các Công ty Con</span>
            <span className={styles.bannerSubValue}>
              {formatCurrency(groupSummary.subsidiariesTotalDealValue)}
            </span>
            <span className={styles.bannerSubText}>
              {groupSummary.totalGroupSubsidiariesCount} công ty con trực thuộc
            </span>
          </div>
        </div>
      </div>

      {/* 2. CONNECTOR LINES */}
      {subsidiaries.length > 0 && (
        <div className={styles.connectorLine}>
          <div className={styles.verticalLine} />
          <div className={styles.horizontalBar} />
          <div className={styles.verticalLine} />
        </div>
      )}

      {/* 3. CHILD NODES: SUBSIDIARIES GRID */}
      {subsidiaries.length === 0 ? (
        <div className={styles.emptySubsidiaries}>
          <GitFork size={28} color="#94a3b8" />
          <div style={{ fontWeight: 700 }}>Chưa có công ty con nào được gắn vào tập đoàn này</div>
          <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
            Hãy gắn thêm các pháp nhân thành viên, chi nhánh vùng hoặc liên doanh để tính toán tổng giá trị tập đoàn.
          </div>
          <Button variant="secondary" size="sm" onClick={onOpenAssignModal}>
            + Gắn Công ty Con đầu tiên
          </Button>
        </div>
      ) : (
        <div className={styles.subsidiariesGrid}>
          {subsidiaries.map((sub) => (
            <article key={sub.id} className={styles.childCard}>
              <div className={styles.childHeader}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <h3 className={styles.childName}>{sub.companyName}</h3>
                  <div className={styles.childMeta}>
                    <span>MST: {sub.taxCode}</span>
                    <span>Ngành: {sub.industry}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <CorporateRoleBadge
                  role={sub.corporateRole}
                  ownershipPercentage={sub.ownershipPercentage}
                />
                <Badge tone="neutral" size="sm">
                  {sub.scale.toUpperCase()}
                </Badge>
              </div>

              <div className={styles.childValueBox}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Giá trị hợp đồng:</span>
                <span className={styles.childValue}>{formatCurrency(sub.dealValue || 0)}</span>
              </div>

              <footer className={styles.childFooter}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Sale: <strong>{sub.ownerName}</strong>
                </span>

                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        `Bạn có chắc muốn tách "${sub.companyName}" ra khỏi Tập đoàn ${p.companyName}?`
                      )
                    ) {
                      onRemoveSubsidiary(sub.id);
                    }
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    border: '1px solid #fecdd3',
                    background: '#fff1f2',
                    color: '#e11d48',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.6875rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                  title="Tách công ty con này ra khỏi tập đoàn"
                >
                  <Trash2 size={11} /> Tách khỏi tập đoàn
                </button>
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
