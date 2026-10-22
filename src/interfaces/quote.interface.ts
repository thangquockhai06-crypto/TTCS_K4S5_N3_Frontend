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
  isEffective?: boolean;
  versionLabel?: string;
  changeSummary?: string;
  contractId?: string;
  contractNumber?: string;
  rejectionReason?: string;
  parentQuoteId?: string;
  accessToken?: string;
  shareUrl?: string;
  totalInWords?: string;
  templateId?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  creatorRole: string;
}

export type DiffChangeType = 'added' | 'removed' | 'modified' | 'unchanged';

export interface IQuoteLineItemDiff {
  id: string;
  productId?: string;
  productName: string;
  unit?: string;
  changeType: DiffChangeType;
  oldItem?: IQuoteLineItem;
  newItem?: IQuoteLineItem;
  quantityDiff: number;
  lineTotalDiff: number;
}

export interface ITermsDiff {
  validUntilChanged: boolean;
  oldValidUntil: string;
  newValidUntil: string;
  paymentTermsChanged: boolean;
  oldPaymentTerms: string;
  newPaymentTerms: string;
  deliveryTermsChanged: boolean;
  oldDeliveryTerms: string;
  newDeliveryTerms: string;
  notesChanged: boolean;
  oldNotes: string;
  newNotes: string;
  hasAnyTermsChanged: boolean;
}

export interface IQuoteComparison {
  baseQuote: IQuote;
  targetQuote: IQuote;
  lineItemDiffs: IQuoteLineItemDiff[];
  subtotalDiff: number;
  discountAmountDiff: number;
  discountPercentDiff: number;
  vatAmountDiff: number;
  grandTotalDiff: number;
  itemsAddedCount: number;
  itemsRemovedCount: number;
  itemsModifiedCount: number;
  totalAddedItems: number;
  totalRemovedItems: number;
  totalModifiedItems: number;
  totalUnchangedItems: number;
  termsDiff: ITermsDiff;
  summary?: {
    itemsAdded: number;
    itemsRemoved: number;
    itemsModified: number;
    subtotalDiff: number;
    discountDiff: number;
    vatDiff: number;
    grandTotalDiff: number;
    termsModified: boolean;
  };
}

export interface IQuoteCompareResult {
  versionA: IQuote;
  versionB: IQuote;
  priceDifference: number;
  discountDifference: number;
  itemsModified: boolean;
  termsModified: boolean;
  summary: string;
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
