export type OpportunityHistoryField =
  | 'stage'
  | 'value'
  | 'expectedCloseDate'
  | 'owner';

export interface IOpportunityHistoryEntry {
  id: string;
  opportunityId: string;
  field: OpportunityHistoryField;
  oldValue: string | number | null;
  newValue: string | number | null;
  performedBy: string | null;
  changedAt: string | null;
}

export interface IOpportunityHistoryFilter {
  field: OpportunityHistoryField | 'all';
  fromDate: string;
  toDate: string;
}
