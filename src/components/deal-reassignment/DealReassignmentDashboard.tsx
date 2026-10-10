import React, { useState } from 'react';
import {
  IReassignableDeal,
  IReassignmentHistoryItem,
} from '../../interfaces/deal-reassignment.interface';
import { useDealReassignment } from '../../hooks/useDealReassignment';
import { BatchReassignmentModal } from './BatchReassignmentModal';
import { DealReassignmentFilter } from './DealReassignmentFilter';
import { DealReassignmentSummaryCards } from './DealReassignmentSummaryCards';
import { DealReassignmentTable } from './DealReassignmentTable';
import { ReassignmentHistoryModal } from './ReassignmentHistoryModal';
import styles from './DealReassignmentDashboard.module.css';

export const DealReassignmentDashboard: React.FC = () => {
  const {
    deals,
    filteredDeals,
    history,
    workloadStats,
    selectedDealIds,
    filterState,
    selectedDealsCount,
    selectedDealsTotalValue,
    toggleSelectDeal,
    selectAllDeals,
    clearSelection,
    setFromRepFilter,
    setTeamFilter,
    setStageFilter,
    setSearchQuery,
    resetFilters,
    reassignDeals,
  } = useDealReassignment();

  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [activeHistoryDeal, setActiveHistoryDeal] = useState<{
    dealTitle: string;
    items: ReadonlyArray<IReassignmentHistoryItem>;
  } | null>(null);

  // Danh sách các deal đang được chọn để chuyển giao
  const selectedDeals = deals.filter((d) => selectedDealIds.includes(d.id));

  // Chuyển giao đơn lẻ một deal
  const handleSingleReassign = (deal: IReassignableDeal): void => {
    toggleSelectDeal(deal.id);
    setIsBatchModalOpen(true);
  };

  // Xem lịch sử của một deal cụ thể
  const handleViewDealHistory = (deal: IReassignableDeal): void => {
    setActiveHistoryDeal({
      dealTitle: deal.title,
      items: deal.history,
    });
    setIsHistoryModalOpen(true);
  };

  // Xem toàn bộ lịch sử của cả nhóm
  const handleViewAllHistory = (): void => {
    setActiveHistoryDeal(null);
    setIsHistoryModalOpen(true);
  };

  return (
    <main className={styles.reassignDashboard}>
      {/* 1. Các thẻ thống kê tải trọng và tiến độ bàn giao */}
      <DealReassignmentSummaryCards
        totalDealsCount={deals.length}
        selectedDealsCount={selectedDealsCount}
        selectedDealsTotalValue={selectedDealsTotalValue}
        totalTransfersCount={history.length}
        workloadStats={workloadStats}
      />

      {/* 2. Bộ lọc và nút thao tác phân bổ hàng loạt */}
      <DealReassignmentFilter
        filterState={filterState}
        selectedDealsCount={selectedDealsCount}
        onFromRepChange={setFromRepFilter}
        onTeamChange={setTeamFilter}
        onStageChange={setStageFilter}
        onSearchChange={setSearchQuery}
        onReset={resetFilters}
        onOpenReassignModal={() => setIsBatchModalOpen(true)}
        onOpenHistoryModal={handleViewAllHistory}
      />

      {/* 3. Bảng danh sách cơ hội có checkbox chọn nhiều */}
      <DealReassignmentTable
        deals={filteredDeals}
        selectedDealIds={selectedDealIds}
        onToggleSelect={toggleSelectDeal}
        onSelectAll={selectAllDeals}
        onClearSelection={clearSelection}
        onSingleReassign={handleSingleReassign}
        onViewHistory={handleViewDealHistory}
      />

      {/* Modal 1: Phân bổ lại quyền sở hữu một hoặc nhiều cơ hội */}
      <BatchReassignmentModal
        isOpen={isBatchModalOpen}
        selectedDeals={selectedDeals}
        onClose={() => setIsBatchModalOpen(false)}
        onSubmit={reassignDeals}
      />

      {/* Modal 2: Xem nhật ký bàn giao (kèm lý do và ghi chú) */}
      <ReassignmentHistoryModal
        isOpen={isHistoryModalOpen}
        history={activeHistoryDeal ? activeHistoryDeal.items : history}
        dealTitle={activeHistoryDeal ? activeHistoryDeal.dealTitle : undefined}
        onClose={() => {
          setIsHistoryModalOpen(false);
          setActiveHistoryDeal(null);
        }}
      />
    </main>
  );
};
