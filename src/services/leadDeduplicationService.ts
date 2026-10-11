import { ICustomer } from '../interfaces/customer.interface';
import { ILeadSubmission } from '../interfaces/lead-capture.interface';
import {
  IDuplicateCheckResult,
  IDuplicateMatchItem,
  IDuplicateLeadPair,
  IMergeLeadsDTO,
} from '../interfaces/lead-deduplication.interface';

export class LeadDeduplicationService {
  /**
   * Chuẩn hóa số điện thoại để so sánh chính xác (loại bỏ khoảng trắng, dấu gạch nối, dấu ngoặc)
   */
  public normalizePhone(phone: string): string {
    if (!phone) return '';
    let cleaned = phone.replace(/[^0-9+]/g, '');
    if (cleaned.startsWith('+84')) {
      cleaned = '0' + cleaned.substring(3);
    }
    return cleaned;
  }

  /**
   * Chuẩn hóa email
   */
  public normalizeEmail(email: string): string {
    if (!email) return '';
    return email.trim().toLowerCase();
  }

  /**
   * Chuẩn hóa tên công ty (loại bỏ các tiền tố/hậu tố phổ biến như Cty, TNHH, JSC, Corp)
   */
  public normalizeCompany(company: string): string {
    if (!company) return '';
    return company
      .toLowerCase()
      .replace(/\b(công ty|cty|tnhh|jsc|corp|corporation|cổ phần|cp|ltd|vietnam|việt nam)\b/gi, '')
      .replace(/[^a-zA-Z0-9\u00C0-\u024F\u1EA0-\u1EF9]/g, '')
      .trim();
  }

  /**
   * Kiểm tra trùng lặp trong thời gian thực khi nhân viên đang nhập form
   */
  public checkDuplicate(
    input: { email?: string; phone?: string; company?: string },
    currentLeadId?: string,
    existingLeads: ILeadSubmission[] = [],
    existingCustomers: ICustomer[] = []
  ): IDuplicateCheckResult {
    const matches: IDuplicateMatchItem[] = [];
    const inputEmail = this.normalizeEmail(input.email || '');
    const inputPhone = this.normalizePhone(input.phone || '');
    const inputCompany = this.normalizeCompany(input.company || '');

    let matchedCustomer: ICustomer | undefined;
    let matchedLead: ILeadSubmission | undefined;

    // 1. Kiểm tra đối chiếu với danh sách Khách hàng Doanh nghiệp hiện có
    if (existingCustomers.length > 0) {
      for (const customer of existingCustomers) {
        const custEmail = this.normalizeEmail(customer.email);
        const custPhone = this.normalizePhone(customer.phone);
        const custCompany = this.normalizeCompany(customer.company);

        // Trùng email
        if (inputEmail && custEmail && inputEmail === custEmail) {
          matches.push({
            matchType: 'email',
            matchValue: customer.email,
            targetType: 'customer',
            matchedRecordId: customer.id,
            matchedRecordName: customer.fullName,
            matchedRecordCompany: customer.company,
            matchedRecordEmail: customer.email,
            matchedRecordPhone: customer.phone,
            similarityScore: 100,
          });
          matchedCustomer = customer;
        }

        // Trùng số điện thoại
        if (inputPhone && custPhone && inputPhone === custPhone) {
          matches.push({
            matchType: 'phone',
            matchValue: customer.phone,
            targetType: 'customer',
            matchedRecordId: customer.id,
            matchedRecordName: customer.fullName,
            matchedRecordCompany: customer.company,
            matchedRecordEmail: customer.email,
            matchedRecordPhone: customer.phone,
            similarityScore: 100,
          });
          if (!matchedCustomer) matchedCustomer = customer;
        }

        // Trùng tên công ty
        if (
          inputCompany &&
          custCompany &&
          inputCompany.length >= 4 &&
          custCompany.length >= 4 &&
          (inputCompany === custCompany ||
            inputCompany.includes(custCompany) ||
            custCompany.includes(inputCompany))
        ) {
          matches.push({
            matchType: 'company',
            matchValue: customer.company,
            targetType: 'customer',
            matchedRecordId: customer.id,
            matchedRecordName: customer.fullName,
            matchedRecordCompany: customer.company,
            matchedRecordEmail: customer.email,
            matchedRecordPhone: customer.phone,
            similarityScore: 90,
          });
          if (!matchedCustomer) matchedCustomer = customer;
        }
      }
    }

    // 2. Kiểm tra đối chiếu với danh sách Lead hiện có
    if (existingLeads.length > 0) {
      for (const lead of existingLeads) {
        if (currentLeadId && lead.id === currentLeadId) continue;
        if (lead.isMerged) continue;

        const leadEmail = this.normalizeEmail(lead.email);
        const leadPhone = this.normalizePhone(lead.phone);
        const leadCompany = this.normalizeCompany(lead.company);

        // Trùng email
        if (inputEmail && leadEmail && inputEmail === leadEmail) {
          matches.push({
            matchType: 'email',
            matchValue: lead.email,
            targetType: 'lead',
            matchedRecordId: lead.id,
            matchedRecordName: lead.fullName,
            matchedRecordCompany: lead.company,
            matchedRecordEmail: lead.email,
            matchedRecordPhone: lead.phone,
            similarityScore: 100,
          });
          matchedLead = lead;
        }

        // Trùng số điện thoại
        if (inputPhone && leadPhone && inputPhone === leadPhone) {
          matches.push({
            matchType: 'phone',
            matchValue: lead.phone,
            targetType: 'lead',
            matchedRecordId: lead.id,
            matchedRecordName: lead.fullName,
            matchedRecordCompany: lead.company,
            matchedRecordEmail: lead.email,
            matchedRecordPhone: lead.phone,
            similarityScore: 100,
          });
          if (!matchedLead) matchedLead = lead;
        }

        // Trùng tên công ty
        if (
          inputCompany &&
          leadCompany &&
          inputCompany.length >= 4 &&
          leadCompany.length >= 4 &&
          (inputCompany === leadCompany ||
            inputCompany.includes(leadCompany) ||
            leadCompany.includes(inputCompany))
        ) {
          matches.push({
            matchType: 'company',
            matchValue: lead.company,
            targetType: 'lead',
            matchedRecordId: lead.id,
            matchedRecordName: lead.fullName,
            matchedRecordCompany: lead.company,
            matchedRecordEmail: lead.email,
            matchedRecordPhone: lead.phone,
            similarityScore: 90,
          });
          if (!matchedLead) matchedLead = lead;
        }
      }
    }

    const hasDuplicate = matches.length > 0;
    let suggestedAction: 'merge_lead' | 'link_to_customer' | 'create_new' = 'create_new';

    if (matchedCustomer) {
      suggestedAction = 'link_to_customer';
    } else if (matchedLead) {
      suggestedAction = 'merge_lead';
    }

    return {
      hasDuplicate,
      matches,
      suggestedAction,
      matchedCustomer,
      matchedLead,
    };
  }

  /**
   * Quét toàn bộ danh sách lead để tìm các cặp bản ghi trùng lặp
   */
  public findDuplicatePairs(leads: ILeadSubmission[]): IDuplicateLeadPair[] {
    const pairs: IDuplicateLeadPair[] = [];
    const activeLeads = leads.filter((l) => !l.isMerged && !l.isSpamBlocked);

    for (let i = 0; i < activeLeads.length; i++) {
      for (let j = i + 1; j < activeLeads.length; j++) {
        const a = activeLeads[i];
        const b = activeLeads[j];

        const phoneA = this.normalizePhone(a.phone);
        const phoneB = this.normalizePhone(b.phone);
        if (phoneA && phoneB && phoneA === phoneB) {
          pairs.push({
            leadA: a,
            leadB: b,
            matchType: 'phone',
            matchDetail: `Trùng số điện thoại: ${a.phone}`,
          });
          continue;
        }

        const emailA = this.normalizeEmail(a.email);
        const emailB = this.normalizeEmail(b.email);
        if (emailA && emailB && emailA === emailB) {
          pairs.push({
            leadA: a,
            leadB: b,
            matchType: 'email',
            matchDetail: `Trùng email liên hệ: ${a.email}`,
          });
          continue;
        }

        const compA = this.normalizeCompany(a.company);
        const compB = this.normalizeCompany(b.company);
        if (compA && compB && compA.length >= 4 && compA === compB) {
          pairs.push({
            leadA: a,
            leadB: b,
            matchType: 'company',
            matchDetail: `Trùng tên công ty: ${a.company}`,
          });
        }
      }
    }

    return pairs;
  }
}

export const leadDeduplicationService = new LeadDeduplicationService();
