import {
  leadAssignmentResponseSlaDevelopmentNotice,
  createLeadAssignmentResponseSlaMockSnapshot,
} from '../mocks/leadAssignmentResponseSla.mock';
import { ILeadAssignmentLead } from '../types/LeadAssignmentResponseSla.types';

export interface ILeadAssignmentResponseSlaService {
  readonly developmentNotice: string | null;
  getAssignedLeads(): Promise<ILeadAssignmentLead[]>;
  acceptLead(leadId: string): Promise<ILeadAssignmentLead>;
  rejectLead(leadId: string, reason: string): Promise<ILeadAssignmentLead>;
}

function cloneLeads(leads: ILeadAssignmentLead[]): ILeadAssignmentLead[] {
  return leads.map((lead) => ({ ...lead }));
}

class MockLeadAssignmentResponseSlaService implements ILeadAssignmentResponseSlaService {
  readonly developmentNotice = leadAssignmentResponseSlaDevelopmentNotice;
  private leads = createLeadAssignmentResponseSlaMockSnapshot();

  async getAssignedLeads(): Promise<ILeadAssignmentLead[]> {
    await this.delay();
    return cloneLeads(this.leads);
  }

  async acceptLead(leadId: string): Promise<ILeadAssignmentLead> {
    await this.delay();
    const lead = this.leads.find((item) => item.id === leadId);
    if (!lead) {
      throw new Error('Lead is no longer available for acceptance.');
    }

    if (lead.status === 'rejected') {
      throw new Error('This lead was rejected already and has returned to the queue.');
    }

    const updated = {
      ...lead,
      status: 'accepted' as const,
      rejectionReason: undefined,
    };

    this.leads = this.leads.map((item) => (item.id === leadId ? updated : item));
    return { ...updated };
  }

  async rejectLead(leadId: string, reason: string): Promise<ILeadAssignmentLead> {
    await this.delay();
    const lead = this.leads.find((item) => item.id === leadId);
    if (!lead) {
      throw new Error('Lead no longer exists in the current assignment queue.');
    }

    const trimmed = reason.trim();
    if (!trimmed) {
      throw new Error('Rejection reason is required.');
    }

    const updated = {
      ...lead,
      status: 'rejected' as const,
      rejectionReason: trimmed,
    };

    this.leads = this.leads.map((item) => (item.id === leadId ? updated : item));
    return { ...updated };
  }

  private delay(): Promise<void> {
    return new Promise<void>((resolve) => window.setTimeout(resolve, 200));
  }
}

class UnavailableLeadAssignmentResponseSlaService implements ILeadAssignmentResponseSlaService {
  readonly developmentNotice = null;

  private unavailable(): Error {
    return new Error(
      'Lead response SLA APIs are not integrated. Connect the authorized CRM contract before enabling production use.'
    );
  }

  async getAssignedLeads(): Promise<ILeadAssignmentLead[]> {
    throw this.unavailable();
  }

  async acceptLead(_leadId: string): Promise<ILeadAssignmentLead> {
    throw this.unavailable();
  }

  async rejectLead(_leadId: string, _reason: string): Promise<ILeadAssignmentLead> {
    throw this.unavailable();
  }
}

export const leadAssignmentResponseSlaService: ILeadAssignmentResponseSlaService =
  import.meta.env.DEV
    ? new MockLeadAssignmentResponseSlaService()
    : new UnavailableLeadAssignmentResponseSlaService();
