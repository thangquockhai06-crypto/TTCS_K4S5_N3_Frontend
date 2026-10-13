export type LeadRoutingStrategyType = 'region' | 'industry' | 'round-robin';

export type LeadRoutingStatusType =
  | 'pending'
  | 'processing'
  | 'assigned'
  | 'awaiting-manual-assignment'
  | 'failed';

export type LeadRoutingPendingReasonType = 'unmatched' | 'assignment-failed';

export interface ILeadRoutingEmployee {
  id: string;
  name: string;
  teamId: string;
  teamName: string;
}

export interface ILeadRoutingTeam {
  id: string;
  name: string;
  memberIds: string[];
}

export interface ILeadRoutingRule {
  id: string;
  name: string;
  strategy: LeadRoutingStrategyType;
  conditionValue: string;
  teamId: string;
  teamName: string;
  assigneeIds: string[];
  priority: number;
  isActive: boolean;
  updatedAt: string;
}

export interface ILeadRoutingRuleDraft {
  id?: string;
  name: string;
  strategy: LeadRoutingStrategyType;
  conditionValue: string;
  teamId: string;
  assigneeIds: string[];
  isActive: boolean;
}

export interface ILeadRoutingQueueItem {
  id: string;
  fullName: string;
  company: string;
  email: string;
  phone: string;
  industry: string;
  region: string;
  receivedAt: string;
  status: LeadRoutingStatusType;
  pendingReasonType?: LeadRoutingPendingReasonType;
  pendingReason?: string;
  assignmentResult?: string;
  assignedTo?: string;
  assignedAt?: string;
}

export interface ILeadRoutingSnapshot {
  rules: ILeadRoutingRule[];
  queue: ILeadRoutingQueueItem[];
  regions: string[];
  industries: string[];
  teams: ILeadRoutingTeam[];
  employees: ILeadRoutingEmployee[];
}

export type LeadRoutingQueueFilterType =
  | 'all'
  | 'awaiting-manual-assignment'
  | 'failed'
  | 'approaching-target'
  | 'overdue';
