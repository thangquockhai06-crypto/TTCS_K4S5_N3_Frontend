export interface INotificationItem {
  id: string;
  title: string;
  description: string;
  timeAgo?: string | null;
  isRead: boolean;
  category?: 'deal' | 'security' | 'mention' | 'system';
  type?: string;
  targetType?: string | null;
  targetId?: string | null;
  linkUrl?: string | null;
  createdAt?: string;
}

export interface INotificationListResponse {
  items: INotificationItem[];
  unreadCount: number;
  total: number;
}

export interface IPdfTemplate {
  id: string;
  name: string;
  templateType: 'quotation' | 'contract';
  logoUrl: string | null;
  companyName: string;
  companyTaxCode: string | null;
  companyAddress: string | null;
  companyPhone: string | null;
  companyEmail: string | null;
  companyBankAccount: string | null;
  headerText: string | null;
  footerText: string | null;
  termsAndConditions: string | null;
  isDefault: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export type IPdfTemplatePayload = Omit<
  IPdfTemplate,
  'id' | 'createdAt' | 'updatedAt'
>;

export interface IQuotation {
  id: string;
  quoteNumber: string;
  title: string;
  customerName: string | null;
  customerCompany: string | null;
  grandTotal: number;
  status: string;
  templateId: string | null;
  createdAt: string | null;
}

export interface IContract {
  id: string;
  contractNumber: string;
  title: string;
  customerName: string | null;
  customerCompany: string | null;
  totalValue: number;
  status: string;
  templateId: string | null;
  createdAt: string | null;
}

export interface ITask {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  isCompleted: boolean;
  dueDate: string | null;
  assigneeName: string | null;
  creatorName: string | null;
  customerName: string | null;
  dealTitle: string | null;
  isOverdue: boolean;
}
