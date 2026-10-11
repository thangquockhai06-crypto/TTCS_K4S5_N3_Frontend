export type CampaignChannelType =
  | 'Google Ads'
  | 'Facebook Ads'
  | 'LinkedIn Ads'
  | 'Email Marketing'
  | 'Hội thảo / Sự kiện'
  | 'SEO / Organic'
  | 'TikTok Ads'
  | 'Đối tác giới thiệu';

export type CampaignStatusType = 'active' | 'completed' | 'paused' | 'planning';

export interface ICampaign {
  id: string;
  name: string;
  code: string;
  channel: CampaignChannelType;
  budget: number; // Ngân sách (VND)
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: CampaignStatusType;
  targetLeads?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateCampaignDTO {
  name: string;
  code?: string;
  channel: CampaignChannelType;
  budget: number;
  startDate: string;
  endDate: string;
  status?: CampaignStatusType;
  targetLeads?: number;
  description?: string;
}

export interface ICampaignPerformanceSummary {
  campaignId: string;
  campaignName: string;
  channel: CampaignChannelType;
  budget: number;
  totalLeads: number; // Số lead sinh ra từ chiến dịch
  totalDeals: number; // Số cơ hội (deal) được tạo từ chiến dịch
  wonDealsCount: number; // Số cơ hội đã chốt thành công (Won)
  wonRevenue: number; // Tổng giá trị doanh thu đã chốt (Won Value)
  conversionRate: string; // Tỷ lệ chuyển đổi Lead -> Deal (%)
  wonRate: string; // Tỷ lệ chốt thành công Won / Deal (%)
  roi: string; // Tỷ lệ ROI: (Doanh thu - Ngân sách) / Ngân sách * 100%
  costPerLead: number; // Chi phí trên mỗi lead (VND)
  costPerWonDeal: number; // Chi phí trên mỗi deal thành công (VND)
}

export interface ICampaignFilterState {
  searchQuery: string;
  channel: CampaignChannelType | 'All';
  status: CampaignStatusType | 'All';
  sortBy: 'budget' | 'revenue' | 'leads' | 'roi' | 'startDate';
  sortOrder: 'asc' | 'desc';
}
