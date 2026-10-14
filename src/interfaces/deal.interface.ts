export type DealStageType = 'New' | 'Contacted' | 'Negotiation' | 'Won';

export type BackendDealStageType =
  | 'lead'
  | 'contacted'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost';

export type DealPriorityType = 'High' | 'Medium' | 'Low';

export interface IDealItem {
  id: string;
  dealId: string;
  productId?: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  billingCycle: 'monthly' | 'quarterly' | 'annual';
  subtotal: number;
}

export interface ICreateDealItemPayload {
  productId?: string;
  productName?: string;
  quantity: number;
  unitPrice?: number;
  discountPercent?: number;
  billingCycle?: string;
}

export interface IDeal {
  id: string;
  title: string;
  customerId: string;
  customerName: string;
  company: string;
  companyAvatar: string;
  stage: DealStageType | BackendDealStageType | string;
  value: number;
  probability: number;
  priority?: DealPriorityType;
  expectedCloseDate: string;
  closeDate?: string | null;
  actualValue?: number | null;
  lossReason?: string | null;
  lossCompetitor?: string | null;
  isStalled?: boolean;
  lastActivityAt?: string | null;
  ownerId?: string;
  ownerName: string;
  ownerAvatar: string;
  campaignId?: string | null;
  campaignName?: string | null;
  reassignmentReason?: string | null;
  items?: IDealItem[];
  tags: string[];
  daysInStage?: number;
  createdAt?: string;
}

export interface IDealStageColumn {
  id: DealStageType;
  title: string;
  subtitle: string;
  accentColor: string;
  badgeBg: string;
  expectedProbability?: number;
}

export interface IForecastPeriodSummary {
  period: string;
  dealCount: number;
  totalValue: number;
  weightedValue: number;
}

export interface ISalesForecast {
  totalPipelineValue: number;
  totalWeightedForecast: number;
  activeDealsCount: number;
  periods: IForecastPeriodSummary[];
  stageBreakdowns: Array<{
    stage: string;
    count: number;
    totalValue: number;
    weightedValue: number;
    winProbability: number;
  }>;
}

export interface ICloseDealPayload {
  stage: 'won' | 'lost';
  actualValue?: number;
  signingDate?: string;
  lossReason?: string;
  lossCompetitor?: string;
}

export interface IBulkReassignDealsPayload {
  dealIds: string[];
  newOwnerId: string;
  reason: string;
}
