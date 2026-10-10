export type StagnantFlagReasonType = 'inactive_threshold' | 'overdue_close_date' | 'both';

export type StagnantSeverityType = 'critical' | 'warning' | 'watch';

export type InterventionStatusType = 'pending' | 'in_progress' | 'resolved' | 'lost';

export interface IStageThresholdRule {
  stageId: string;
  stageName: string;
  stageNameVi: string;
  maxInactiveDays: number; // Số ngày N tối đa không có hoạt động
  warningThresholdDays: number; // Mức cảnh báo sớm (N - 1 hoặc N - 2 ngày)
  description: string;
}

export interface IStagnantDeal {
  id: string;
  title: string;
  customerId: string;
  customerName: string;
  company: string;
  companyAvatar?: string;
  stage: string;
  stageName: string;
  dealValue: number; // Giá trị thương vụ (VND)
  winProbability: number; // Xác suất thắng (%)
  weightedValue: number; // Giá trị có trọng số
  assignedRepId: string;
  assignedRepName: string;
  assignedRepAvatar?: string;
  teamId: string;
  teamName: string;
  expectedCloseDate: string; // YYYY-MM-DD
  lastActivityDate: string; // YYYY-MM-DD
  lastActivityType: string; // 'call' | 'email' | 'meeting' | 'note' | 'proposal'
  lastActivityDescription: string;
  daysWithoutActivity: number; // Số ngày không có tương tác
  allowedInactiveDays: number; // Ngưỡng N cho giai đoạn hiện tại
  daysOverdue: number; // Số ngày quá hạn chốt (<= 0 là chưa quá hạn)
  flagReasons: ReadonlyArray<StagnantFlagReasonType>;
  severity: StagnantSeverityType;
  interventionStatus: InterventionStatusType;
  managerNotes?: string;
  lastInterventionAt?: string;
}

export interface IStagnantSummary {
  totalStagnantDeals: number;
  totalAtRiskValue: number; // Tổng giá trị các deal bị đình trệ (VND)
  totalAtRiskWeightedValue: number; // Tổng giá trị trọng số bị đe dọa (VND)
  inactiveThresholdCount: number; // Số deal bị gắn cờ do không có hoạt động > N ngày
  overdueCloseDateCount: number; // Số deal bị gắn cờ do quá ngày dự kiến chốt
  criticalSeverityCount: number; // Số deal mức độ nguy cấp (Đỏ)
  warningSeverityCount: number; // Số deal mức độ cảnh báo (Cam)
  pendingInterventionsCount: number; // Số deal đang chờ trưởng nhóm can thiệp
  resolvedInterventionsCount: number; // Số deal đã can thiệp thành công
  lastEvaluatedAt: string; // Thời điểm tác vụ đánh giá chạy gần nhất
}

export interface IStagnantFilterState {
  severity: string; // 'all' | 'critical' | 'warning' | 'watch'
  reason: string; // 'all' | 'inactive_threshold' | 'overdue_close_date'
  teamId: string; // 'all' hoặc teamId
  repId: string; // 'all' hoặc repId
  stageId: string; // 'all' hoặc stageId
  interventionStatus: string; // 'all' | 'pending' | 'in_progress' | 'resolved'
  searchQuery: string;
}

export interface IInterventionPayload {
  dealId: string;
  actionType: 'nudge_rep' | 'reassign_rep' | 'reschedule_close_date' | 'direct_manager_call' | 'mark_resolved';
  newRepId?: string;
  newCloseDate?: string;
  managerNote: string;
  deadlineDate?: string;
}
