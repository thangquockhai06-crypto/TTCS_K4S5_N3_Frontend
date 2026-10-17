/**
 * S7-01: Soạn thảo Báo giá (Quote Builder) Interfaces
 * Quy chuẩn: Naming PascalCase, tiền tố I cho Interface, hậu tố Type cho Type
 * Tuyệt đối 0% kiểu any.
 */

export type DiscountType = 'percent' | 'amount';

export type QuoteStatusType =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'sent'
  | 'accepted'
  | 'rejected';

export type QuoteApprovalLevelType = 'team_leader' | 'director';

export type QuoteApprovalActionType =
  | 'auto_approved'
  | 'approved'
  | 'rejected'
  | 'returned_for_edit'
  | 'sent';

export interface IQuoteApprovalHistoryEntry {
  id: string;
  action: QuoteApprovalActionType;
  approvalLevel?: QuoteApprovalLevelType;
  performedBy: string;
  performedByRole: string;
  comment: string;
  createdAt: string;
}

export interface IQuoteLineItem {
  id: string;
  productId?: string;
  productCode?: string;
  productName: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  floorPrice?: number;
  vatRate: number; // Phần trăm thuế VAT, vd: 0, 8, 10
  vatAmount: number;
  lineTotal: number;
}

export interface IQuoteApprovalAlert {
  requiresApproval: boolean;
  thresholdPercent: number;
  currentDiscountPercent: number;
  exceededByPercent: number;
  reason: string;
  ruleViolations: string[];
}

export interface IQuote {
  id: string;
  quoteNumber: string; // VD: BG-2026-089
  version: number;
  dealId: string;
  dealTitle: string;
  customerId: string;
  customerName: string;
  customerCompany?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerTaxCode?: string;
  items: IQuoteLineItem[];
  subtotal: number;
  totalDiscountAmount: number;
  totalDiscountPercent: number;
  totalVatAmount: number;
  grandTotal: number;
  discountThresholdPercent: number; // Ngưỡng đầu tiên (Trưởng nhóm), mặc định 15%
  requiresApproval: boolean;
  approvalAlert?: IQuoteApprovalAlert;
  validUntil: string; // ISO 8601 string hoặc YYYY-MM-DD
  paymentTerms: string;
  deliveryTerms: string;
  notes?: string;
  status: QuoteStatusType;
  approvalLevel?: QuoteApprovalLevelType;
  approvalHistory?: IQuoteApprovalHistoryEntry[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  creatorRole: string;
}

export interface ICreateQuoteDTO {
  dealId: string;
  dealTitle: string;
  customerId: string;
  customerName: string;
  customerCompany?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerTaxCode?: string;
  items: IQuoteLineItem[];
  validUntil: string;
  paymentTerms: string;
  deliveryTerms: string;
  notes?: string;
  status?: QuoteStatusType;
}

export interface IUpdateQuoteDTO {
  items?: IQuoteLineItem[];
  validUntil?: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  notes?: string;
  status?: QuoteStatusType;
}

export interface IProductCatalogItem {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  unitPrice: number;
  floorPrice?: number;
  description?: string;
  defaultVatRate: number;
}
