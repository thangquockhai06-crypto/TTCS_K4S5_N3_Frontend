import { ILeadAssignmentLead } from '../types/LeadAssignmentResponseSla.types';

export const leadAssignmentResponseSlaDevelopmentNotice =
  'DEVELOPMENT MOCK DATA — No real CRM updates or SLA notifications are being executed.';

function isoFromNow(offsetMinutes: number): string {
  return new Date(Date.now() + offsetMinutes * 60_000).toISOString();
}

export function createLeadAssignmentResponseSlaMockSnapshot(): ILeadAssignmentLead[] {
  return [
    {
      id: 'lead-asg-1001',
      company: 'Northwind Logistics',
      leadName: 'Emma Nguyen',
      email: 'emma.n@northwind.vn',
      phone: '+84 987 123 456',
      source: 'Website Form',
      assignedTo: 'Lan Pham',
      assignedAt: isoFromNow(-120),
      status: 'assigned',
      slaDeadlineAt: isoFromNow(90),
      teamLead: 'Quang Tran',
    },
    {
      id: 'lead-asg-1002',
      company: 'CloudPeak Studio',
      leadName: 'Daniel Tran',
      email: 'daniel@cloudpeak.vn',
      phone: '+84 909 444 222',
      source: 'Referral',
      assignedTo: 'Lan Pham',
      assignedAt: isoFromNow(-180),
      status: 'accepted',
      slaDeadlineAt: isoFromNow(35),
      teamLead: 'Quang Tran',
    },
    {
      id: 'lead-asg-1003',
      company: 'Horizon Medical',
      leadName: 'Sarah Le',
      email: 'sarah@horizonmed.vn',
      phone: '+84 902 998 331',
      source: 'LinkedIn',
      assignedTo: 'Minh Hoang',
      assignedAt: isoFromNow(-360),
      status: 'assigned',
      slaDeadlineAt: isoFromNow(-50),
      teamLead: 'Quang Tran',
    },
    {
      id: 'lead-asg-1004',
      company: 'Metro Retail Group',
      leadName: 'Peter Huynh',
      email: 'peter@metroretail.vn',
      phone: '+84 912 776 545',
      source: 'Event Booth',
      assignedTo: 'Minh Hoang',
      assignedAt: isoFromNow(-260),
      status: 'contacted',
      firstContactAt: isoFromNow(-80),
      slaDeadlineAt: isoFromNow(120),
      teamLead: 'Quang Tran',
    },
    {
      id: 'lead-asg-1005',
      company: 'Sunrise Hotel',
      leadName: 'Amelia Vo',
      email: 'amelia@sunrisehotel.vn',
      phone: '+84 939 854 211',
      source: 'Outbound Campaign',
      assignedTo: 'Lan Pham',
      assignedAt: isoFromNow(-450),
      status: 'accepted',
      teamLead: 'Quang Tran',
    },
    {
      id: 'lead-asg-1006',
      company: 'Aster Labs',
      leadName: 'Binh Nguyen',
      email: 'binh@asterlabs.vn',
      phone: '+84 916 722 909',
      source: 'Partner CRM',
      assignedTo: 'Lan Pham',
      assignedAt: isoFromNow(-200),
      status: 'rejected',
      slaDeadlineAt: isoFromNow(20),
      rejectionReason: 'No budget approved for this quarter.',
      teamLead: 'Quang Tran',
    },
  ];
}
