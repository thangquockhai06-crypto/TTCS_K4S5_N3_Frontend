/**
 * S6-08: Dòng thời gian tương tác (Timeline Activity) Interfaces
 * Quy chuẩn: Naming PascalCase, tiền tố I cho Interface, hậu tố Type cho Type
 * 100% strict TypeScript, tuyệt đối không dùng any.
 */

export type TimelineItemType =
  | 'call'
  | 'meeting'
  | 'email'
  | 'note'
  | 'deal_change'
  | 'quote_sent'
  | 'support_ticket'
  | 'status_touch';

export type TimelineTouchOutcomeType =
  | 'success'
  | 'followup_required'
  | 'pending_decision'
  | 'rescheduled'
  | 'cancelled';

export interface ITimelinePerformer {
  id: string;
  name: string;
  avatarUrl: string;
  role: string;
  email?: string;
}

export interface ITimelineItemMetadata {
  dealId?: string;
  dealTitle?: string;
  dealValue?: number;
  oldStage?: string;
  newStage?: string;
  quoteNumber?: string;
  quoteAmount?: number;
  quoteStatus?: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected';
  ticketId?: string;
  ticketPriority?: 'low' | 'medium' | 'high' | 'urgent';
  duration?: string;
  location?: string;
  attachmentName?: string;
  attachmentSize?: string;
  outcome?: TimelineTouchOutcomeType;
  outcomeLabel?: string;
  nextAction?: string;
  nextActionDate?: string;
}

export interface ITimelineItem {
  id: string;
  customerId: string;
  type: TimelineItemType;
  typeLabel: string;
  title: string;
  description: string;
  timestamp: string; // ISO 8601 string
  relativeTime: string;
  performer: ITimelinePerformer;
  metadata?: ITimelineItemMetadata;
  isPinned?: boolean;
}

export interface ITimelineFilterState {
  type: TimelineItemType | 'all';
  performerId: string; // 'all' hoặc tên/id nhân viên
  searchQuery: string;
}

export interface ITimelineHandoverBrief {
  totalTouchpoints: number;
  lastTouchpointDate: string;
  lastTouchpointPerformer: string;
  lastTouchpointTitle: string;
  activeDealsCount: number;
  totalDealValue: number;
  latestQuoteAmount: number;
  openTicketsCount: number;
  keyContextSummary: string;
  handoverAdvice: string;
}

export interface ICreateTimelineItemDTO {
  type: TimelineItemType;
  title: string;
  description: string;
  performerName?: string;
  performerRole?: string;
  duration?: string;
  quoteAmount?: number;
  outcome?: TimelineTouchOutcomeType;
  nextAction?: string;
  nextActionDate?: string;
}

export interface ITimelinePaginationState {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
}
