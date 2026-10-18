import {
  IOpportunityHistoryEntry,
} from '../types/OpportunityHistory.types';

export interface IOpportunityHistoryService {
  getHistory(opportunityId: string): Promise<IOpportunityHistoryEntry[]>;
}

const MOCK_HISTORY: ReadonlyArray<
  Omit<IOpportunityHistoryEntry, 'opportunityId'>
> = [
  {
    id: 'mock-stage-001',
    field: 'stage',
    oldValue: 'contact',
    newValue: 'negotiation',
    performedBy: 'Nguyễn Minh Anh',
    changedAt: '2026-10-16T09:25:00+07:00',
  },
  {
    id: 'mock-value-001',
    field: 'value',
    oldValue: 125000,
    newValue: 148000,
    performedBy: 'Trần Thu Hà',
    changedAt: '2026-10-15T14:10:00+07:00',
  },
  {
    id: 'mock-close-date-001',
    field: 'expectedCloseDate',
    oldValue: '2026-11-20',
    newValue: '2026-12-05',
    performedBy: 'Nguyễn Minh Anh',
    changedAt: '2026-10-14T11:40:00+07:00',
  },
  {
    id: 'mock-owner-001',
    field: 'owner',
    oldValue: 'Lê Quốc Khánh',
    newValue: 'Nguyễn Minh Anh',
    performedBy: null,
    changedAt: '2026-10-12T08:05:00+07:00',
  },
];

class MockOpportunityHistoryService implements IOpportunityHistoryService {
  async getHistory(opportunityId: string): Promise<IOpportunityHistoryEntry[]> {
    await new Promise<void>((resolve) => window.setTimeout(resolve, 180));

    return MOCK_HISTORY.map((entry) => ({
      ...entry,
      opportunityId,
    }));
  }
}

export const opportunityHistoryService: IOpportunityHistoryService =
  new MockOpportunityHistoryService();
