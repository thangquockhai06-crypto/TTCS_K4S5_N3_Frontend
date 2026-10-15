export type LeadStatusType =
  | 'UNASSIGNED'
  | 'ASSIGNED'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'CONVERTED'
  | 'REJECTED';

export type LeadScoreGrade = 'Hot' | 'Warm' | 'Cold';

export interface ILead {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  company_name?: string | null;
  title?: string | null;
  industry?: string | null;
  region?: string | null;
  source: string;
  status: LeadStatusType;
  score: number;
  score_grade: LeadScoreGrade;
  owner_id?: string | null;
  owner_name?: string | null;
  campaign_id?: string | null;
  campaign_name?: string | null;
  sla_deadline?: string | null;
  is_sla_overdue: boolean;
  rejection_reason?: string | null;
  converted_customer_id?: string | null;
  converted_deal_id?: string | null;
  converted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ILeadListResponse {
  items: ILead[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ILeadCreatePayload {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  company_name?: string;
  title?: string;
  industry?: string;
  region?: string;
  source?: string;
  campaign_id?: string;
}

export interface ILeadUpdatePayload {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company_name?: string;
  title?: string;
  industry?: string;
  region?: string;
  source?: string;
  campaign_id?: string;
}

export interface ILeadDuplicateMatch {
  match_type: 'LEAD' | 'CUSTOMER';
  record_id: string;
  matched_field: string;
  record_name: string;
  record_email?: string | null;
  record_phone?: string | null;
  created_at: string;
}

export interface ILeadMergePayload {
  primary_lead_id: string;
  duplicate_lead_ids: string[];
  field_overrides?: Record<string, any>;
}

export interface ILeadConvertPayload {
  create_customer?: boolean;
  customer_id?: string;
  create_deal?: boolean;
  deal_title?: string;
  deal_value?: number;
  expected_close_date?: string;
}

export interface ILeadRoutingRule {
  id: string;
  name: string;
  rule_type: 'REGION' | 'INDUSTRY' | 'ROUND_ROBIN';
  criteria_value?: string | null;
  assigned_user_id: string;
  assigned_user_name?: string | null;
  priority: number;
  is_active: boolean;
}

export interface ICampaign {
  id: string;
  name: string;
  code: string;
  type: string;
  status: string;
  budget: number;
  expected_revenue: number;
  start_date?: string | null;
  end_date?: string | null;
  description?: string | null;
  leads_count: number;
  deals_count: number;
  actual_revenue: number;
  created_at: string;
  updated_at: string;
}

export interface ICampaignCreatePayload {
  name: string;
  code: string;
  type?: string;
  status?: string;
  budget?: number;
  expected_revenue?: number;
  start_date?: string;
  end_date?: string;
  description?: string;
}

export interface ILeadEmbedSnippetResponse {
  embed_html: string;
  script_tag: string;
  form_action_url: string;
  campaign_code?: string;
}
