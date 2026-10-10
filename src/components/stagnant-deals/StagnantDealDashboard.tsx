import React, { useState } from 'react';
import { IStagnantDeal } from '../../interfaces/stagnant-deal.interface';
import { useStagnantDeals } from '../../hooks/useStagnantDeals';
import { StagnantDealFilter } from './StagnantDealFilter';
import { StagnantDealSummaryCards } from './StagnantDealSummaryCards';
import { StagnantDealsTable } from './StagnantDealsTable';
import { StagnantInterventionModal } from './StagnantInterventionModal';
import { StageThresholdConfigModal } from './StageThresholdConfigModal';
import styles from './StagnantDealDashboard.module.css';

export const StagnantDealDashboard: React.FC = () => {
  const {
    filteredDeals,
    summary,
    thresholdRules,
    filterState,
    isEvaluating,
    setSeverityFilter,
    setReasonFilter,
    setTeamFilter,
    setRepFilter,
    setStatusFilter,
    setSearchQuery,
    resetFilters,
    updateStageThreshold,
    performIntervention,
    runDailyEvaluationCron,
  } = useStagnantDeals();

  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [selectedDealForIntervention, setSelectedDealForIntervention] = useState<IStagnantDeal | null>(
    null
  );

  return (
    <main className={styles.stagnantDashboard}>
      {/* 1. Các thẻ KPI rủi ro thương vụ đình trệ */}
      <StagnantDealSummaryCards
        summary={summary}
        isEvaluating={isEvaluating}
        onTriggerEvaluation={runDailyEvaluationCron}
      />

      {/* 2. Bộ lọc dành riêng cho Trưởng nhóm */}
      <StagnantDealFilter
        filterState={filterState}
        onSeverityChange={setSeverityFilter}
        onReasonChange={setReasonFilter}
        onTeamChange={setTeamFilter}
        onRepChange={setRepFilter}
        onStatusChange={setStatusFilter}
        onSearchChange={setSearchQuery}
        onReset={resetFilters}
        onOpenConfigModal={() => setIsConfigModalOpen(true)}
      />

      {/* 3. Bảng cơ hội có cờ cảnh báo & Nút can thiệp */}
      <StagnantDealsTable
        deals={filteredDeals}
        onSelectDealForIntervention={(deal) => setSelectedDealForIntervention(deal)}
      />

      {/* Modal 1: Cấu hình số ngày N không hoạt động cho từng giai đoạn */}
      <StageThresholdConfigModal
        isOpen={isConfigModalOpen}
        thresholdRules={thresholdRules}
        onClose={() => setIsConfigModalOpen(false)}
        onSaveRule={updateStageThreshold}
      />

      {/* Modal 2: Can thiệp thương vụ cho Trưởng nhóm */}
      <StagnantInterventionModal
        isOpen={Boolean(selectedDealForIntervention)}
        deal={selectedDealForIntervention}
        onClose={() => setSelectedDealForIntervention(null)}
        onSubmit={performIntervention}
      />
    </main>
  );
};
