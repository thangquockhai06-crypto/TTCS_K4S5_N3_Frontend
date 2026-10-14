import { axiosInstance } from '../utils/axiosInstance';
import {
  ILead,
  ILeadListResponse,
  ILeadCreatePayload,
  ILeadUpdatePayload,
  ILeadDuplicateMatch,
  ILeadMergePayload,
  ILeadConvertPayload,
  ILeadRoutingRule,
  ILeadEmbedSnippetResponse,
} from '../interfaces';

export interface IGetLeadsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  score_grade?: string;
  source?: string;
  campaign_id?: string;
  sla_overdue_only?: boolean;
  sort_by?: string;
  sort_order?: string;
}

export function normalizeLead(raw: any): ILead {
  if (!raw) return {} as ILead;
  const fullName =
    raw.full_name ||
    raw.fullName ||
    `${raw.last_name || raw.lastName || ''} ${raw.first_name || raw.firstName || ''}`.trim() ||
    'Chưa đặt tên';

  const scoreVal = typeof raw.score === 'number' ? raw.score : 50;
  const scoreGrade =
    raw.score_grade ||
    raw.scoreGrade ||
    (scoreVal >= 70 ? 'Hot' : scoreVal >= 40 ? 'Warm' : 'Cold');

  return {
    id: raw.id,
    first_name: raw.first_name || raw.firstName || '',
    last_name: raw.last_name || raw.lastName || '',
    full_name: fullName,
    email: raw.email || null,
    phone: raw.phone || null,
    company_name: raw.company_name || raw.company || null,
    title: raw.title || raw.job_title || raw.jobTitle || null,
    industry: raw.industry || null,
    region: raw.region || null,
    source: raw.source || 'Web Form',
    status: raw.status || 'UNASSIGNED',
    score: scoreVal,
    score_grade: scoreGrade,
    owner_id: raw.owner_id || raw.assigned_user_id || raw.assignedUserId || null,
    owner_name: raw.owner_name || raw.assigned_user_name || raw.assignedUserName || null,
    campaign_id: raw.campaign_id || raw.campaignId || null,
    campaign_name: raw.campaign_name || raw.campaignName || null,
    sla_deadline: raw.sla_deadline || raw.slaDeadline || null,
    is_sla_overdue: Boolean(raw.is_sla_overdue ?? raw.sla_overdue ?? raw.slaOverdue),
    rejection_reason: raw.rejection_reason || raw.rejectionReason || null,
    converted_customer_id: raw.converted_customer_id || raw.convertedCustomerId || null,
    converted_deal_id: raw.converted_deal_id || raw.convertedDealId || null,
    converted_at: raw.converted_at || raw.convertedAt || null,
    created_at: raw.created_at || raw.createdAt || new Date().toISOString(),
    updated_at: raw.updated_at || raw.updatedAt || new Date().toISOString(),
  };
}

class LeadService {
  async getLeads(params?: IGetLeadsParams): Promise<ILeadListResponse> {
    const response = await axiosInstance.get<any>('/leads', { params });
    if (Array.isArray(response.data)) {
      const totalHeader = response.headers?.['x-total-count'];
      const totalPagesHeader = response.headers?.['x-total-pages'];
      const total = totalHeader ? parseInt(totalHeader, 10) : response.data.length;
      const totalPages = totalPagesHeader ? parseInt(totalPagesHeader, 10) : 1;
      return {
        items: response.data.map(normalizeLead),
        total,
        page: params?.page || 1,
        limit: params?.limit || 25,
        total_pages: totalPages,
      };
    }

    const itemsRaw = response.data?.items || response.data?.data || [];
    const items = Array.isArray(itemsRaw) ? itemsRaw.map(normalizeLead) : [];
    return {
      items,
      total: typeof response.data?.total === 'number' ? response.data.total : items.length,
      page: response.data?.page || params?.page || 1,
      limit: response.data?.limit || params?.limit || 25,
      total_pages: response.data?.total_pages || 1,
    };
  }

  async getLead(id: string): Promise<ILead> {
    const response = await axiosInstance.get<any>(`/leads/${id}`);
    return normalizeLead(response.data);
  }

  async createLead(payload: ILeadCreatePayload): Promise<ILead> {
    const body = {
      fullName: `${payload.last_name || ''} ${payload.first_name || ''}`.trim() || 'Khách hàng mới',
      email: payload.email,
      phone: payload.phone,
      company: payload.company_name,
      jobTitle: payload.title,
      source: payload.source || 'Website Form',
      campaignId: payload.campaign_id || null,
      region: payload.region || 'Miền Bắc',
      industry: payload.industry || 'Công nghệ',
    };
    const response = await axiosInstance.post<any>('/leads', body);
    return normalizeLead(response.data);
  }

  async updateLead(id: string, payload: ILeadUpdatePayload): Promise<ILead> {
    const body: any = { ...payload };
    if (payload.first_name || payload.last_name) {
      body.fullName = `${payload.last_name || ''} ${payload.first_name || ''}`.trim();
    }
    if (payload.company_name) body.company = payload.company_name;
    if (payload.title) body.jobTitle = payload.title;
    if (payload.campaign_id) body.campaignId = payload.campaign_id;
    const response = await axiosInstance.put<any>(`/leads/${id}`, body);
    return normalizeLead(response.data);
  }

  async deleteLead(id: string): Promise<{ success: boolean; message: string }> {
    const response = await axiosInstance.delete<any>(`/leads/${id}`);
    return response.data || { success: true, message: 'Đã xóa đầu mối thành công' };
  }

  async acceptLead(id: string): Promise<ILead> {
    const response = await axiosInstance.post<any>(`/leads/${id}/accept`);
    return normalizeLead(response.data);
  }

  async rejectLead(id: string, reason: string): Promise<ILead> {
    const response = await axiosInstance.post<any>(`/leads/${id}/reject`, { rejectionReason: reason, reason });
    return normalizeLead(response.data);
  }

  async recalculateScore(id: string): Promise<{ score: number; score_grade: string }> {
    const response = await axiosInstance.post<any>(`/leads/${id}/recalculate-score`);
    const data = response.data;
    return {
      score: typeof data?.score === 'number' ? data.score : 50,
      score_grade: data?.score_grade || data?.scoreGrade || 'Warm',
    };
  }

  async checkDuplicates(id: string): Promise<{ duplicates: ILeadDuplicateMatch[]; count: number }> {
    const response = await axiosInstance.get<any>(`/leads/${id}/duplicates`);
    const dups = Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.data?.duplicates)
      ? response.data.duplicates
      : [];
    return { duplicates: dups, count: dups.length };
  }

  async mergeLeads(payload: ILeadMergePayload): Promise<ILead> {
    const body = {
      primaryLeadId: payload.primary_lead_id,
      duplicateLeadId: payload.duplicate_lead_ids?.[0],
      duplicate_lead_ids: payload.duplicate_lead_ids,
      primary_lead_id: payload.primary_lead_id,
    };
    const response = await axiosInstance.post<any>('/leads/merge', body);
    return normalizeLead(response.data);
  }

  async convertLead(id: string, payload: ILeadConvertPayload): Promise<{
    message: string;
    lead_id: string;
    customer_id: string;
    deal_id?: string;
  }> {
    const body = {
      existingCustomerId: payload.customer_id,
      createDeal: payload.create_deal ?? true,
      dealTitle: payload.deal_title,
      dealValue: payload.deal_value,
      expectedCloseDate: payload.expected_close_date,
      create_deal: payload.create_deal ?? true,
      deal_title: payload.deal_title,
      deal_value: payload.deal_value,
      expected_close_date: payload.expected_close_date,
    };
    const response = await axiosInstance.post<any>(`/leads/${id}/convert`, body);
    return {
      message: response.data?.message || 'Chuyển đổi đầu mối thành công!',
      lead_id: response.data?.lead_id || response.data?.leadId || id,
      customer_id: response.data?.customer_id || response.data?.customerId || '',
      deal_id: response.data?.deal_id || response.data?.dealId,
    };
  }

  async getEmbedSnippet(campaignCode?: string): Promise<ILeadEmbedSnippetResponse> {
    try {
      const response = await axiosInstance.get<ILeadEmbedSnippetResponse>('/leads/embed-snippet', {
        params: campaignCode ? { campaign_code: campaignCode } : undefined,
      });
      if (response.data && response.data.embed_html) {
        return response.data;
      }
    } catch (err) {
      console.warn('Backend embed-snippet call failed, using client-side fallback generator:', err);
    }

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    const campaignParam = campaignCode ? `?campaign=${encodeURIComponent(campaignCode)}` : '';
    const iframeCode = `<iframe src="${baseUrl}/embed/lead-form${campaignParam}" width="100%" height="480" frameborder="0" style="border:none; border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,0.08);" title="NexusCRM Lead Form"></iframe>`;
    const scriptCode = `<div id="nexus-lead-form"></div>\n<script src="${baseUrl}/static/lead-widget.js" data-campaign="${campaignCode || 'DEFAULT'}" async></script>`;

    return {
      embed_html: iframeCode,
      script_tag: scriptCode,
      form_action_url: '/api/v1/leads/public/submit',
      campaign_code: campaignCode || 'DEFAULT',
    };
  }

  async importExcel(file: File): Promise<{
    message: string;
    total_rows: number;
    success_count: number;
    error_count: number;
    errors: Array<{ row: number; error: string }>;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axiosInstance.post('/leads/import-excel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getRoutingRules(): Promise<ILeadRoutingRule[]> {
    const response = await axiosInstance.get<any[]>('/leads/routing-rules');
    return Array.isArray(response.data)
      ? response.data.map((r) => ({
          id: r.id,
          name: r.name,
          rule_type: r.rule_type || r.ruleType || 'ROUND_ROBIN',
          criteria_value: r.criteria_value || r.criterionValue,
          assigned_user_id: r.assigned_user_id || r.targetUserId,
          assigned_user_name: r.assigned_user_name || r.targetUserName,
          priority: r.priority || 1,
          is_active: r.is_active ?? r.isActive ?? true,
        }))
      : [];
  }

  async createRoutingRule(payload: Partial<ILeadRoutingRule>): Promise<ILeadRoutingRule> {
    const body = {
      name: payload.name,
      ruleType: payload.rule_type,
      criterionValue: payload.criteria_value,
      targetUserId: payload.assigned_user_id,
      priority: payload.priority || 1,
      isActive: payload.is_active ?? true,
    };
    const response = await axiosInstance.post<any>('/leads/routing-rules', body);
    return response.data;
  }
}

export const leadService = new LeadService();
