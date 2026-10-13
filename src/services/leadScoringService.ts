import {
  ILeadScoringConfig,
  ILeadScoringCriterion,
  ILeadScoreThresholds,
  ILeadScoreDetail,
  IMatchedCriterionItem,
  IScoredLead,
  ICreateCriterionDTO,
  UpdateCriterionDTO,
  LeadTemperatureType,
} from '../interfaces/lead-scoring.interface';
import { ILeadSubmission } from '../interfaces/lead-capture.interface';
import { leadCaptureService } from './leadCaptureService';

const LEAD_SCORING_STORAGE_KEY = 'nexus_crm_lead_scoring_config_v2';

export const DEFAULT_LEAD_THRESHOLDS: ILeadScoreThresholds = {
  hotMin: 70,
  warmMin: 40,
  coldMax: 39,
  hotAction: 'Ưu tiên gọi điện tư vấn ngay trong 15 phút',
  warmAction: 'Phân bổ telesales liên hệ trong vòng 24 giờ',
  coldAction: 'Tự động đưa vào luồng Email Drip nuôi dưỡng',
};

export const DEFAULT_LEAD_CRITERIA: ILeadScoringCriterion[] = [
  // 1. Ngành nghề phù hợp (Industry)
  {
    id: 'crit-ind-1',
    category: 'industry',
    categoryLabel: 'Ngành nghề',
    criterionName: 'Công nghệ thông tin & Viễn thông',
    conditionField: 'industry',
    conditionOperator: 'contains',
    conditionValue: 'Công nghệ thông tin',
    points: 25,
    isEnabled: true,
    description: 'Ngành trọng tâm có nhu cầu số hóa quy trình quản trị doanh nghiệp cao',
  },
  {
    id: 'crit-ind-2',
    category: 'industry',
    categoryLabel: 'Ngành nghề',
    criterionName: 'Tài chính - Ngân hàng - Bảo hiểm',
    conditionField: 'industry',
    conditionOperator: 'contains',
    conditionValue: 'Tài chính',
    points: 25,
    isEnabled: true,
    description: 'Ngân sách CRM lớn, chu kỳ chốt hợp đồng nhanh chóng',
  },
  {
    id: 'crit-ind-3',
    category: 'industry',
    categoryLabel: 'Ngành nghề',
    criterionName: 'Bán lẻ, Thương mại & Logistics',
    conditionField: 'industry',
    conditionOperator: 'contains',
    conditionValue: 'Logistics',
    points: 20,
    isEnabled: true,
    description: 'Quy mô đội ngũ bán hàng và CSKH lớn, nhu cầu tích hợp đa kênh',
  },
  {
    id: 'crit-ind-4',
    category: 'industry',
    categoryLabel: 'Ngành nghề',
    criterionName: 'Bất động sản & Xây dựng',
    conditionField: 'industry',
    conditionOperator: 'contains',
    conditionValue: 'Bất động sản',
    points: 15,
    isEnabled: true,
    description: 'Cần phân bổ và bảo mật danh bạ khách hàng tiềm năng',
  },

  // 2. Quy mô doanh nghiệp (Company size / Tier)
  {
    id: 'crit-size-1',
    category: 'company_size',
    categoryLabel: 'Quy mô doanh nghiệp',
    criterionName: 'Enterprise / Tập đoàn (> 500 nhân sự)',
    conditionField: 'companySize',
    conditionOperator: 'equals',
    conditionValue: 'Enterprise (> 500 nhân sự)',
    points: 30,
    isEnabled: true,
    description: 'Quy mô hợp đồng lớn (ARR > 100M), yêu cầu bảo mật cao',
  },
  {
    id: 'crit-size-2',
    category: 'company_size',
    categoryLabel: 'Quy mô doanh nghiệp',
    criterionName: 'Mid-Market (50 - 200 nhân sự)',
    conditionField: 'companySize',
    conditionOperator: 'equals',
    conditionValue: 'Mid-Market (50 - 200 nhân sự)',
    points: 20,
    isEnabled: true,
    description: 'Quyết định triển khai nhanh, tăng trưởng người dùng đều đặn',
  },
  {
    id: 'crit-size-3',
    category: 'company_size',
    categoryLabel: 'Quy mô doanh nghiệp',
    criterionName: 'SME / Startup (< 50 nhân sự)',
    conditionField: 'companySize',
    conditionOperator: 'equals',
    conditionValue: 'SME / Startup (< 50 nhân sự)',
    points: 10,
    isEnabled: true,
    description: 'Doanh nghiệp khởi nghiệp đang mở rộng quy mô kinh doanh',
  },

  // 3. Nguồn lead (Lead Source)
  {
    id: 'crit-src-1',
    category: 'lead_source',
    categoryLabel: 'Nguồn Lead',
    criterionName: 'Website Landing Page (Webform)',
    conditionField: 'leadSource',
    conditionOperator: 'contains',
    conditionValue: 'Website Landing Page',
    points: 20,
    isEnabled: true,
    description: 'Khách hàng chủ động truy cập website và để lại thông tin tư vấn',
  },
  {
    id: 'crit-src-2',
    category: 'lead_source',
    categoryLabel: 'Nguồn Lead',
    criterionName: 'Giới thiệu từ Đối tác (Referral)',
    conditionField: 'leadSource',
    conditionOperator: 'contains',
    conditionValue: 'Giới thiệu',
    points: 30,
    isEnabled: true,
    description: 'Tỷ lệ chuyển đổi thành công vượt trội nhờ uy tín đối tác',
  },
  {
    id: 'crit-src-3',
    category: 'lead_source',
    categoryLabel: 'Nguồn Lead',
    criterionName: 'Sự kiện Hội thảo Tech / Triển lãm',
    conditionField: 'leadSource',
    conditionOperator: 'contains',
    conditionValue: 'Sự Kiện Hội Thảo Tech',
    points: 25,
    isEnabled: true,
    description: 'Đã gặp mặt trực tiếp và trao đổi sơ bộ nhu cầu tại quầy',
  },
  {
    id: 'crit-src-4',
    category: 'lead_source',
    categoryLabel: 'Nguồn Lead',
    criterionName: 'Chiến Dịch Google Search Ads',
    conditionField: 'leadSource',
    conditionOperator: 'contains',
    conditionValue: 'Google Ads',
    points: 15,
    isEnabled: true,
    description: 'Khách hàng tìm kiếm từ khóa giải pháp CRM với ý định mua cao',
  },
  {
    id: 'crit-src-5',
    category: 'lead_source',
    categoryLabel: 'Nguồn Lead',
    criterionName: 'Chiến Dịch Facebook Ads',
    conditionField: 'leadSource',
    conditionOperator: 'contains',
    conditionValue: 'Facebook Ads',
    points: 10,
    isEnabled: true,
    description: 'Tiếp cận qua mạng xã hội, cần sàng lọc thêm nhu cầu',
  },

  // 4. Mức độ quan tâm (Interest Level)
  {
    id: 'crit-int-1',
    category: 'interest',
    categoryLabel: 'Mức độ quan tâm',
    criterionName: 'Báo giá Gói Enterprise',
    conditionField: 'interest',
    conditionOperator: 'equals',
    conditionValue: 'enterprise_pricing',
    points: 30,
    isEnabled: true,
    description: 'Khách hàng chuẩn bị ngân sách và cần bảng giá dự toán ngay',
  },
  {
    id: 'crit-int-2',
    category: 'interest',
    categoryLabel: 'Mức độ quan tâm',
    criterionName: 'Tư vấn CRM Doanh nghiệp',
    conditionField: 'interest',
    conditionOperator: 'equals',
    conditionValue: 'crm_consultation',
    points: 25,
    isEnabled: true,
    description: 'Nhu cầu chuyển đổi số toàn diện quy trình bán hàng',
  },
  {
    id: 'crit-int-3',
    category: 'interest',
    categoryLabel: 'Mức độ quan tâm',
    criterionName: 'Trải nghiệm Bản Demo',
    conditionField: 'interest',
    conditionOperator: 'equals',
    conditionValue: 'product_demo',
    points: 20,
    isEnabled: true,
    description: 'Cần demo thực tế tính năng trước khi trình ban giám đốc',
  },
  {
    id: 'crit-int-4',
    category: 'interest',
    categoryLabel: 'Mức độ quan tâm',
    criterionName: 'Tích hợp API Webhook',
    conditionField: 'interest',
    conditionOperator: 'equals',
    conditionValue: 'system_integration',
    points: 15,
    isEnabled: true,
    description: 'Đã có hệ thống ERP / Kế toán và cần đồng bộ luồng dữ liệu',
  },
  {
    id: 'crit-int-5',
    category: 'interest',
    categoryLabel: 'Mức độ quan tâm',
    criterionName: 'Hợp tác Đại lý & Đối tác',
    conditionField: 'interest',
    conditionOperator: 'equals',
    conditionValue: 'partnership',
    points: 10,
    isEnabled: true,
    description: 'Mong muốn phân phối giải pháp CRM cho các khách hàng thành viên',
  },
  {
    id: 'crit-int-6',
    category: 'interest',
    categoryLabel: 'Mức độ quan tâm',
    criterionName: 'Yêu cầu tùy chỉnh khác',
    conditionField: 'interest',
    conditionOperator: 'equals',
    conditionValue: 'other',
    points: 5,
    isEnabled: true,
    description: 'Yêu cầu tính năng đặc thù ngoài danh mục tiêu chuẩn',
  },
];

export const DEFAULT_LEAD_SCORING_CONFIG: ILeadScoringConfig = {
  id: 'lead-scoring-cfg-main',
  name: 'Thang Điểm Tiềm Năng Khách Hàng B2B',
  description:
    'Mô hình đánh giá tự động dựa trên 4 chiều tiêu chí: Ngành nghề, Quy mô công ty, Kênh nguồn và Mức độ quan tâm để xếp hạng cuộc gọi ưu tiên.',
  isActive: true,
  thresholds: DEFAULT_LEAD_THRESHOLDS,
  criteria: DEFAULT_LEAD_CRITERIA,
  updatedAt: new Date().toISOString(),
};

class LeadScoringService {
  public getConfig(): ILeadScoringConfig {
    try {
      const stored = localStorage.getItem(LEAD_SCORING_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as ILeadScoringConfig;
      }
    } catch (e: unknown) {
      console.warn('Không thể đọc cấu hình lead scoring từ localStorage, sử dụng mặc định.', e);
    }
    this.saveConfig(DEFAULT_LEAD_SCORING_CONFIG);
    return DEFAULT_LEAD_SCORING_CONFIG;
  }

  public saveConfig(config: ILeadScoringConfig): ILeadScoringConfig {
    const updated: ILeadScoringConfig = {
      ...config,
      updatedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(LEAD_SCORING_STORAGE_KEY, JSON.stringify(updated));
    } catch (e: unknown) {
      console.error('Lỗi khi lưu cấu hình lead scoring vào localStorage:', e);
    }
    return updated;
  }

  public resetToDefault(): ILeadScoringConfig {
    return this.saveConfig(DEFAULT_LEAD_SCORING_CONFIG);
  }

  public updateThresholds(thresholds: Partial<ILeadScoreThresholds>): ILeadScoringConfig {
    const current = this.getConfig();
    const updated: ILeadScoringConfig = {
      ...current,
      thresholds: {
        ...current.thresholds,
        ...thresholds,
      },
    };
    return this.saveConfig(updated);
  }

  public addCriterion(dto: ICreateCriterionDTO): ILeadScoringConfig {
    const current = this.getConfig();
    const newCriterion: ILeadScoringCriterion = {
      id: `crit-custom-${Date.now()}`,
      category: dto.category,
      categoryLabel:
        dto.category === 'industry'
          ? 'Ngành nghề'
          : dto.category === 'company_size'
          ? 'Quy mô doanh nghiệp'
          : dto.category === 'lead_source'
          ? 'Nguồn Lead'
          : dto.category === 'interest'
          ? 'Mức độ quan tâm'
          : 'Tùy chỉnh khác',
      criterionName: dto.criterionName,
      conditionField: dto.conditionField,
      conditionOperator: dto.conditionOperator,
      conditionValue: dto.conditionValue,
      points: dto.points,
      isEnabled: dto.isEnabled !== undefined ? dto.isEnabled : true,
      description: dto.description || 'Tiêu chí đánh giá được bổ sung thủ công',
    };

    const updated: ILeadScoringConfig = {
      ...current,
      criteria: [newCriterion, ...current.criteria],
    };
    return this.saveConfig(updated);
  }

  public updateCriterion(id: string, dto: UpdateCriterionDTO): ILeadScoringConfig {
    const current = this.getConfig();
    const updatedCriteria = current.criteria.map((c) => {
      if (c.id !== id) return c;
      return {
        ...c,
        ...dto,
      };
    });
    return this.saveConfig({ ...current, criteria: updatedCriteria });
  }

  public deleteCriterion(id: string): ILeadScoringConfig {
    const current = this.getConfig();
    const updatedCriteria = current.criteria.filter((c) => c.id !== id);
    return this.saveConfig({ ...current, criteria: updatedCriteria });
  }

  public toggleCriterion(id: string, isEnabled: boolean): ILeadScoringConfig {
    const current = this.getConfig();
    const updatedCriteria = current.criteria.map((c) =>
      c.id === id ? { ...c, isEnabled } : c
    );
    return this.saveConfig({ ...current, criteria: updatedCriteria });
  }

  /**
   * Tính toán điểm số tự động cho một Lead dựa trên cấu hình đang hoạt động
   */
  public calculateScore(
    lead: Partial<ILeadSubmission> & { companySize?: string; industry?: string },
    customConfig?: ILeadScoringConfig
  ): ILeadScoreDetail {
    const config = customConfig || this.getConfig();
    const matchedCriteria: IMatchedCriterionItem[] = [];
    let totalScore = 0;

    const leadIndustry = lead.industry || this.detectIndustryFromCompany(lead.company || '', lead.notes || '');
    const leadCompanySize = lead.companySize || this.detectCompanySize(lead.company || '', lead.notes || '');
    const leadSource = lead.leadSource || '';
    const leadInterest = lead.interest || '';

    for (const criterion of config.criteria) {
      if (!criterion.isEnabled) continue;

      let isMatch = false;
      let targetValue = '';

      switch (criterion.conditionField) {
        case 'industry':
          targetValue = leadIndustry;
          break;
        case 'companySize':
          targetValue = leadCompanySize;
          break;
        case 'leadSource':
          targetValue = leadSource;
          break;
        case 'interest':
          targetValue = leadInterest;
          break;
        case 'company':
          targetValue = lead.company || '';
          break;
        default:
          targetValue = `${lead.company || ''} ${lead.notes || ''}`;
          break;
      }

      if (criterion.conditionOperator === 'equals') {
        isMatch = targetValue.toLowerCase().trim() === criterion.conditionValue.toLowerCase().trim();
      } else if (criterion.conditionOperator === 'contains') {
        isMatch = targetValue.toLowerCase().includes(criterion.conditionValue.toLowerCase().trim());
      } else if (criterion.conditionOperator === 'in') {
        const parts = criterion.conditionValue.split(',').map((p) => p.trim().toLowerCase());
        isMatch = parts.some((part) => targetValue.toLowerCase().includes(part));
      }

      if (isMatch) {
        totalScore += criterion.points;
        matchedCriteria.push({
          criterionId: criterion.id,
          criterionName: criterion.criterionName,
          categoryLabel: criterion.categoryLabel,
          points: criterion.points,
        });
      }
    }

    // Điểm số trong khoảng 0 - 100
    const finalScore = Math.max(0, Math.min(100, totalScore));

    let temperature: LeadTemperatureType = 'Cold';
    let recommendedAction = config.thresholds.coldAction;

    if (finalScore >= config.thresholds.hotMin) {
      temperature = 'Hot';
      recommendedAction = config.thresholds.hotAction;
    } else if (finalScore >= config.thresholds.warmMin) {
      temperature = 'Warm';
      recommendedAction = config.thresholds.warmAction;
    } else {
      temperature = 'Cold';
      recommendedAction = config.thresholds.coldAction;
    }

    return {
      score: finalScore,
      temperature,
      matchedCriteria,
      recommendedAction,
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * Chấm điểm và phân loại hàng loạt Lead, sắp xếp theo thứ tự ưu tiên (điểm cao nhất trước)
   * Tuân thủ ràng buộc: "Điểm chỉ để sắp xếp ưu tiên, không tự động loại lead"
   */
  public scoreAllLeads(
    leads?: ILeadSubmission[],
    customConfig?: ILeadScoringConfig
  ): IScoredLead[] {
    const rawLeads = leads || leadCaptureService.getSubmissions();
    const config = customConfig || this.getConfig();

    const scored: IScoredLead[] = rawLeads.map((item) => {
      const industry = this.detectIndustryFromCompany(item.company || '', item.notes || '');
      const companySize = this.detectCompanySize(item.company || '', item.notes || '');

      const scoreDetail = this.calculateScore(
        {
          ...item,
          industry,
          companySize,
        },
        config
      );

      return {
        ...item,
        industry,
        companySize,
        score: scoreDetail.score,
        temperature: scoreDetail.temperature,
        scoreDetail,
      };
    });

    // Sắp xếp ưu tiên: Điểm cao nhất lên đầu (đúng theo yêu cầu "để nhân viên gọi những lead có khả năng nhất trước")
    return scored.sort((a, b) => b.score - a.score);
  }

  // Helper phán đoán ngành nghề phù hợp
  public detectIndustryFromCompany(companyName: string, notes: string): string {
    const text = `${companyName} ${notes}`.toLowerCase();
    if (text.includes('software') || text.includes('tech') || text.includes('viễn thông') || text.includes('it') || text.includes('công nghệ')) {
      return 'Công nghệ thông tin & Viễn thông';
    }
    if (text.includes('bank') || text.includes('tài chính') || text.includes('ngân hàng') || text.includes('bảo hiểm') || text.includes('chứng khoán')) {
      return 'Tài chính - Ngân hàng - Bảo hiểm';
    }
    if (text.includes('logistics') || text.includes('vận tải') || text.includes('giao nhận') || text.includes('express') || text.includes('bán lẻ') || text.includes('mart')) {
      return 'Bán lẻ, Thương mại & Logistics';
    }
    if (text.includes('land') || text.includes('bất động sản') || text.includes('địa ốc') || text.includes('xây dựng') || text.includes('building')) {
      return 'Bất động sản & Xây dựng';
    }
    if (text.includes('y tế') || text.includes('pharma') || text.includes('dược') || text.includes('bệnh viện') || text.includes('clinic')) {
      return 'Y tế & Dược phẩm';
    }
    return 'Dịch vụ & Doanh nghiệp tổng hợp';
  }

  // Helper phán đoán quy mô doanh nghiệp
  public detectCompanySize(companyName: string, notes: string): string {
    const text = `${companyName} ${notes}`.toLowerCase();
    if (text.includes('tập đoàn') || text.includes('group') || text.includes('corp') || text.includes('holding') || text.includes('500') || text.includes('tổng công ty')) {
      return 'Enterprise (> 500 nhân sự)';
    }
    if (text.includes('jsc') || text.includes('cổ phần') || text.includes('chi nhánh') || text.includes('100') || text.includes('200')) {
      return 'Mid-Market (50 - 200 nhân sự)';
    }
    return 'SME / Startup (< 50 nhân sự)';
  }
}

export const leadScoringService = new LeadScoringService();
