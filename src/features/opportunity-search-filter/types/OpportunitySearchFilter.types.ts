import { DealStageType, IDeal } from '../../../interfaces';

export interface IOpportunityFilterCriteria {
  stage: DealStageType | '';
  minValue: string;
  maxValue: string;
  closeDateFrom: string;
  closeDateTo: string;
  productId: string;
  ownerName: string;
}

export type OpportunityFilterKey = keyof IOpportunityFilterCriteria;

export interface ISavedOpportunityFilter {
  id: string;
  name: string;
  criteria: IOpportunityFilterCriteria;
}

export interface IOpportunityProductOption {
  id: string;
  name: string;
}

export type IOpportunityProductsByDeal = Readonly<Record<string, string>>;

export interface IOpportunityFilterOptions {
  stages: ReadonlyArray<{ id: DealStageType; label: string }>;
  products: ReadonlyArray<IOpportunityProductOption>;
  owners: ReadonlyArray<string>;
}

export interface IOpportunitySearchFilterState {
  filteredDeals: ReadonlyArray<IDeal>;
  draftCriteria: IOpportunityFilterCriteria;
  activeCriteria: IOpportunityFilterCriteria;
  savedFilters: ReadonlyArray<ISavedOpportunityFilter>;
  activePresetId: string | null;
  activeFilterCount: number;
  validationError: string | null;
  persistenceError: string | null;
  applyCriteria: () => boolean;
  clearAll: () => void;
  clearActiveCondition: (key: OpportunityFilterKey) => void;
  applySavedFilter: (filter: ISavedOpportunityFilter) => void;
  saveCurrentFilter: (name: string) => boolean;
  deleteSavedFilter: (id: string) => void;
  setDraftCriteria: (criteria: IOpportunityFilterCriteria) => void;
}
