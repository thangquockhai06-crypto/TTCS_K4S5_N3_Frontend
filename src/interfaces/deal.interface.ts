export type DealStageType = 'New' | 'Contacted' | 'Negotiation' | 'Won';

export type DealPriorityType = 'High' | 'Medium' | 'Low';

export interface IDeal {
  id: string;
  title: string;
  customerId: string;
  customerName: string;
  company: string;
  companyAvatar: string;
  stage: DealStageType;
  value: number;
  probability: number;
  priority: DealPriorityType;
  expectedCloseDate: string;
  ownerName: string;
  ownerAvatar: string;
  tags: string[];
  daysInStage: number;
}

export interface IDealStageColumn {
  id: DealStageType;
  title: string;
  subtitle: string;
  accentColor: string;
  badgeBg: string;
}
