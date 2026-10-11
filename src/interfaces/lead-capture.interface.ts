export type LeadInterestType =
  | 'crm_consultation'
  | 'enterprise_pricing'
  | 'system_integration'
  | 'product_demo'
  | 'partnership'
  | 'other';

export type EmbedFormatType = 'iframe' | 'script';

export interface IEmbedFormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'select' | 'textarea';
  required: boolean;
  placeholder: string;
  description?: string;
  options?: { value: string; label: string }[];
}

export interface IWebFormItem {
  id: string;
  title: string;
  type: string;
  status: 'active' | 'inactive';
  viewsCount: number;
  submissionsCount: number;
  conversionRate: string;
  embedKey: string;
  workflowConnection: string;
  description: string;
  submitAction?: string;
  successMessage?: string;
  fields?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface IEmbedFormConfig {
  id: string;
  formTitle: string;
  formDescription: string;
  ctaText: string;
  themeColor: string;
  leadSource: string;
  campaignTag: string;
  embedType: EmbedFormatType;
  width: string;
  enableHoneypot: boolean;
  enableRateLimiting: boolean;
  maxSubmissionsPerMinute: number;
  blockDurationSeconds: number;
  successMessage: string;
  redirectUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ILeadSubmissionDTO {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  interest: LeadInterestType;
  notes?: string;
  formId: string;
  leadSource: string;
  honeypotValue?: string;
}

export interface ILeadSubmission {
  id: string;
  formId: string;
  fullName: string;
  email: string;
  phone: string;
  company: string;
  interest: LeadInterestType;
  leadSource: string;
  status: 'New Lead';
  ipAddress: string;
  submittedAt: string;
  customerId?: string;
  campaignId?: string;
  campaignName?: string;
  notes?: string;
  history?: string[];
  isMerged?: boolean;
  mergedIntoId?: string;
  isSpamBlocked: boolean;
  blockReason?: string;
}

export interface IRateLimitRecord {
  ipAddress: string;
  timestamps: number[];
  blockedUntil?: number;
}

export interface IRateLimitCheckResult {
  allowed: boolean;
  remainingRequests: number;
  retryAfterSeconds: number;
  reason?: string;
}

export interface ILeadCaptureStats {
  totalForms: number;
  activeFormsCount: number;
  totalViews: number;
  totalLeads: number;
  spamBlocked: number;
  conversionRate: string;
}

export interface ICreateManualLeadDTO {
  fullName: string;
  role?: string;
  company: string;
  email: string;
  phone: string;
  leadSource: string; // Bắt buộc: Mọi lead nhập vào đều bắt buộc có nguồn
  interest: LeadInterestType;
  notes?: string;
  campaignId?: string;
}

export interface IExcelLeadRow {
  rowNumber: number;
  fullName: string;
  role: string;
  company: string;
  email: string;
  phone: string;
  leadSource: string; // Bắt buộc
  interest: LeadInterestType;
  notes: string;
  isValid: boolean;
  errors: string[];
}

export interface ILeadImportSummary {
  totalRows: number;
  validCount: number;
  errorCount: number;
}
