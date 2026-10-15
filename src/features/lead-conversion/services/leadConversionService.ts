import {
  ILeadConversionRequest,
  ILeadConversionResponse,
} from '../types/LeadConversion.types';

export interface ILeadConversionService {
  convertLead(request: ILeadConversionRequest): Promise<ILeadConversionResponse>;
}

class MockLeadConversionService implements ILeadConversionService {
  private readonly conversionDelayMs = 450;

  async convertLead(request: ILeadConversionRequest): Promise<ILeadConversionResponse> {
    const normalized = {
      companyName: request.companyName.trim(),
      contactName: request.contactName.trim(),
      email: request.email.trim(),
      phone: request.phone.trim(),
      leadOwner: request.leadOwner.trim(),
    };

    if (!normalized.companyName) {
      throw new Error('Tên công ty là bắt buộc để chuyển đổi Lead.');
    }
    if (!normalized.contactName) {
      throw new Error('Tên người liên hệ là bắt buộc để chuyển đổi Lead.');
    }
    if (!normalized.email) {
      throw new Error('Email người liên hệ là bắt buộc để chuyển đổi Lead.');
    }
    if (!normalized.phone) {
      throw new Error('Số điện thoại là bắt buộc để chuyển đổi Lead.');
    }
    if (!normalized.leadOwner) {
      throw new Error('Người phụ trách lead là bắt buộc để chuyển đổi.');
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(normalized.email)) {
      throw new Error('Email không hợp lệ.');
    }

    const digitsOnly = normalized.phone.replace(/\D+/g, '');
    if (digitsOnly.length < 8) {
      throw new Error('Số điện thoại phải chứa ít nhất 8 chữ số.');
    }

    await new Promise<void>((resolve) => window.setTimeout(resolve, this.conversionDelayMs));

    const now = new Date();
    const customerId = `cust-${request.leadId.replace('lead-', '')}`;
    const contactId = `contact-${request.leadId.replace('lead-', '')}`;
    const opportunityId = `opp-${request.leadId.replace('lead-', '')}`;

    return {
      leadId: request.leadId,
      customerId,
      contactId,
      opportunityId,
      customerName: normalized.companyName,
      opportunityName: `${normalized.companyName} - ${normalized.contactName}`,
      convertedAt: now.toISOString(),
      customerRoute: `/customers/${customerId}`,
      opportunityRoute: `/pipeline`,
      warning: 'DEVELOPMENT MOCK DATA — No real customer, contact, opportunity, or activity records have been created.',
    };
  }
}

export const leadConversionService: ILeadConversionService = new MockLeadConversionService();
