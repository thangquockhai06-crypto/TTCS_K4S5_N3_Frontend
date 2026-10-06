import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  GitMerge,
  History,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  IDuplicatePair,
  IMergeCustomerDTO,
} from '../../interfaces/duplicate-merge.interface';
import { useDuplicateDetection } from '../../hooks/useDuplicateDetection';
import { Button } from '../common';
import { DuplicateAlertCard } from './DuplicateAlertCard';
import { MergeCustomerModal } from './MergeCustomerModal';
import styles from './DuplicateMergeManager.module.css';

export interface IDuplicateMergeManagerProps {
  hideHeader?: boolean;
}

export const DuplicateMergeManager: React.FC<IDuplicateMergeManagerProps> = ({
  hideHeader = false,
}) => {
  const {
    pairs,
    history,
    stats,
    isLoading,
    currentUser,
    isTeamLeadOrAbove,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    executeMerge,
    dismissPair,
    resetData,
  } = useDuplicateDetection();

  const [selectedPairForMerge, setSelectedPairForMerge] = useState<IDuplicatePair | null>(null);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState<boolean>(false);

  const handleOpenMerge = (pair: IDuplicatePair) => {
    setSelectedPairForMerge(pair);
    setIsMergeModalOpen(true);
  };

  const handleConfirmMerge = (dto: IMergeCustomerDTO) => {
    executeMerge(dto);
  };

  return (
    <section className={styles.managerContainer} aria-label="Phân hệ Cảnh báo & Gộp Khách hàng Trùng lặp">
      {/* Header */}
      {!hideHeader && (
        <header className={styles.headerSection}>
          <div className={styles.titleGroup}>
            <h1 className={styles.mainTitle}>
              <GitMerge size={26} color="#2563eb" />
              Cảnh báo & Gộp Khách hàng Trùng lặp (De-duplication & Merge)
            </h1>
            <p className={styles.subtitle}>
              Tự động phát hiện trùng lặp theo Mã số thuế, Website và Tên công ty tương đồng. Ngăn ngừa tình trạng hai nhân viên cùng chào một khách hàng mà không biết nhau; hỗ trợ Trưởng nhóm so sánh và hợp nhất dữ liệu bảo toàn 100% liên hệ & phễu cơ hội.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw size={14} />}
              onClick={() => {
                if (window.confirm('Khôi phục danh sách cảnh báo trùng lặp mẫu?')) {
                  resetData();
                }
              }}
            >
              Đặt lại mẫu
            </Button>
          </div>
        </header>
      )}

      {/* KPI Stats */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard} style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className={styles.kpiCard__header}>
            <span className={styles.kpiCard__label}>Cặp trùng chờ xử lý</span>
            <AlertTriangle size={16} color="#f59e0b" />
          </div>
          <span className={styles.kpiCard__value} style={{ color: '#d97706' }}>
            {stats.totalPendingPairs}
          </span>
          <span className={styles.kpiCard__sub}>Độ tương đồng cao</span>
        </div>

        <div className={styles.kpiCard} style={{ borderLeft: '4px solid #ef4444' }}>
          <div className={styles.kpiCard__header}>
            <span className={styles.kpiCard__label}>Xung đột nhân viên</span>
            <Users size={16} color="#ef4444" />
          </div>
          <span className={styles.kpiCard__value} style={{ color: '#dc2626' }}>
            {stats.conflictingOwnersCount}
          </span>
          <span className={styles.kpiCard__sub}>Cùng chào 1 doanh nghiệp</span>
        </div>

        <div className={styles.kpiCard} style={{ borderLeft: '4px solid #2563eb' }}>
          <div className={styles.kpiCard__header}>
            <span className={styles.kpiCard__label}>Trùng khớp tuyệt đối</span>
            <Sparkles size={16} color="#2563eb" />
          </div>
          <span className={styles.kpiCard__value}>{stats.highConfidenceCount}</span>
          <span className={styles.kpiCard__sub}>Trùng MST hoặc Domain</span>
        </div>

        <div className={styles.kpiCard} style={{ borderLeft: '4px solid #059669' }}>
          <div className={styles.kpiCard__header}>
            <span className={styles.kpiCard__label}>Đã gộp thành công</span>
            <CheckCircle2 size={16} color="#059669" />
          </div>
          <span className={styles.kpiCard__value} style={{ color: '#059669' }}>
            {stats.mergedCount}
          </span>
          <span className={styles.kpiCard__sub}>Bảo toàn toàn bộ tài nguyên</span>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className={styles.tabsBar}>
        <div className={styles.tabButtons} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'pending'}
            className={`${styles.tabBtn} ${activeTab === 'pending' ? styles['tabBtn--active'] : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            <Clock size={14} /> Cần xử lý ({pairs.filter((p) => p.status === 'pending').length})
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'history'}
            className={`${styles.tabBtn} ${activeTab === 'history' ? styles['tabBtn--active'] : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={14} /> Nhật ký Gộp ({history.length})
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'all'}
            className={`${styles.tabBtn} ${activeTab === 'all' ? styles['tabBtn--active'] : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Tất cả cặp phát hiện
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="text"
            placeholder="Tìm theo tên công ty, MST, nhân viên phụ trách..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#64748b' }}>
          Đang quét phát hiện dữ liệu trùng lặp...
        </div>
      ) : activeTab === 'history' ? (
        history.length === 0 ? (
          <div className={styles.emptyState}>
            <CheckCircle2 size={32} color="#059669" />
            <div style={{ fontWeight: 700 }}>Chưa có bản ghi nào được gộp</div>
            <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
              Khi Trưởng nhóm phê duyệt gộp khách hàng trùng lặp, nhật ký kiểm toán sẽ lưu vết tại đây.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.historyTable} aria-label="Nhật ký gộp khách hàng trùng lặp">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Hồ sơ Chính (Master)</th>
                  <th>Hồ sơ Đã Gộp</th>
                  <th>Người phê duyệt</th>
                  <th>Tài nguyên bảo toàn</th>
                  <th>Tóm tắt hợp nhất</th>
                </tr>
              </thead>
              <tbody>
                {history.map((rec) => (
                  <tr key={rec.id}>
                    <td>{new Date(rec.mergedAt).toLocaleString('vi-VN')}</td>
                    <td>
                      <strong>{rec.primaryName}</strong>
                    </td>
                    <td>
                      <span style={{ color: '#64748b' }}>{rec.duplicateName}</span>
                    </td>
                    <td>
                      <strong>{rec.mergedBy}</strong> ({rec.mergedByRole})
                    </td>
                    <td>
                      <span style={{ color: '#059669', fontWeight: 600 }}>
                        {rec.preservedContactsCount} liên hệ · {rec.preservedDealsCount} cơ hội · {rec.preservedActivitiesCount} hoạt động
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem', maxWidth: '300px' }}>{rec.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : pairs.length === 0 ? (
        <div className={styles.emptyState}>
          <ShieldCheck size={36} color="#059669" />
          <div style={{ fontWeight: 700 }}>Hệ thống không phát hiện khách hàng trùng lặp nào</div>
          <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
            Tất cả hồ sơ khách hàng doanh nghiệp đều đảm bảo tính duy nhất và minh bạch quyền sở hữu.
          </div>
        </div>
      ) : (
        <div className={styles.cardsList}>
          {pairs.map((pair) => (
            <DuplicateAlertCard
              key={pair.id}
              pair={pair}
              onCompareAndMerge={handleOpenMerge}
              onDismiss={dismissPair}
            />
          ))}
        </div>
      )}

      {/* Merge Modal */}
      <MergeCustomerModal
        isOpen={isMergeModalOpen}
        onClose={() => setIsMergeModalOpen(false)}
        pair={selectedPairForMerge}
        isTeamLeadOrAbove={isTeamLeadOrAbove}
        currentUserName={currentUser?.fullName || 'Trưởng nhóm kinh doanh'}
        currentUserRole={currentUser?.role || 'VP of Sales'}
        onConfirmMerge={handleConfirmMerge}
      />
    </section>
  );
};
