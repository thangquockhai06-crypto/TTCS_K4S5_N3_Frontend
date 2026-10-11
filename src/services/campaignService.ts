import {
  ICampaign,
  ICreateCampaignDTO,
  ICampaignPerformanceSummary,
} from '../interfaces/campaign.interface';
import { ILeadSubmission } from '../interfaces/lead-capture.interface';
import { IDeal } from '../interfaces/deal.interface';

const CAMPAIGNS_STORAGE_KEY = 'nexus_crm_campaigns_v4';

// 2 minimal initial sample campaigns
export const DEFAULT_CAMPAIGNS: ICampaign[] = [
  {
    id: 'camp-01',
    name: 'Chiến dịch Google Ads Search Doanh Nghiệp Q2',
    code: 'CAMP-GOOGLE-Q2',
    channel: 'Google Ads',
    budget: 25000000,
    startDate: '2026-09-01',
    endDate: '2026-10-31',
    status: 'active',
    targetLeads: 30,
    description: 'Thu hút lead từ khóa giải pháp CRM và chuyển đổi số cho doanh nghiệp B2B.',
    createdAt: '2026-09-01 08:00',
    updatedAt: '2026-10-10 10:00',
  },
  {
    id: 'camp-02',
    name: 'Hội Thảo TechExpo Chuyển Đổi Số 2026',
    code: 'CAMP-TECHEXPO-2026',
    channel: 'Hội thảo / Sự kiện',
    budget: 40000000,
    startDate: '2026-10-01',
    endDate: '2026-11-15',
    status: 'active',
    targetLeads: 50,
    description: 'Gặp gỡ khách hàng trực tiếp tại gian hàng hội nghị và thu thập card visit.',
    createdAt: '2026-10-01 09:00',
    updatedAt: '2026-10-11 08:30',
  },
];

class CampaignService {
  private campaigns: ICampaign[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(CAMPAIGNS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.campaigns = parsed;
          return;
        }
      }
    } catch (e) {
      console.warn('Không thể đọc dữ liệu chiến dịch từ localStorage:', e);
    }
    this.campaigns = [...DEFAULT_CAMPAIGNS];
    this.saveToStorage();
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(this.campaigns));
    } catch (e) {
      console.warn('Không thể lưu chiến dịch vào localStorage:', e);
    }
  }

  public getCampaigns(): ICampaign[] {
    return [...this.campaigns];
  }

  public getCampaignById(id: string): ICampaign | null {
    return this.campaigns.find((c) => c.id === id) || null;
  }

  public createCampaign(dto: ICreateCampaignDTO): ICampaign {
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newCampaign: ICampaign = {
      id: `camp-${Date.now()}`,
      name: dto.name.trim(),
      code: dto.code?.trim() || `CAMP-${Date.now().toString(36).toUpperCase()}`,
      channel: dto.channel,
      budget: Number(dto.budget) || 0,
      startDate: dto.startDate,
      endDate: dto.endDate,
      status: dto.status || 'active',
      targetLeads: dto.targetLeads ? Number(dto.targetLeads) : undefined,
      description: dto.description?.trim() || '',
      createdAt: formattedDate,
      updatedAt: formattedDate,
    };

    this.campaigns = [newCampaign, ...this.campaigns];
    this.saveToStorage();
    return newCampaign;
  }

  public updateCampaign(id: string, partial: Partial<ICampaign>): ICampaign | null {
    const idx = this.campaigns.findIndex((c) => c.id === id);
    if (idx === -1) return null;

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    this.campaigns[idx] = {
      ...this.campaigns[idx],
      ...partial,
      updatedAt: formattedDate,
    };

    this.saveToStorage();
    return this.campaigns[idx];
  }

  public deleteCampaign(id: string): boolean {
    const initialLen = this.campaigns.length;
    this.campaigns = this.campaigns.filter((c) => c.id !== id);
    if (this.campaigns.length < initialLen) {
      this.saveToStorage();
      return true;
    }
    return false;
  }

  public getCampaignPerformance(
    campaignId: string,
    leads: ILeadSubmission[],
    deals: IDeal[]
  ): ICampaignPerformanceSummary {
    const campaign = this.getCampaignById(campaignId);
    const campaignName = campaign ? campaign.name : 'Chiến dịch';
    const channel = campaign ? campaign.channel : 'Google Ads';
    const budget = campaign ? campaign.budget : 0;

    // Filter leads belonging to this campaign
    const campaignLeads = leads.filter(
      (l) =>
        l.campaignId === campaignId ||
        (campaign && l.leadSource && l.leadSource.toLowerCase().includes(campaign.name.toLowerCase())) ||
        (campaign && l.leadSource && l.leadSource.toLowerCase().includes(campaign.code.toLowerCase()))
    );

    // Filter deals belonging to this campaign
    const campaignDeals = deals.filter(
      (d) =>
        d.campaignId === campaignId ||
        (campaign && d.campaignName && d.campaignName.toLowerCase().includes(campaign.name.toLowerCase())) ||
        (campaign && d.tags && d.tags.some((t) => t.toLowerCase().includes(campaign.code.toLowerCase())))
    );

    const wonDeals = campaignDeals.filter((d) => d.stage === 'Won');
    const wonRevenue = wonDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);

    const totalLeads = campaignLeads.length;
    const totalDeals = campaignDeals.length;
    const wonDealsCount = wonDeals.length;

    const conversionRate =
      totalLeads > 0 ? `${((totalDeals / totalLeads) * 100).toFixed(1)}%` : '0.0%';
    const wonRate =
      totalDeals > 0 ? `${((wonDealsCount / totalDeals) * 100).toFixed(1)}%` : '0.0%';

    const roi =
      budget > 0
        ? `${(((wonRevenue - budget) / budget) * 100).toFixed(1)}%`
        : wonRevenue > 0
        ? '100%'
        : '0.0%';

    const costPerLead = totalLeads > 0 ? Math.round(budget / totalLeads) : 0;
    const costPerWonDeal = wonDealsCount > 0 ? Math.round(budget / wonDealsCount) : 0;

    return {
      campaignId,
      campaignName,
      channel,
      budget,
      totalLeads,
      totalDeals,
      wonDealsCount,
      wonRevenue,
      conversionRate,
      wonRate,
      roi,
      costPerLead,
      costPerWonDeal,
    };
  }

  public getAllCampaignsPerformance(
    leads: ILeadSubmission[],
    deals: IDeal[]
  ): ICampaignPerformanceSummary[] {
    return this.campaigns.map((c) => this.getCampaignPerformance(c.id, leads, deals));
  }
}

export const campaignService = new CampaignService();
