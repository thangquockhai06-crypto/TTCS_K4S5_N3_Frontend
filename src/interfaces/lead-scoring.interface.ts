import { LeadInterestType, ILeadSubmission } from './lead-capture.interface';

export type LeadTemperatureType = 'Hot' | 'Warm' | 'Cold';

export type LeadScoringCategoryType =
  | 'industry'
  | 'company_size'
  | 'lead_source'
  | 'interest'
  | 'custom';

export type ConditionOperatorType = 'equals' | 'contains' | 'in';

export interface ILeadScoringCriterion {
  id: string;
  category: LeadScoringCategoryType;
  categoryLabel: string;
  criterionName: string;
  conditionField: 'industry' | 'companySize' | 'leadSource' | 'interest' | 'company' | 'custom';
  conditionOperator: ConditionOperatorType;
  conditionValue: string;
  points: number;
  isEnabled: boolean;
  description: string;
}

export interface ILeadScoreThresholds {
  hotMin: number;
  warmMin: number;
  coldMax: number;
  hotAction: string;
  warmAction: string;
  coldAction: string;
}

export interface ILeadScoringConfig {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  thresholds: ILeadScoreThresholds;
  criteria: ILeadScoringCriterion[];
  updatedAt: string;
}

export interface IMatchedCriterionItem {
  criterionId: string;
  criterionName: string;
  categoryLabel: string;
  points: number;
}

export interface ILeadScoreDetail {
  score: number;
  temperature: LeadTemperatureType;
  matchedCriteria: IMatchedCriterionItem[];
  recommendedAction: string;
  calculatedAt: string;
}

export interface IScoredLead extends ILeadSubmission {
  companySize: string;
  industry: string;
  score: number;
  temperature: LeadTemperatureType;
  scoreDetail: ILeadScoreDetail;
}

export interface ICreateCriterionDTO {
  category: LeadScoringCategoryType;
  criterionName: string;
  conditionField: 'industry' | 'companySize' | 'leadSource' | 'interest' | 'company' | 'custom';
  conditionOperator: ConditionOperatorType;
  conditionValue: string;
  points: number;
  description?: string;
  isEnabled?: boolean;
}

export type UpdateCriterionDTO = Partial<ICreateCriterionDTO>;

export interface ILeadScoringStats {
  totalLeads: number;
  hotCount: number;
  warmCount: number;
  coldCount: number;
  averageScore: number;
}
