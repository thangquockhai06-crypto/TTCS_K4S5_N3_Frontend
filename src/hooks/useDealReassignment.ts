import { useMemo, useState } from 'react';
import {
  IReassignableDeal,
  IReassignmentFilterState,
  IReassignmentHistoryItem,
  IReassignmentPayload,
  IRepWorkloadStat,
} from '../interfaces/deal-reassignment.interface';
import {
  INITIAL_REASSIGNABLE_DEALS,
  INITIAL_REASSIGNMENT_HISTORY,
  INITIAL_REP_WORKLOADS,
  REASSIGNMENT_REASONS,
} from '../mock/deal-reassignment.mock';
import { SALES_REPS } from '../mock/forecast.mock';

export interface IUseDealReassignmentReturn {
  deals: ReadonlyArray<IReassignableDeal>;
  filteredDeals: ReadonlyArray<IReassignableDeal>;
  history: ReadonlyArray<IReassignmentHistoryItem>;
  workloadStats: ReadonlyArray<IRepWorkloadStat>;
  selectedDealIds: ReadonlyArray<string>;
  filterState: IReassignmentFilterState;
  selectedDealsCount: number;
  selectedDealsTotalValue: number;
  toggleSelectDeal: (dealId: string) => void;
  selectAllDeals: () => void;
  clearSelection: () => void;
  setFromRepFilter: (repId: string) => void;
  setTeamFilter: (teamId: string) => void;
  setStageFilter: (stage: string) => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
  reassignDeals: (payload: IReassignmentPayload) => void;
}

export const useDealReassignment = (): IUseDealReassignmentReturn => {
  const [deals, setDeals] = useState<ReadonlyArray<IReassignableDeal>>(INITIAL_REASSIGNABLE_DEALS);
  const [history, setHistory] = useState<ReadonlyArray<IReassignmentHistoryItem>>(
    INITIAL_REASSIGNMENT_HISTORY
  );
  const [workloadStats, setWorkloadStats] = useState<ReadonlyArray<IRepWorkloadStat>>(
    INITIAL_REP_WORKLOADS
  );
  const [selectedDealIds, setSelectedDealIds] = useState<ReadonlyArray<string>>([]);

  const [filterState, setFilterState] = useState<IReassignmentFilterState>({
    fromRepId: 'all',
    toRepId: 'all',
    teamId: 'all',
    stage: 'all',
    searchQuery: '',
  });

  const toggleSelectDeal = (dealId: string): void => {
    setSelectedDealIds((prev) =>
      prev.includes(dealId) ? prev.filter((id) => id !== dealId) : [...prev, dealId]
    );
  };

  const selectAllDeals = (): void => {
    const allFilteredIds = filteredDeals.map((d) => d.id);
    setSelectedDealIds(allFilteredIds);
  };

  const clearSelection = (): void => {
    setSelectedDealIds([]);
  };

  const setFromRepFilter = (fromRepId: string): void => {
    setFilterState((prev) => ({ ...prev, fromRepId }));
  };

  const setTeamFilter = (teamId: string): void => {
    setFilterState((prev) => ({ ...prev, teamId, fromRepId: 'all' }));
  };

  const setStageFilter = (stage: string): void => {
    setFilterState((prev) => ({ ...prev, stage }));
  };

  const setSearchQuery = (searchQuery: string): void => {
    setFilterState((prev) => ({ ...prev, searchQuery }));
  };

  const resetFilters = (): void => {
    setFilterState({
      fromRepId: 'all',
      toRepId: 'all',
      teamId: 'all',
      stage: 'all',
      searchQuery: '',
    });
  };

  // Thực hiện phân bổ lại một hoặc nhiều cơ hội cùng lúc
  const reassignDeals = (payload: IReassignmentPayload): void => {
    const newRep = SALES_REPS.find((r) => r.id === payload.toRepId);
    if (!newRep) return;

    const reasonObj = REASSIGNMENT_REASONS.find((r) => r.value === payload.reason);
    const reasonDisplay = reasonObj ? reasonObj.label : payload.reason;

    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${now.getFullYear()} ${now
      .getHours()
      .toString()
      .padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newHistoryItems: IReassignmentHistoryItem[] = [];

    // 1. Cập nhật quyền sở hữu và lịch sử trên từng deal
    setDeals((prevDeals) =>
      prevDeals.map((deal) => {
        if (payload.dealIds.includes(deal.id)) {
          const historyItem: IReassignmentHistoryItem = {
            id: `rh-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            dealId: deal.id,
            dealTitle: deal.title,
            company: deal.company,
            dealValue: deal.dealValue,
            fromRepId: deal.assignedRepId,
            fromRepName: deal.assignedRepName,
            fromRepAvatar: deal.assignedRepAvatar,
            toRepId: newRep.id,
            toRepName: newRep.name,
            toRepAvatar: newRep.avatar,
            reason: payload.reason,
            reasonDisplay,
            handoverNotes: payload.handoverNotes,
            transferredAt: formattedDate,
            transferredBy: payload.transferredBy || 'Trần Thị Mai Phương (Trưởng nhóm)',
          };

          newHistoryItems.push(historyItem);

          return {
            ...deal,
            assignedRepId: newRep.id,
            assignedRepName: newRep.name,
            assignedRepAvatar: newRep.avatar,
            teamId: newRep.teamId,
            teamName: newRep.teamName,
            history: [historyItem, ...deal.history],
          };
        }
        return deal;
      })
    );

    // 2. Cập nhật nhật ký chung toàn hệ thống
    setHistory((prevHistory) => [...newHistoryItems, ...prevHistory]);

    // 3. Cập nhật tải trọng nhân sự (Workload)
    setWorkloadStats((prevStats) =>
      prevStats.map((stat) => {
        if (stat.repId === newRep.id) {
          const addedCount = payload.dealIds.length;
          const newCount = stat.activeDealsCount + addedCount;
          return {
            ...stat,
            activeDealsCount: newCount,
            status: newCount > stat.maxCapacity ? 'overloaded' : 'optimal',
          };
        }
        return stat;
      })
    );

    // 4. Xóa các deal đã chọn
    setSelectedDealIds([]);
  };

  // Lọc danh sách deal theo bộ lọc
  const filteredDeals = useMemo((): ReadonlyArray<IReassignableDeal> => {
    return deals.filter((deal) => {
      if (filterState.fromRepId !== 'all' && deal.assignedRepId !== filterState.fromRepId) {
        return false;
      }

      if (filterState.teamId !== 'all' && deal.teamId !== filterState.teamId) {
        return false;
      }

      if (filterState.stage !== 'all' && deal.stage !== filterState.stage) {
        return false;
      }

      if (filterState.searchQuery.trim()) {
        const q = filterState.searchQuery.toLowerCase().trim();
        const matchTitle = deal.title.toLowerCase().includes(q);
        const matchCompany = deal.company.toLowerCase().includes(q);
        const matchRep = deal.assignedRepName.toLowerCase().includes(q);
        const matchCustomer = deal.customerName.toLowerCase().includes(q);
        if (!matchTitle && !matchCompany && !matchRep && !matchCustomer) {
          return false;
        }
      }

      return true;
    });
  }, [deals, filterState]);

  // Tổng giá trị các deal đang được chọn
  const selectedDealsTotalValue = useMemo((): number => {
    return deals
      .filter((d) => selectedDealIds.includes(d.id))
      .reduce((sum, d) => sum + d.dealValue, 0);
  }, [deals, selectedDealIds]);

  return {
    deals,
    filteredDeals,
    history,
    workloadStats,
    selectedDealIds,
    filterState,
    selectedDealsCount: selectedDealIds.length,
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
  };
};
