export type LeadAssignmentWorkflowStatus = 'assigned' | 'accepted' | 'rejected' | 'contacted';

export type LeadSlaStateType = 'unknown' | 'within' | 'approaching' | 'overdue' | 'satisfied';

export interface ILeadAssignmentLead {
  id: string;
  company: string;
  leadName: string;
  email?: string;
  phone?: string;
  source: string;
  assignedTo: string;
  assignedAt: string;
  status: LeadAssignmentWorkflowStatus;
  firstContactAt?: string;
  slaDeadlineAt?: string;
  rejectionReason?: string;
  teamLead?: string;
}

export interface ILeadAssignmentSnapshot {
  leads: ILeadAssignmentLead[];
}
