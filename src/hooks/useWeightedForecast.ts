import { useMemo, useState } from 'react';
import {
  ForecastPeriodType,
  IForecastDeal,
  IForecastFilterState,
  IForecastStageBreakdown,
  IForecastSummary,
  ISalesRepForecast,
  ISalesTeamForecast,
  PipelineStageType,
} from '../interfaces/forecast.interface';
import {
  INITIAL_FORECAST_DEALS,
  PIPELINE_STAGES,
  SALES_REPS,
  SALES_TEAMS,
} from '../mock/forecast.mock';

export interface IUseWeightedForecastReturn {
  deals: ReadonlyArray<IForecastDeal>;
  filteredDeals: ReadonlyArray<IForecastDeal>;
  summary: IForecastSummary;
  stageBreakdown: ReadonlyArray<IForecastStageBreakdown>;
  repsForecast: ReadonlyArray<ISalesRepForecast>;
  teamsForecast: ReadonlyArray<ISalesTeamForecast>;
  filterState: IForecastFilterState;
  setPeriod: (period: ForecastPeriodType) => void;
  setTeamId: (teamId: string) => void;
  setRepId: (repId: string) => void;
  setStage: (stage: string) => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
  updateDealProbability: (dealId: string, newProbability: number) => void;
  updateDealStage: (dealId: string, newStage: PipelineStageType) => void;
}

export const useWeightedForecast = (): IUseWeightedForecastReturn => {
  const [deals, setDeals] = useState<ReadonlyArray<IForecastDeal>>(INITIAL_FORECAST_DEALS);

  const [filterState, setFilterState] = useState<IForecastFilterState>({
    period: 'this_month',
    teamId: 'all',
    repId: 'all',
    stage: 'all',
    searchQuery: '',
  });

  const setPeriod = (period: ForecastPeriodType): void => {
    setFilterState((prev) => ({ ...prev, period }));
  };

  const setTeamId = (teamId: string): void => {
    setFilterState((prev) => ({ ...prev, teamId, repId: 'all' }));
  };

  const setRepId = (repId: string): void => {
    setFilterState((prev) => ({ ...prev, repId }));
  };

  const setStage = (stage: string): void => {
    setFilterState((prev) => ({ ...prev, stage }));
  };

  const setSearchQuery = (searchQuery: string): void => {
    setFilterState((prev) => ({ ...prev, searchQuery }));
  };

  const resetFilters = (): void => {
    setFilterState({
      period: 'this_month',
      teamId: 'all',
      repId: 'all',
      stage: 'all',
      searchQuery: '',
    });
  };

  const updateDealProbability = (dealId: string, newProbability: number): void => {
    const clamped = Math.max(0, Math.min(100, newProbability));
    setDeals((prevDeals) =>
      prevDeals.map((deal) => {
        if (deal.id === dealId) {
          return {
            ...deal,
            winProbability: clamped,
            weightedValue: Math.round(deal.dealValue * (clamped / 100)),
          };
        }
        return deal;
      })
    );
  };

  const updateDealStage = (dealId: string, newStage: PipelineStageType): void => {
    const stageConfig = PIPELINE_STAGES.find((s) => s.id === newStage);
    const prob = stageConfig ? stageConfig.defaultProbability : 50;
    setDeals((prevDeals) =>
      prevDeals.map((deal) => {
        if (deal.id === dealId) {
          return {
            ...deal,
            stage: newStage,
            stageName: stageConfig ? stageConfig.nameVi : newStage,
            winProbability: prob,
            weightedValue: Math.round(deal.dealValue * (prob / 100)),
          };
        }
        return deal;
      })
    );
  };

  // 1. Lọc Deals theo Kỳ dự kiến, Phòng ban, Nhân viên, Giai đoạn, Từ khóa
  const filteredDeals = useMemo((): ReadonlyArray<IForecastDeal> => {
    return deals.filter((deal) => {
      // Lọc theo kỳ
      if (filterState.period === 'this_month') {
        if (deal.period !== 'this_month') return false;
      } else if (filterState.period === 'next_month') {
        if (deal.period !== 'next_month') return false;
      } else if (filterState.period === 'this_quarter') {
        // Quý này bao gồm cả tháng này, tháng sau và cuối quý
        if (!['this_month', 'next_month', 'this_quarter'].includes(deal.period)) return false;
      }

      // Lọc theo Team
      if (filterState.teamId !== 'all' && deal.teamId !== filterState.teamId) {
        return false;
      }

      // Lọc theo Rep
      if (filterState.repId !== 'all' && deal.assignedRepId !== filterState.repId) {
        return false;
      }

      // Lọc theo Stage
      if (filterState.stage !== 'all' && deal.stage !== filterState.stage) {
        return false;
      }

      // Lọc theo Search Query
      if (filterState.searchQuery.trim()) {
        const q = filterState.searchQuery.toLowerCase().trim();
        const matchesTitle = deal.title.toLowerCase().includes(q);
        const matchesCompany = deal.company.toLowerCase().includes(q);
        const matchesRep = deal.assignedRepName.toLowerCase().includes(q);
        const matchesTeam = deal.teamName.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCompany && !matchesRep && !matchesTeam) {
          return false;
        }
      }

      return true;
    });
  }, [deals, filterState]);

  // 2. Tính toán tổng Quota Target theo scope lọc
  const totalQuotaTarget = useMemo((): number => {
    const isQuarter = filterState.period === 'this_quarter';

    let activeReps = SALES_REPS;
    if (filterState.teamId !== 'all') {
      activeReps = activeReps.filter((r) => r.teamId === filterState.teamId);
    }
    if (filterState.repId !== 'all') {
      activeReps = activeReps.filter((r) => r.id === filterState.repId);
    }

    return activeReps.reduce((sum, r) => sum + (isQuarter ? r.quotaQuarter : r.quotaMonth), 0);
  }, [filterState.period, filterState.teamId, filterState.repId]);

  // 3. Tính toán Tổng quan KPI (Summary)
  const summary = useMemo((): IForecastSummary => {
    let actualWonValue = 0;
    let pipelineValue = 0;
    let weightedForecastValue = 0;
    let wonCount = 0;
    let inProgressCount = 0;

    filteredDeals.forEach((deal) => {
      if (deal.stage === 'won') {
        actualWonValue += deal.dealValue;
        wonCount += 1;
      } else {
        pipelineValue += deal.dealValue;
        weightedForecastValue += deal.weightedValue;
        inProgressCount += 1;
      }
    });

    const totalProjectedValue = actualWonValue + weightedForecastValue;
    const gapToTarget = totalQuotaTarget - totalProjectedValue;
    const quotaAchievementRate = totalQuotaTarget > 0 ? (totalProjectedValue / totalQuotaTarget) * 100 : 0;
    const actualWonAchievementRate = totalQuotaTarget > 0 ? (actualWonValue / totalQuotaTarget) * 100 : 0;

    let periodLabel = 'Tháng này (T10/2026)';
    if (filterState.period === 'next_month') {
      periodLabel = 'Tháng sau (T11/2026)';
    } else if (filterState.period === 'this_quarter') {
      periodLabel = 'Quý này (Q4/2026)';
    } else if (filterState.period === 'all') {
      periodLabel = 'Toàn bộ thời gian';
    }

    return {
      periodLabel,
      totalQuotaTarget,
      actualWonValue,
      pipelineValue,
      weightedForecastValue,
      totalProjectedValue,
      quotaAchievementRate,
      actualWonAchievementRate,
      gapToTarget,
      totalDealsCount: filteredDeals.length,
      wonDealsCount: wonCount,
      inProgressDealsCount: inProgressCount,
    };
  }, [filteredDeals, totalQuotaTarget, filterState.period]);

  // 4. Phân tích theo từng Giai đoạn Phễu (Stage Breakdown)
  const stageBreakdown = useMemo((): ReadonlyArray<IForecastStageBreakdown> => {
    const totalWeighted = filteredDeals.reduce((sum, d) => sum + d.weightedValue, 0);

    return PIPELINE_STAGES.map((stageConfig) => {
      const stageDeals = filteredDeals.filter((d) => d.stage === stageConfig.id);
      const unweighted = stageDeals.reduce((sum, d) => sum + d.dealValue, 0);
      const weighted = stageDeals.reduce((sum, d) => sum + d.weightedValue, 0);
      const percentage = totalWeighted > 0 ? (weighted / totalWeighted) * 100 : 0;

      return {
        stage: stageConfig.id,
        stageName: stageConfig.nameVi,
        winProbability: stageConfig.defaultProbability,
        dealCount: stageDeals.length,
        unweightedValue: unweighted,
        weightedValue: weighted,
        percentageOfTotalWeighted: percentage,
        color: stageConfig.color,
      };
    });
  }, [filteredDeals]);

  // 5. Thống kê Dự báo theo từng Nhân viên Kinh doanh (Sales Rep Breakdown)
  const repsForecast = useMemo((): ReadonlyArray<ISalesRepForecast> => {
    const isQuarter = filterState.period === 'this_quarter';

    return SALES_REPS.map((rep) => {
      const repDeals = filteredDeals.filter((d) => d.assignedRepId === rep.id);
      let won = 0;
      let pipeline = 0;
      let weighted = 0;
      let wonCount = 0;

      repDeals.forEach((d) => {
        if (d.stage === 'won') {
          won += d.dealValue;
          wonCount += 1;
        } else {
          pipeline += d.dealValue;
          weighted += d.weightedValue;
        }
      });

      const quota = isQuarter ? rep.quotaQuarter : rep.quotaMonth;
      const totalProjected = won + weighted;
      const quotaAchieve = quota > 0 ? (totalProjected / quota) * 100 : 0;
      const actualWonRate = quota > 0 ? (won / quota) * 100 : 0;
      const gap = quota - totalProjected;

      return {
        repId: rep.id,
        repName: rep.name,
        repTitle: rep.title,
        repAvatar: rep.avatar,
        teamId: rep.teamId,
        teamName: rep.teamName,
        quotaTarget: quota,
        actualWonValue: won,
        pipelineValue: pipeline,
        weightedForecastValue: weighted,
        totalProjectedValue: totalProjected,
        quotaAchievementRate: quotaAchieve,
        actualWonRate,
        gapToTarget: gap,
        dealCount: repDeals.length,
        wonCount,
      };
    });
  }, [filteredDeals, filterState.period]);

  // 6. Thống kê Dự báo theo từng Nhóm Kinh doanh (Sales Team Breakdown)
  const teamsForecast = useMemo((): ReadonlyArray<ISalesTeamForecast> => {
    return SALES_TEAMS.map((team) => {
      const teamReps = repsForecast.filter((r) => r.teamId === team.id);
      const teamDeals = filteredDeals.filter((d) => d.teamId === team.id);

      const quota = teamReps.reduce((sum, r) => sum + r.quotaTarget, 0);
      const won = teamReps.reduce((sum, r) => sum + r.actualWonValue, 0);
      const pipeline = teamReps.reduce((sum, r) => sum + r.pipelineValue, 0);
      const weighted = teamReps.reduce((sum, r) => sum + r.weightedForecastValue, 0);
      const totalProjected = won + weighted;
      const quotaAchieve = quota > 0 ? (totalProjected / quota) * 100 : 0;
      const actualWonRate = quota > 0 ? (won / quota) * 100 : 0;
      const gap = quota - totalProjected;
      const wonCount = teamDeals.filter((d) => d.stage === 'won').length;

      return {
        teamId: team.id,
        teamName: team.name,
        managerName: team.managerName,
        managerAvatar: team.managerAvatar,
        memberCount: teamReps.length,
        quotaTarget: quota,
        actualWonValue: won,
        pipelineValue: pipeline,
        weightedForecastValue: weighted,
        totalProjectedValue: totalProjected,
        quotaAchievementRate: quotaAchieve,
        actualWonRate,
        gapToTarget: gap,
        dealCount: teamDeals.length,
        wonCount,
      };
    });
  }, [repsForecast, filteredDeals]);

  return {
    deals,
    filteredDeals,
    summary,
    stageBreakdown,
    repsForecast,
    teamsForecast,
    filterState,
    setPeriod,
    setTeamId,
    setRepId,
    setStage,
    setSearchQuery,
    resetFilters,
    updateDealProbability,
    updateDealStage,
  };
};
