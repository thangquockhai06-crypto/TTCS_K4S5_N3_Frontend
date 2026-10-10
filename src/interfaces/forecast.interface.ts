export type ForecastPeriodType = 'this_month' | 'next_month' | 'this_quarter' | 'custom' | 'all';

export type PipelineStageType = 'lead' | 'qualified' | 'demo' | 'proposal' | 'negotiation' | 'won' | 'lost';

export interface IPipelineStageConfig {
  id: PipelineStageType;
  name: string;
  nameVi: string;
  defaultProbability: number; // 0 - 100%
  color: string;
  bgColor: string;
  description: string;
}

export interface IForecastDeal {
  id: string;
  title: string;
  customerId: string;
  customerName: string;
  company: string;
  companyAvatar?: string;
  stage: PipelineStageType;
  stageName: string;
  dealValue: number; // Giá trị cơ hội (VND)
  winProbability: number; // Xác suất thắng của giai đoạn (%)
  weightedValue: number; // Giá trị dự báo có trọng số = dealValue * (winProbability / 100)
  expectedCloseDate: string; // YYYY-MM-DD
  period: ForecastPeriodType;
  assignedRepId: string;
  assignedRepName: string;
  assignedRepAvatar?: string;
  teamId: string;
  teamName: string;
  priority: 'Cao' | 'Trung bình' | 'Thấp';
  notes?: string;
}

export interface IForecastStageBreakdown {
  stage: PipelineStageType;
  stageName: string;
  winProbability: number;
  dealCount: number;
  unweightedValue: number; // Tổng giá trị cơ hội chưa tính trọng số
  weightedValue: number; // Tổng giá trị dự báo có trọng số
  percentageOfTotalWeighted: number;
  color: string;
}

export interface ISalesRepForecast {
  repId: string;
  repName: string;
  repTitle: string;
  repAvatar: string;
  teamId: string;
  teamName: string;
  quotaTarget: number; // Chỉ tiêu doanh số (VND)
  actualWonValue: number; // Số đã chốt thực tế (VND)
  pipelineValue: number; // Tổng giá trị cơ hội đang chạy (VND)
  weightedForecastValue: number; // Dự báo theo trọng số xác suất (VND)
  totalProjectedValue: number; // Tổng dự kiến = actualWonValue + weightedForecastValue
  quotaAchievementRate: number; // % Hoàn thành chỉ tiêu = (totalProjectedValue / quotaTarget) * 100
  actualWonRate: number; // % Chốt thực tế / Chỉ tiêu = (actualWonValue / quotaTarget) * 100
  gapToTarget: number; // Chênh lệch so với chỉ tiêu (quotaTarget - totalProjectedValue)
  dealCount: number;
  wonCount: number;
}

export interface ISalesTeamForecast {
  teamId: string;
  teamName: string;
  managerName: string;
  managerAvatar: string;
  memberCount: number;
  quotaTarget: number; // Chỉ tiêu nhóm (VND)
  actualWonValue: number; // Đã chốt thực tế nhóm
  pipelineValue: number; // Tổng cơ hội pipeline
  weightedForecastValue: number; // Dự báo trọng số nhóm
  totalProjectedValue: number; // Tổng dự kiến nhóm
  quotaAchievementRate: number; // % Đạt chỉ tiêu nhóm
  actualWonRate: number; // % Chốt thực tế nhóm
  gapToTarget: number; // Chênh lệch chỉ tiêu nhóm
  dealCount: number;
  wonCount: number;
}

export interface IForecastSummary {
  periodLabel: string;
  totalQuotaTarget: number; // Tổng chỉ tiêu doanh số toàn công ty / phạm vi lọc
  actualWonValue: number; // Số đã chốt thực tế (100% Won)
  pipelineValue: number; // Tổng giá trị cơ hội đang chạy
  weightedForecastValue: number; // Dự báo doanh số tính theo trọng số xác suất
  totalProjectedValue: number; // Tổng doanh số kỳ vọng hoàn thành = Actual + Weighted
  quotaAchievementRate: number; // Tỷ lệ đạt chỉ tiêu (%)
  actualWonAchievementRate: number; // Tỷ lệ chốt thực tế (%)
  gapToTarget: number; // Khoảng chênh lệch / thiếu hụt so với chỉ tiêu
  totalDealsCount: number; // Tổng số cơ hội
  wonDealsCount: number; // Số cơ hội đã chốt thành công
  inProgressDealsCount: number; // Số cơ hội đang đàm phán/chăm sóc
}

export interface IForecastFilterState {
  period: ForecastPeriodType;
  teamId: string; // 'all' hoặc teamId
  repId: string; // 'all' hoặc repId
  stage: string; // 'all' hoặc stage id
  searchQuery: string;
}

export interface IForecastExportData {
  summary: IForecastSummary;
  deals: ReadonlyArray<IForecastDeal>;
  teams: ReadonlyArray<ISalesTeamForecast>;
  reps: ReadonlyArray<ISalesRepForecast>;
  generatedAt: string;
}
