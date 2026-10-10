import { useMemo, useState } from 'react';
import {
  IInterventionPayload,
  IStageThresholdRule,
  IStagnantDeal,
  IStagnantFilterState,
  IStagnantSummary,
  StagnantFlagReasonType,
  StagnantSeverityType,
} from '../interfaces/stagnant-deal.interface';
import {
  DEFAULT_STAGE_THRESHOLDS,
  INITIAL_STAGNANT_DEALS,
} from '../mock/stagnant-deals.mock';

export interface IUseStagnantDealsReturn {
  deals: ReadonlyArray<IStagnantDeal>;
  filteredDeals: ReadonlyArray<IStagnantDeal>;
  summary: IStagnantSummary;
  thresholdRules: ReadonlyArray<IStageThresholdRule>;
  filterState: IStagnantFilterState;
  isEvaluating: boolean;
  setSeverityFilter: (severity: string) => void;
  setReasonFilter: (reason: string) => void;
  setTeamFilter: (teamId: string) => void;
  setRepFilter: (repId: string) => void;
  setStageFilter: (stageId: string) => void;
  setStatusFilter: (status: string) => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
  updateStageThreshold: (stageId: string, newMaxDays: number) => void;
  performIntervention: (payload: IInterventionPayload) => void;
  runDailyEvaluationCron: () => Promise<void>;
}

export const useStagnantDeals = (): IUseStagnantDealsReturn => {
  const [deals, setDeals] = useState<ReadonlyArray<IStagnantDeal>>(INITIAL_STAGNANT_DEALS);
  const [thresholdRules, setThresholdRules] = useState<ReadonlyArray<IStageThresholdRule>>(
    DEFAULT_STAGE_THRESHOLDS
  );
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [lastEvaluatedAt, setLastEvaluatedAt] = useState<string>('Hôm nay lúc 00:00 (Tự động)');

  const [filterState, setFilterState] = useState<IStagnantFilterState>({
    severity: 'all',
    reason: 'all',
    teamId: 'all',
    repId: 'all',
    stageId: 'all',
    interventionStatus: 'all',
    searchQuery: '',
  });

  const setSeverityFilter = (severity: string): void => {
    setFilterState((prev) => ({ ...prev, severity }));
  };

  const setReasonFilter = (reason: string): void => {
    setFilterState((prev) => ({ ...prev, reason }));
  };

  const setTeamFilter = (teamId: string): void => {
    setFilterState((prev) => ({ ...prev, teamId, repId: 'all' }));
  };

  const setRepFilter = (repId: string): void => {
    setFilterState((prev) => ({ ...prev, repId }));
  };

  const setStageFilter = (stageId: string): void => {
    setFilterState((prev) => ({ ...prev, stageId }));
  };

  const setStatusFilter = (interventionStatus: string): void => {
    setFilterState((prev) => ({ ...prev, interventionStatus }));
  };

  const setSearchQuery = (searchQuery: string): void => {
    setFilterState((prev) => ({ ...prev, searchQuery }));
  };

  const resetFilters = (): void => {
    setFilterState({
      severity: 'all',
      reason: 'all',
      teamId: 'all',
      repId: 'all',
      stageId: 'all',
      interventionStatus: 'all',
      searchQuery: '',
    });
  };

  // Cập nhật cấu hình ngưỡng N ngày cho giai đoạn
  const updateStageThreshold = (stageId: string, newMaxDays: number): void => {
    const clamped = Math.max(1, Math.min(60, newMaxDays));
    setThresholdRules((prevRules) =>
      prevRules.map((rule) => {
        if (rule.stageId === stageId) {
          return {
            ...rule,
            maxInactiveDays: clamped,
            warningThresholdDays: Math.max(1, clamped - 2),
          };
        }
        return rule;
      })
    );

    // Cập nhật lại số ngày được phép trên danh sách deal tương ứng
    setDeals((prevDeals) =>
      prevDeals.map((deal) => {
        if (deal.stage === stageId) {
          const isInactive = deal.daysWithoutActivity > clamped;
          const isOverdue = deal.daysOverdue > 0;
          const reasons: StagnantFlagReasonType[] = [];
          if (isInactive) reasons.push('inactive_threshold');
          if (isOverdue) reasons.push('overdue_close_date');

          let sev: StagnantSeverityType = 'watch';
          if (isInactive && isOverdue) sev = 'critical';
          else if (isInactive || isOverdue) sev = 'warning';

          return {
            ...deal,
            allowedInactiveDays: clamped,
            flagReasons: reasons,
            severity: sev,
          };
        }
        return deal;
      })
    );
  };

  // Xử lý hành động can thiệp của Trưởng nhóm
  const performIntervention = (payload: IInterventionPayload): void => {
    const nowStr = new Date().toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    setDeals((prevDeals) =>
      prevDeals.map((deal) => {
        if (deal.id === payload.dealId) {
          let updatedStatus = deal.interventionStatus;
          if (payload.actionType === 'mark_resolved') {
            updatedStatus = 'resolved';
          } else {
            updatedStatus = 'in_progress';
          }

          let updatedCloseDate = deal.expectedCloseDate;
          if (payload.actionType === 'reschedule_close_date' && payload.newCloseDate) {
            updatedCloseDate = payload.newCloseDate;
          }

          return {
            ...deal,
            expectedCloseDate: updatedCloseDate,
            interventionStatus: updatedStatus,
            managerNotes: payload.managerNote,
            lastInterventionAt: nowStr,
          };
        }
        return deal;
      })
    );
  };

  // Mô phỏng chạy tác vụ đánh giá hàng ngày (Daily Evaluation Task)
  const runDailyEvaluationCron = async (): Promise<void> => {
    setIsEvaluating(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    const now = new Date();
    const formattedDate = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')} ngày ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;

    setLastEvaluatedAt(`Vừa quét lúc ${formattedDate}`);
    setIsEvaluating(false);
  };

  // Lọc cơ hội đình trệ theo bộ lọc của Trưởng nhóm
  const filteredDeals = useMemo((): ReadonlyArray<IStagnantDeal> => {
    return deals.filter((deal) => {
      // 1. Lọc theo Mức độ nghiêm trọng
      if (filterState.severity !== 'all' && deal.severity !== filterState.severity) {
        return false;
      }

      // 2. Lọc theo Lý do gắn cờ
      if (filterState.reason !== 'all') {
        if (filterState.reason === 'inactive_threshold') {
          if (!deal.flagReasons.includes('inactive_threshold')) return false;
        } else if (filterState.reason === 'overdue_close_date') {
          if (!deal.flagReasons.includes('overdue_close_date')) return false;
        }
      }

      // 3. Lọc theo Nhóm
      if (filterState.teamId !== 'all' && deal.teamId !== filterState.teamId) {
        return false;
      }

      // 4. Lọc theo Nhân sự
      if (filterState.repId !== 'all' && deal.assignedRepId !== filterState.repId) {
        return false;
      }

      // 5. Lọc theo Giai đoạn
      if (filterState.stageId !== 'all' && deal.stage !== filterState.stageId) {
        return false;
      }

      // 6. Lọc theo Trạng thái can thiệp
      if (
        filterState.interventionStatus !== 'all' &&
        deal.interventionStatus !== filterState.interventionStatus
      ) {
        return false;
      }

      // 7. Lọc theo Từ khóa tìm kiếm
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

  // Tính toán tóm tắt chỉ số KPI
  const summary = useMemo((): IStagnantSummary => {
    let totalAtRisk = 0;
    let totalAtRiskWeighted = 0;
    let inactiveCount = 0;
    let overdueCount = 0;
    let criticalCount = 0;
    let warningCount = 0;
    let pendingCount = 0;
    let resolvedCount = 0;

    deals.forEach((deal) => {
      totalAtRisk += deal.dealValue;
      totalAtRiskWeighted += deal.weightedValue;

      if (deal.flagReasons.includes('inactive_threshold')) inactiveCount += 1;
      if (deal.flagReasons.includes('overdue_close_date')) overdueCount += 1;

      if (deal.severity === 'critical') criticalCount += 1;
      else if (deal.severity === 'warning') warningCount += 1;

      if (deal.interventionStatus === 'pending') pendingCount += 1;
      else if (deal.interventionStatus === 'resolved') resolvedCount += 1;
    });

    return {
      totalStagnantDeals: deals.length,
      totalAtRiskValue: totalAtRisk,
      totalAtRiskWeightedValue: totalAtRiskWeighted,
      inactiveThresholdCount: inactiveCount,
      overdueCloseDateCount: overdueCount,
      criticalSeverityCount: criticalCount,
      warningSeverityCount: warningCount,
      pendingInterventionsCount: pendingCount,
      resolvedInterventionsCount: resolvedCount,
      lastEvaluatedAt,
    };
  }, [deals, lastEvaluatedAt]);

  return {
    deals,
    filteredDeals,
    summary,
    thresholdRules,
    filterState,
    isEvaluating,
    setSeverityFilter,
    setReasonFilter,
    setTeamFilter,
    setRepFilter,
    setStageFilter,
    setStatusFilter,
    setSearchQuery,
    resetFilters,
    updateStageThreshold,
    performIntervention,
    runDailyEvaluationCron,
  };
};
