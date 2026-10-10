import React, { useState } from 'react';
import {
  Briefcase,
  Building2,
  Download,
  Layers,
  Printer,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { useWeightedForecast } from '../../hooks/useWeightedForecast';
import { ForecastComparisonChart } from './ForecastComparisonChart';
import { ForecastDealsTable } from './ForecastDealsTable';
import { ForecastPeriodFilter } from './ForecastPeriodFilter';
import { ForecastRepBreakdown } from './ForecastRepBreakdown';
import { ForecastStagePipelineChart } from './ForecastStagePipelineChart';
import { ForecastSummaryCards } from './ForecastSummaryCards';
import { ForecastTeamBreakdown } from './ForecastTeamBreakdown';
import styles from './WeightedForecastDashboard.module.css';

export type ForecastViewTabType = 'all' | 'stages' | 'teams' | 'reps' | 'deals';

export const WeightedForecastDashboard: React.FC = () => {
  const {
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
  } = useWeightedForecast();

  const [activeTab, setActiveTab] = useState<ForecastViewTabType>('all');

  const handlePrint = (): void => {
    window.print();
  };

  const handleExportCSV = (): void => {
    const headers = [
      'Mã Cơ Hội',
      'Tên Cơ Hội',
      'Khách Hàng',
      'Giai Đoạn',
      'Giá Trị Gốc (VND)',
      'Xác Suất (%)',
      'Dự Báo Trọng Số (VND)',
      'Ngày Dự Kiến',
      'Nhân Viên Phụ Trách',
      'Phòng Ban',
    ];

    const rows = filteredDeals.map((d) => [
      d.id,
      `"${d.title.replace(/"/g, '""')}"`,
      `"${d.company.replace(/"/g, '""')}"`,
      `"${d.stageName}"`,
      d.dealValue,
      d.winProbability,
      d.weightedValue,
      d.expectedCloseDate,
      `"${d.assignedRepName}"`,
      `"${d.teamName}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NexusCRM_Forecast_${filterState.period}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className={styles.forecastDashboard}>
      {/* 1. Thẻ tóm tắt chỉ số KPI & Doanh số trọng số */}
      <ForecastSummaryCards summary={summary} />

      {/* 2. Bộ lọc kỳ dự kiến chốt (Tháng này / Tháng sau / Quý này) & Phòng ban / Nhân sự */}
      <ForecastPeriodFilter
        filterState={filterState}
        onPeriodChange={setPeriod}
        onTeamChange={setTeamId}
        onRepChange={setRepId}
        onStageChange={setStage}
        onSearchChange={setSearchQuery}
        onReset={resetFilters}
      />

      {/* 3. Thanh chuyển đổi góc nhìn phân tích (Tabs) & Nút xuất báo cáo */}
      <div className={styles.forecastDashboard__tabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'all'}
          className={`${styles.forecastDashboard__tab} ${
            activeTab === 'all' ? styles['forecastDashboard__tab--active'] : ''
          }`}
          onClick={() => setActiveTab('all')}
        >
          <Sparkles size={16} />
          Tổng Quan Dự Báo
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'stages'}
          className={`${styles.forecastDashboard__tab} ${
            activeTab === 'stages' ? styles['forecastDashboard__tab--active'] : ''
          }`}
          onClick={() => setActiveTab('stages')}
        >
          <Layers size={16} />
          Theo Giai Đoạn Phễu ({stageBreakdown.length})
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'teams'}
          className={`${styles.forecastDashboard__tab} ${
            activeTab === 'teams' ? styles['forecastDashboard__tab--active'] : ''
          }`}
          onClick={() => setActiveTab('teams')}
        >
          <Building2 size={16} />
          Theo Nhóm Kinh Doanh ({teamsForecast.length})
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'reps'}
          className={`${styles.forecastDashboard__tab} ${
            activeTab === 'reps' ? styles['forecastDashboard__tab--active'] : ''
          }`}
          onClick={() => setActiveTab('reps')}
        >
          <UserCheck size={16} />
          Theo Nhân Viên ({repsForecast.length})
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'deals'}
          className={`${styles.forecastDashboard__tab} ${
            activeTab === 'deals' ? styles['forecastDashboard__tab--active'] : ''
          }`}
          onClick={() => setActiveTab('deals')}
        >
          <Briefcase size={16} />
          Chi Tiết Cơ Hội ({filteredDeals.length})
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className={styles.forecastDashboard__tab}
            onClick={handleExportCSV}
            title="Xuất bảng số liệu ra file CSV"
          >
            <Download size={15} />
            Xuất CSV
          </button>
          <button
            type="button"
            className={styles.forecastDashboard__tab}
            onClick={handlePrint}
            title="In báo cáo dự báo"
          >
            <Printer size={15} />
            In Báo Cáo
          </button>
        </div>
      </div>

      {/* 4. Nội dung theo từng Tab */}
      {(activeTab === 'all' || activeTab === 'stages') && (
        <ForecastComparisonChart summary={summary} />
      )}

      {(activeTab === 'all' || activeTab === 'stages') && (
        <ForecastStagePipelineChart stageBreakdown={stageBreakdown} />
      )}

      {(activeTab === 'all' || activeTab === 'teams') && (
        <ForecastTeamBreakdown
          teamsForecast={teamsForecast}
          onSelectTeam={(tId) => setTeamId(tId)}
        />
      )}

      {(activeTab === 'all' || activeTab === 'reps') && (
        <ForecastRepBreakdown
          repsForecast={repsForecast}
          onSelectRep={(rId) => setRepId(rId)}
        />
      )}

      {(activeTab === 'all' || activeTab === 'deals') && (
        <ForecastDealsTable
          deals={filteredDeals}
          onUpdateProbability={updateDealProbability}
          onUpdateStage={updateDealStage}
        />
      )}
    </main>
  );
};
