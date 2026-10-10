export type ReassignmentReasonType =
  | 'on_leave' // Người phụ trách nghỉ dài ngày (ốm, thai sản, phép năm)
  | 'overloaded' // Người phụ trách quá tải số lượng deal
  | 'performance' // Chuyển giao theo chuyên môn / ngành hàng phù hợp
  | 'reorganization' // Tái cơ cấu địa bàn / nhóm kinh doanh
  | 'other'; // Lý do khác

export interface IReassignmentHistoryItem {
  id: string;
  dealId: string;
  dealTitle: string;
  company: string;
  dealValue: number;
  fromRepId: string;
  fromRepName: string;
  fromRepAvatar?: string;
  toRepId: string;
  toRepName: string;
  toRepAvatar?: string;
  reason: ReassignmentReasonType;
  reasonDisplay: string;
  handoverNotes: string;
  transferredAt: string; // ISO string hoặc DD/MM/YYYY HH:mm
  transferredBy: string; // Trưởng nhóm thực hiện điều chuyển
}

export interface IReassignableDeal {
  id: string;
  title: string;
  customerId: string;
  customerName: string;
  company: string;
  companyAvatar?: string;
  dealValue: number; // VND
  winProbability: number; // %
  stage: string;
  stageName: string;
  assignedRepId: string;
  assignedRepName: string;
  assignedRepAvatar?: string;
  teamId: string;
  teamName: string;
  expectedCloseDate: string;
  lastActivityDate: string;
  daysWithoutActivity: number;
  tags: string[];
  history: ReadonlyArray<IReassignmentHistoryItem>;
}

export interface IReassignmentPayload {
  dealIds: ReadonlyArray<string>; // Danh sách 1 hoặc nhiều cơ hội cần chuyển quyền
  toRepId: string; // Nhân sự nhận mới
  reason: ReassignmentReasonType;
  reasonCustomText?: string;
  handoverNotes: string;
  notifyNewOwner: boolean;
  transferredBy: string;
}

export interface IReassignmentFilterState {
  fromRepId: string; // Lọc theo người phụ trách hiện tại
  toRepId: string; // Lọc theo người nhận (trong lịch sử)
  teamId: string; // Lọc theo nhóm
  stage: string; // Lọc theo giai đoạn
  searchQuery: string;
}

export interface IRepWorkloadStat {
  repId: string;
  repName: string;
  repAvatar: string;
  teamId: string;
  teamName: string;
  activeDealsCount: number;
  totalDealsValue: number;
  status: 'available' | 'optimal' | 'overloaded' | 'on_leave';
  maxCapacity: number;
}
