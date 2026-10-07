export type SalesCatalogType =
  | 'industry'
  | 'company_size'
  | 'lead_source'
  | 'activity_type';

export interface ISalesCatalogTypeOption {
  type: SalesCatalogType;
  label: string;
  itemLabel: string;
}

export interface ISalesCatalogItem {
  id: string;
  type: SalesCatalogType;
  code: string;
  name: string;
  order_index: number;
  usage_count: number;
  is_system: boolean;
  is_active: boolean;
}

export interface ICreateSalesCatalogRequest {
  type: SalesCatalogType;
  code: string;
  name: string;
  order_index: number;
}

export interface IUpdateSalesCatalogRequest {
  code: string;
  name: string;
}

export interface ISalesCatalogFormValues {
  code: string;
  name: string;
}

export const SALES_CATALOG_TYPES: ReadonlyArray<ISalesCatalogTypeOption> = [
  { type: 'industry', label: 'Ngành nghề khách hàng', itemLabel: 'ngành nghề' },
  { type: 'company_size', label: 'Quy mô doanh nghiệp', itemLabel: 'quy mô' },
  { type: 'lead_source', label: 'Nguồn Lead', itemLabel: 'nguồn Lead' },
  { type: 'activity_type', label: 'Loại hoạt động', itemLabel: 'loại hoạt động' },
];
