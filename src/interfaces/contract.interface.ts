/**
 * S7-04 & S7-07: Hợp đồng & Cảnh báo Tái ký Interfaces.
 * Quy chuẩn: Naming PascalCase, tiền tố I cho Interface. Tuyệt đối 0% kiểu any.
 */

export type ContractStatusType =
  | 'active'
  | 'expiring_soon'
  | 'expired'
  | 'renewed'
  | 'terminated';

export interface IContractItem {
  id?: string;
  productId?: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountAmount: number;
  lineTotal: number;
}

export interface IContract {
  id: string;
  contractNumber: string;
  title: string;
  quotationId: string;
  quotationNumber?: string;
  dealId: string;
  dealTitle?: string;
  customerId: string;
  customerName?: string;
  customerCompany?: string;
  customerTaxCode?: string;
  ownerId: string;
  ownerName?: string;
  totalValue: number;
  totalInWords?: string;
  signingDate: string;
  effectiveDate: string;
  expiryDate: string;
  remainingDays: number;
  isExpiringSoon: boolean;
  isExpired: boolean;
  paymentTerms?: string;
  deliveryTerms?: string;
  status: ContractStatusType;
  templateId?: string;
  items: IContractItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ICreateContractDTO {
  quotationId: string;
  contractNumber: string;
  title?: string;
  signingDate: string;
  effectiveDate: string;
  expiryDate: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  templateId?: string;
  notes?: string;
}

export interface IContractRenewalDTO {
  title?: string;
  expectedCloseDate?: string;
  expectedValue?: number;
  renewalProbability?: number;
  notes?: string;
}
