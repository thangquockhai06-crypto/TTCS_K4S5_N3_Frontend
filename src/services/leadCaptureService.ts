import {
  ICreateManualLeadDTO,
  IEmbedFormConfig,
  IEmbedFormField,
  ILeadCaptureStats,
  ILeadSubmission,
  ILeadSubmissionDTO,
  IRateLimitCheckResult,
  IRateLimitRecord,
  IWebFormItem,
} from '../interfaces/lead-capture.interface';

const FORMS_STORAGE_KEY = 'nexus_crm_web_forms_v4';
const CONFIG_STORAGE_KEY = 'nexus_crm_lead_embed_config_v4';
const SUBMISSIONS_STORAGE_KEY = 'nexus_crm_lead_submissions_v4';
const RATE_LIMIT_STORAGE_KEY = 'nexus_crm_lead_rate_limit_v4';

export const DEFAULT_FORM_FIELDS: IEmbedFormField[] = [
  {
    id: 'f-1',
    name: 'fullName',
    label: 'Họ và tên khách hàng',
    type: 'text',
    required: true,
    placeholder: 'Ví dụ: Nguyễn Văn Hải',
    description: 'Trường lưu trữ họ tên đại diện liên hệ',
  },
  {
    id: 'f-2',
    name: 'company',
    label: 'Tên công ty / Doanh nghiệp',
    type: 'text',
    required: true,
    placeholder: 'Ví dụ: An Phát Logistics JSC',
    description: 'Tên pháp nhân công ty hoặc tổ chức',
  },
  {
    id: 'f-3',
    name: 'email',
    label: 'Email liên hệ',
    type: 'email',
    required: true,
    placeholder: 'Ví dụ: hai.nguyen@anphat.com',
    description: 'Hòm thư nhận báo giá & tài liệu giải pháp',
  },
  {
    id: 'f-4',
    name: 'phone',
    label: 'Số điện thoại',
    type: 'tel',
    required: true,
    placeholder: 'Ví dụ: 0987 654 321',
    description: 'Số điện thoại liên hệ trực tiếp trong 15 phút',
  },
  {
    id: 'f-5',
    name: 'interest',
    label: 'Nhu cầu quan tâm',
    type: 'select',
    required: true,
    placeholder: 'Chọn gói giải pháp...',
    description: 'Gói giải pháp CRM hoặc dịch vụ tư vấn doanh nghiệp',
  },
  {
    id: 'f-6',
    name: 'notes',
    label: 'Yêu cầu tùy chỉnh khác',
    type: 'textarea',
    required: false,
    placeholder: 'Mô tả thêm quy mô doanh nghiệp hoặc tính năng cần tích hợp...',
    description: 'Ghi chú mở rộng từ khách hàng',
  },
  {
    id: 'f-7',
    name: 'honeypotValue',
    label: 'Honeypot Trap (Bảo vệ ẩn)',
    type: 'text',
    required: false,
    placeholder: '',
    description: 'Trường ẩn chặn Spam Bot tự động quét web',
  },
];

export const DEFAULT_WEB_FORMS: IWebFormItem[] = [
  {
    id: 'form-web-01',
    title: 'Thu thập khách hàng tiềm năng Q2',
    type: 'Thu thập khách hàng tiềm năng',
    status: 'active',
    viewsCount: 382,
    submissionsCount: 4,
    conversionRate: '1.05%',
    embedKey: 'nexus_crm_q2_landing',
    workflowConnection: 'Không liên kết workflow',
    description: 'Thu thập khách hàng tiềm năng từ các landing page trả phí.',
    submitAction: 'Hiển thị tin nhắn',
    successMessage: 'Cảm ơn bạn đã gửi thông tin!',
    fields: ['fullName', 'email', 'phone', 'company', 'interest'],
    createdAt: '2026-10-01 08:30',
    updatedAt: '2026-10-10 14:00',
  },
  {
    id: 'form-web-02',
    title: '[QA agent] map custom field',
    type: 'Khảo sát & đồng bộ Custom Field',
    status: 'active',
    viewsCount: 120,
    submissionsCount: 2,
    conversionRate: '1.67%',
    embedKey: 'qaagentmapcustomfield',
    workflowConnection: 'Tự động phân bổ Salesteam Inbound',
    description: 'Form thu tu dong — xoa sau khi test',
    submitAction: 'Hiển thị tin nhắn',
    successMessage: 'OK',
    fields: ['fullName', 'email', 'phone', 'notes'],
    createdAt: '2026-10-02 09:15',
    updatedAt: '2026-10-11 10:20',
  },
];

export const DEFAULT_EMBED_CONFIG: IEmbedFormConfig = {
  id: 'form-web-01',
  formTitle: 'Thu thập khách hàng tiềm năng Q2',
  formDescription:
    'Thu thập khách hàng tiềm năng từ các landing page trả phí.',
  ctaText: 'Gửi Thông Tin Ngay',
  themeColor: '#2563EB',
  leadSource: 'Website Landing Page',
  campaignTag: 'Inbound Marketing Q2',
  embedType: 'iframe',
  width: '100%',
  enableHoneypot: true,
  enableRateLimiting: true,
  maxSubmissionsPerMinute: 3,
  blockDurationSeconds: 60,
  successMessage:
    'Cảm ơn bạn đã gửi thông tin!',
  redirectUrl: '',
  createdAt: '2026-10-01 08:00',
  updatedAt: '2026-10-11 09:30',
};

// 2 minimal sample leads (satisfies rule: 1-2 items only)
const INITIAL_SUBMISSIONS: ILeadSubmission[] = [
  {
    id: 'sub-001',
    formId: 'form-web-01',
    fullName: 'Lê Hoàng Long',
    email: 'long.le@viettech-solutions.vn',
    phone: '0912345678',
    company: 'VietTech Solutions JSC',
    interest: 'enterprise_pricing',
    leadSource: 'Website Landing Page',
    status: 'New Lead',
    ipAddress: '118.69.182.45',
    submittedAt: '2026-10-11 08:15',
    isSpamBlocked: false,
  },
  {
    id: 'sub-002',
    formId: 'form-web-02',
    fullName: 'Phạm Thu Hương',
    email: 'huong.pt@anphat-logistics.com',
    phone: '0987654321',
    company: 'An Phát Logistics',
    interest: 'crm_consultation',
    leadSource: 'Chiến Dịch Google Ads',
    status: 'New Lead',
    ipAddress: '14.241.235.12',
    submittedAt: '2026-10-10 16:30',
    isSpamBlocked: false,
  },
];

class LeadCaptureService {
  private forms: IWebFormItem[] = [];
  private config: IEmbedFormConfig = { ...DEFAULT_EMBED_CONFIG };
  private submissions: ILeadSubmission[] = [];
  private rateLimitMap: Map<string, IRateLimitRecord> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const storedForms = localStorage.getItem(FORMS_STORAGE_KEY);
      if (storedForms) {
        this.forms = JSON.parse(storedForms) as IWebFormItem[];
      } else {
        this.forms = [...DEFAULT_WEB_FORMS];
        this.saveFormsToStorage();
      }

      const storedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (storedConfig) {
        this.config = { ...DEFAULT_EMBED_CONFIG, ...JSON.parse(storedConfig) };
      } else {
        this.config = { ...DEFAULT_EMBED_CONFIG };
        this.saveConfigToStorage();
      }

      const storedSubs = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
      if (storedSubs) {
        this.submissions = JSON.parse(storedSubs) as ILeadSubmission[];
      } else {
        this.submissions = [...INITIAL_SUBMISSIONS];
        this.saveSubmissionsToStorage();
      }

      const storedRateLimit = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
      if (storedRateLimit) {
        const parsed = JSON.parse(storedRateLimit) as IRateLimitRecord[];
        parsed.forEach((rec) => this.rateLimitMap.set(rec.ipAddress, rec));
      }
    } catch (err) {
      console.error('Failed to load lead capture data from localStorage:', err);
      this.forms = [...DEFAULT_WEB_FORMS];
      this.config = { ...DEFAULT_EMBED_CONFIG };
      this.submissions = [...INITIAL_SUBMISSIONS];
    }
  }

  private saveFormsToStorage(): void {
    try {
      localStorage.setItem(FORMS_STORAGE_KEY, JSON.stringify(this.forms));
    } catch (err) {
      console.error('Failed to save forms to localStorage:', err);
    }
  }

  private saveConfigToStorage(): void {
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(this.config));
    } catch (err) {
      console.error('Failed to save config to localStorage:', err);
    }
  }

  private saveSubmissionsToStorage(): void {
    try {
      localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(this.submissions));
    } catch (err) {
      console.error('Failed to save submissions to localStorage:', err);
    }
  }

  private saveRateLimitToStorage(): void {
    try {
      const array = Array.from(this.rateLimitMap.values());
      localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(array));
    } catch (err) {
      console.error('Failed to save rate limit to localStorage:', err);
    }
  }

  // Forms Management
  public getWebForms(): IWebFormItem[] {
    return [...this.forms];
  }

  public getWebFormById(id: string): IWebFormItem | undefined {
    return this.forms.find((f) => f.id === id);
  }

  public createWebForm(item: Omit<IWebFormItem, 'id' | 'createdAt' | 'updatedAt' | 'viewsCount' | 'submissionsCount' | 'conversionRate'>): IWebFormItem {
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newForm: IWebFormItem = {
      id: `form-web-${Date.now()}`,
      title: item.title,
      type: item.type || 'Thu thập khách hàng tiềm năng',
      status: item.status || 'active',
      viewsCount: 0,
      submissionsCount: 0,
      conversionRate: '0%',
      embedKey: item.embedKey || `nexus_embed_${Date.now()}`,
      workflowConnection: item.workflowConnection || 'Không liên kết workflow',
      description: item.description,
      submitAction: item.submitAction || 'Hiển thị tin nhắn',
      successMessage: item.successMessage || 'Cảm ơn bạn đã gửi thông tin!',
      fields: item.fields || ['fullName', 'email', 'phone'],
      createdAt: formattedDate,
      updatedAt: formattedDate,
    };

    this.forms = [newForm, ...this.forms];
    this.saveFormsToStorage();
    return newForm;
  }

  public updateWebForm(id: string, partial: Partial<IWebFormItem>): IWebFormItem | null {
    const idx = this.forms.findIndex((f) => f.id === id);
    if (idx === -1) return null;

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const updated = {
      ...this.forms[idx],
      ...partial,
      updatedAt: formattedDate,
    };
    this.forms[idx] = updated;
    this.saveFormsToStorage();
    return updated;
  }

  public deleteWebForm(id: string): boolean {
    const initLen = this.forms.length;
    this.forms = this.forms.filter((f) => f.id !== id);
    if (this.forms.length !== initLen) {
      this.saveFormsToStorage();
      return true;
    }
    return false;
  }

  // Embed Config
  public getConfig(): IEmbedFormConfig {
    return { ...this.config };
  }

  public updateConfig(partial: Partial<IEmbedFormConfig>): IEmbedFormConfig {
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    this.config = {
      ...this.config,
      ...partial,
      updatedAt: formattedDate,
    };
    this.saveConfigToStorage();
    return { ...this.config };
  }

  public resetConfigToDefault(): IEmbedFormConfig {
    this.config = { ...DEFAULT_EMBED_CONFIG };
    this.saveConfigToStorage();
    return { ...this.config };
  }

  // Submissions
  public getSubmissions(): ILeadSubmission[] {
    return [...this.submissions];
  }

  public checkRateLimit(ipAddress: string): IRateLimitCheckResult {
    if (!this.config.enableRateLimiting) {
      return { allowed: true, remainingRequests: 999, retryAfterSeconds: 0 };
    }

    const now = Date.now();
    const windowMs = 60 * 1000;
    let record = this.rateLimitMap.get(ipAddress);

    if (!record) {
      record = { ipAddress, timestamps: [] };
      this.rateLimitMap.set(ipAddress, record);
    }

    if (record.blockedUntil && record.blockedUntil > now) {
      const retryAfterSeconds = Math.ceil((record.blockedUntil - now) / 1000);
      return {
        allowed: false,
        remainingRequests: 0,
        retryAfterSeconds,
        reason: `Địa chỉ IP (${ipAddress}) đã vượt quá giới hạn gửi biểu mẫu (${this.config.maxSubmissionsPerMinute} lần/phút). Vui lòng thử lại sau ${retryAfterSeconds} giây.`,
      };
    }

    const recentTimestamps = record.timestamps.filter((ts) => now - ts < windowMs);
    record.timestamps = recentTimestamps;

    if (recentTimestamps.length >= this.config.maxSubmissionsPerMinute) {
      const blockDuration = (this.config.blockDurationSeconds || 60) * 1000;
      record.blockedUntil = now + blockDuration;
      this.saveRateLimitToStorage();
      const retryAfterSeconds = this.config.blockDurationSeconds || 60;
      return {
        allowed: false,
        remainingRequests: 0,
        retryAfterSeconds,
        reason: `Địa chỉ IP (${ipAddress}) đã bị khóa tạm thời do gửi quá ${this.config.maxSubmissionsPerMinute} yêu cầu trong 1 phút. Hãy thử lại sau ${retryAfterSeconds} giây.`,
      };
    }

    return {
      allowed: true,
      remainingRequests: this.config.maxSubmissionsPerMinute - recentTimestamps.length,
      retryAfterSeconds: 0,
    };
  }

  public submitLead(
    dto: ILeadSubmissionDTO,
    simulatedIp: string = '127.0.0.1'
  ): {
    success: boolean;
    submission?: ILeadSubmission;
    error?: string;
    isSpam?: boolean;
    isRateLimited?: boolean;
    retryAfterSeconds?: number;
  } {
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Anti-Spam Honeypot check
    if (this.config.enableHoneypot && dto.honeypotValue && dto.honeypotValue.trim().length > 0) {
      const spamRecord: ILeadSubmission = {
        id: `sub-spam-${Date.now()}`,
        formId: dto.formId,
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        company: dto.company,
        interest: dto.interest,
        leadSource: dto.leadSource || this.config.leadSource,
        status: 'New Lead',
        ipAddress: simulatedIp,
        submittedAt: formattedDate,
        isSpamBlocked: true,
        blockReason: 'Phát hiện Honeypot Trap (Bot điền trường ẩn bảo vệ)',
      };
      this.submissions = [spamRecord, ...this.submissions];
      this.saveSubmissionsToStorage();
      return {
        success: false,
        isSpam: true,
        error: 'Hệ thống phát hiện hành vi tự động (Spam Bot) và đã từ chối tiếp nhận.',
      };
    }

    // IP Rate Limit check
    const rateCheck = this.checkRateLimit(simulatedIp);
    if (!rateCheck.allowed) {
      const rateBlockedRecord: ILeadSubmission = {
        id: `sub-rate-${Date.now()}`,
        formId: dto.formId,
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        company: dto.company,
        interest: dto.interest,
        leadSource: dto.leadSource || this.config.leadSource,
        status: 'New Lead',
        ipAddress: simulatedIp,
        submittedAt: formattedDate,
        isSpamBlocked: true,
        blockReason: rateCheck.reason,
      };
      this.submissions = [rateBlockedRecord, ...this.submissions];
      this.saveSubmissionsToStorage();
      return {
        success: false,
        isRateLimited: true,
        retryAfterSeconds: rateCheck.retryAfterSeconds,
        error: rateCheck.reason,
      };
    }

    let record = this.rateLimitMap.get(simulatedIp);
    if (!record) {
      record = { ipAddress: simulatedIp, timestamps: [] };
      this.rateLimitMap.set(simulatedIp, record);
    }
    record.timestamps.push(Date.now());
    this.saveRateLimitToStorage();

    const newSubmission: ILeadSubmission = {
      id: `sub-${Date.now()}`,
      formId: dto.formId,
      fullName: dto.fullName.trim(),
      email: dto.email.trim().toLowerCase(),
      phone: dto.phone.trim(),
      company: dto.company.trim(),
      interest: dto.interest,
      leadSource: dto.leadSource || this.config.leadSource,
      status: 'New Lead',
      ipAddress: simulatedIp,
      submittedAt: formattedDate,
      isSpamBlocked: false,
    };

    this.submissions = [newSubmission, ...this.submissions];
    this.saveSubmissionsToStorage();

    // Increment submissions count for the matching form
    const formIdx = this.forms.findIndex((f) => f.id === dto.formId);
    if (formIdx !== -1) {
      const current = this.forms[formIdx];
      const newSubs = current.submissionsCount + 1;
      const rate = current.viewsCount > 0 ? `${((newSubs / current.viewsCount) * 100).toFixed(1)}%` : '100%';
      this.forms[formIdx] = {
        ...current,
        submissionsCount: newSubs,
        conversionRate: rate,
      };
      this.saveFormsToStorage();
    }

    return {
      success: true,
      submission: newSubmission,
    };
  }

  public createManualLead(dto: ICreateManualLeadDTO, formId?: string): ILeadSubmission {
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newSubmission: ILeadSubmission = {
      id: `sub-manual-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      formId: formId || 'manual-entry',
      fullName: dto.fullName.trim(),
      email: dto.email.trim().toLowerCase(),
      phone: dto.phone.trim(),
      company: dto.company.trim(),
      interest: dto.interest,
      leadSource: dto.leadSource.trim(),
      status: 'New Lead',
      ipAddress: 'Nhập thủ công (Card Visit)',
      submittedAt: formattedDate,
      isSpamBlocked: false,
    };

    this.submissions = [newSubmission, ...this.submissions];
    this.saveSubmissionsToStorage();

    if (formId) {
      const formIdx = this.forms.findIndex((f) => f.id === formId);
      if (formIdx !== -1) {
        const current = this.forms[formIdx];
        const newSubs = current.submissionsCount + 1;
        const rate = current.viewsCount > 0 ? `${((newSubs / current.viewsCount) * 100).toFixed(1)}%` : '100%';
        this.forms[formIdx] = {
          ...current,
          submissionsCount: newSubs,
          conversionRate: rate,
        };
        this.saveFormsToStorage();
      }
    }

    return newSubmission;
  }

  public batchImportLeads(dtos: ICreateManualLeadDTO[], formId?: string): ILeadSubmission[] {
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newSubmissions: ILeadSubmission[] = dtos.map((dto, index) => ({
      id: `sub-excel-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 5)}`,
      formId: formId || 'excel-import',
      fullName: dto.fullName.trim(),
      email: dto.email.trim().toLowerCase(),
      phone: dto.phone.trim(),
      company: dto.company.trim(),
      interest: dto.interest,
      leadSource: dto.leadSource.trim(),
      status: 'New Lead',
      ipAddress: 'Nhập tệp Excel / CSV',
      submittedAt: formattedDate,
      isSpamBlocked: false,
    }));

    this.submissions = [...newSubmissions, ...this.submissions];
    this.saveSubmissionsToStorage();

    if (formId) {
      const formIdx = this.forms.findIndex((f) => f.id === formId);
      if (formIdx !== -1) {
        const current = this.forms[formIdx];
        const newSubs = current.submissionsCount + newSubmissions.length;
        const rate = current.viewsCount > 0 ? `${((newSubs / current.viewsCount) * 100).toFixed(1)}%` : '100%';
        this.forms[formIdx] = {
          ...current,
          submissionsCount: newSubs,
          conversionRate: rate,
        };
        this.saveFormsToStorage();
      }
    }

    return newSubmissions;
  }

  public updateSubmission(id: string, partial: Partial<ILeadSubmission>): ILeadSubmission | null {
    const idx = this.submissions.findIndex((s) => s.id === id);
    if (idx === -1) return null;

    const updated: ILeadSubmission = {
      ...this.submissions[idx],
      ...partial,
    };
    this.submissions[idx] = updated;
    this.saveSubmissionsToStorage();
    return updated;
  }

  public deleteSubmission(id: string): boolean {
    const initialLen = this.submissions.length;
    this.submissions = this.submissions.filter((s) => s.id !== id);
    if (this.submissions.length !== initialLen) {
      this.saveSubmissionsToStorage();
      return true;
    }
    return false;
  }

  public getStats(): ILeadCaptureStats {
    const validLeads = this.submissions.filter((s) => !s.isSpamBlocked).length;
    const spamBlocked = this.submissions.filter((s) => s.isSpamBlocked).length;
    const totalViews = this.forms.reduce((acc, f) => acc + f.viewsCount, 0);
    const activeFormsCount = this.forms.filter((f) => f.status === 'active').length;
    const total = this.submissions.length;
    const conversionRate = total > 0 ? `${Math.round((validLeads / total) * 100)}%` : '100%';

    return {
      totalForms: this.forms.length,
      activeFormsCount,
      totalViews,
      totalLeads: validLeads,
      spamBlocked,
      conversionRate,
    };
  }

  public generateIframeCode(config: IEmbedFormConfig, origin: string = window.location.origin): string {
    const srcUrl = `${origin}/embed/lead-form?formId=${encodeURIComponent(config.id)}&source=${encodeURIComponent(config.leadSource)}`;
    return `<!-- NexusCRM Form Thu Thập Lead - Mã Nhúng Iframe -->
<iframe
  src="${srcUrl}"
  width="${config.width || '100%'}"
  height="650"
  frameborder="0"
  style="border: none; max-width: 100%; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);"
  title="${config.formTitle}"
  loading="lazy"
></iframe>`;
  }

  public generateScriptCode(config: IEmbedFormConfig, origin: string = window.location.origin): string {
    const scriptUrl = `${origin}/embed/lead-form?embed=script&formId=${encodeURIComponent(config.id)}`;
    return `<!-- NexusCRM Form Thu Thập Lead - Mã Nhúng JavaScript Widget -->
<div id="nexuscrm-lead-widget" data-form-id="${config.id}"></div>
<script>
  (function(w, d, s, o, f, js, fjs) {
    w['NexusCRMWidget'] = o;
    w[o] = w[o] || function() { (w[o].q = w[o].q || []).push(arguments); };
    js = d.createElement(s);
    fjs = d.getElementsByTagName(s)[0];
    js.id = 'nexuscrm-widget-js';
    js.src = f;
    js.async = 1;
    fjs.parentNode.insertBefore(js, fjs);
  }(window, document, 'script', 'nexusWidget', '${scriptUrl}'));
</script>`;
  }

  public generateFormIframeCode(form: IWebFormItem, origin: string = window.location.origin): string {
    const srcUrl = `${origin}/embed/lead-form?formId=${encodeURIComponent(form.id)}&key=${encodeURIComponent(form.embedKey)}`;
    return `<!-- NexusCRM Form Thu Thập Lead: ${form.title} - Mã Nhúng Iframe -->
<iframe
  src="${srcUrl}"
  width="100%"
  height="650"
  frameborder="0"
  style="border: none; max-width: 100%; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);"
  title="${form.title}"
  loading="lazy"
></iframe>`;
  }

  public generateFormScriptCode(form: IWebFormItem, origin: string = window.location.origin): string {
    const scriptUrl = `${origin}/embed/lead-form?embed=script&formId=${encodeURIComponent(form.id)}&key=${encodeURIComponent(form.embedKey)}`;
    return `<!-- NexusCRM Form Thu Thập Lead: ${form.title} - Mã Nhúng JavaScript Widget SDK -->
<div id="nexuscrm-lead-widget" data-form-id="${form.id}" data-embed-key="${form.embedKey}"></div>
<script>
  (function(w, d, s, o, f, js, fjs) {
    w['NexusCRMWidget'] = o;
    w[o] = w[o] || function() { (w[o].q = w[o].q || []).push(arguments); };
    js = d.createElement(s);
    fjs = d.getElementsByTagName(s)[0];
    js.id = 'nexuscrm-widget-js';
    js.src = f;
    js.async = 1;
    fjs.parentNode.insertBefore(js, fjs);
  }(window, document, 'script', 'nexusWidget', '${scriptUrl}'));
</script>`;
  }
}

export const leadCaptureService = new LeadCaptureService();
