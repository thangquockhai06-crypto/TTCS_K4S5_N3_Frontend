import {
  IOpportunityProductOption,
  IOpportunityProductsByDeal,
} from '../types/OpportunitySearchFilter.types';

export const MOCK_OPPORTUNITY_PRODUCTS: ReadonlyArray<IOpportunityProductOption> = [
  { id: 'demo-cloud-crm', name: 'Nexus Cloud CRM' },
  { id: 'demo-sales-analytics', name: 'Sales Analytics Suite' },
  { id: 'demo-enterprise-platform', name: 'Enterprise Platform' },
];

export const MOCK_OPPORTUNITY_PRODUCT_BY_DEAL: IOpportunityProductsByDeal = {
  'deal-101': 'demo-cloud-crm',
  'deal-102': 'demo-enterprise-platform',
  'deal-103': 'demo-sales-analytics',
  'deal-104': 'demo-cloud-crm',
  'deal-105': 'demo-sales-analytics',
  'deal-106': 'demo-cloud-crm',
  'deal-107': 'demo-enterprise-platform',
  'deal-108': 'demo-sales-analytics',
  'deal-109': 'demo-enterprise-platform',
  'deal-110': 'demo-cloud-crm',
  'deal-111': 'demo-sales-analytics',
  'deal-112': 'demo-enterprise-platform',
};
