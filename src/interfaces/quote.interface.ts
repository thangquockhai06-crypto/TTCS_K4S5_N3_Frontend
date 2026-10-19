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
  // S7-03: Quản lý phiên bản Báo giá
  isEffective?: boolean; // Chỉ một phiên bản ở trạng thái đang hiệu lực tại một thời điểm
  parentVersionId?: string; // ID phiên bản cha liền trước
  changeSummary?: string; // Lý do sửa đổi khi tạo phiên bản mới
  versionLabel?: string; // Tên nhãn phiên bản, vd: v1.0, v2.0
  // S7-04: Chuyển Báo giá thành Hợp đồng
  contractId?: string; // ID hợp đồng đã chuyển đổi
  contractNumber?: string; // Số hợp đồng kinh tế liên kết
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

/**
 * S7-03: Quản lý phiên bản Báo giá & So sánh Diff Interfaces
 */
export type DiffChangeType = 'unchanged' | 'added' | 'removed' | 'modified';

export interface IQuoteVersionMeta {
  id: string;
  quoteNumber: string;
  version: number;
  dealId: string;
  status: QuoteStatusType;
  isEffective: boolean;
  changeSummary?: string;
  grandTotal: number;
  totalDiscountPercent: number;
  createdAt: string;
  createdBy: string;
}

export interface IQuoteLineItemDiff {
  id: string;
  productId?: string;
  productName: string;
  unit: string;
  changeType: DiffChangeType;
  oldItem?: IQuoteLineItem;
  newItem?: IQuoteLineItem;
  quantityDiff: number;
  unitPriceDiff: number;
  discountDiff: number;
  lineTotalDiff: number;
}

export interface IQuoteTermsDiff {
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
  oldNotes?: string;
  newNotes?: string;
}

export interface IQuoteComparison {
  baseQuote: IQuote;
  targetQuote: IQuote;
  subtotalDiff: number;
  discountAmountDiff: number;
  discountPercentDiff: number;
  vatAmountDiff: number;
  grandTotalDiff: number;
  lineItemDiffs: IQuoteLineItemDiff[];
  termsDiff: IQuoteTermsDiff;
  totalAddedItems: number;
  totalRemovedItems: number;
  totalModifiedItems: number;
  totalUnchangedItems: number;
  hasAnyDifference: boolean;
}

export interface ICreateQuoteVersionDTO {
  baseQuoteId: string;
  changeSummary: string;
  createdBy?: string;
  creatorRole?: string;
}

