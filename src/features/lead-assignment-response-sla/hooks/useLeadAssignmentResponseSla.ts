import { useCallback, useEffect, useMemo, useState } from 'react';
import { leadAssignmentResponseSlaService } from '../services/LeadAssignmentResponseSlaService';
import { ILeadAssignmentLead } from '../types/LeadAssignmentResponseSla.types';

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export interface IUseLeadAssignmentResponseSlaResult {
  leads: ILeadAssignmentLead[];
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  pendingAcceptId: string | null;
  pendingRejectId: string | null;
  now: Date;
  developmentNotice: string | null;
  loadData: () => Promise<void>;
  acceptLead: (leadId: string) => Promise<boolean>;
  rejectLead: (leadId: string, reason: string) => Promise<boolean>;
  clearMessages: () => void;
}

export function useLeadAssignmentResponseSla(): IUseLeadAssignmentResponseSlaResult {
  const [leads, setLeads] = useState<ILeadAssignmentLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pendingAcceptId, setPendingAcceptId] = useState<string | null>(null);
  const [pendingRejectId, setPendingRejectId] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  const loadData = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      setLeads(await leadAssignmentResponseSlaService.getAssignedLeads());
    } catch (loadError: unknown) {
      setError(getErrorMessage(loadError, 'Unable to load assigned leads.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const runAction = useCallback(
    async (leadId: string, action: () => Promise<ILeadAssignmentLead>, successText: string): Promise<boolean> => {
      setError(null);
      setSuccessMessage(null);
      try {
        const updatedLead = await action();
        setLeads((currentLeads) =>
          currentLeads.map((lead) => (lead.id === leadId ? updatedLead : lead))
        );
        setSuccessMessage(successText);
        return true;
      } catch (actionError: unknown) {
        setError(getErrorMessage(actionError, 'Unable to update the lead status.'));
        return false;
      }
    },
    []
  );

  const acceptLead = useCallback(
    async (leadId: string): Promise<boolean> => {
      setPendingAcceptId(leadId);
      try {
        return await runAction(
          leadId,
          () => leadAssignmentResponseSlaService.acceptLead(leadId),
          'The lead was accepted successfully and is now in progress. Acceptance alone does not satisfy SLA.'
        );
      } finally {
        setPendingAcceptId(null);
      }
    },
    [runAction]
  );

  const rejectLead = useCallback(
    async (leadId: string, reason: string): Promise<boolean> => {
      setPendingRejectId(leadId);
      try {
        return await runAction(
          leadId,
          () => leadAssignmentResponseSlaService.rejectLead(leadId, reason),
          'The lead was rejected and returned to the assignment queue.'
        );
      } finally {
        setPendingRejectId(null);
      }
    },
    [runAction]
  );

  const clearMessages = useCallback((): void => {
    setError(null);
    setSuccessMessage(null);
  }, []);

  return useMemo(
    () => ({
      leads,
      isLoading,
      error,
      successMessage,
      pendingAcceptId,
      pendingRejectId,
      now,
      developmentNotice: leadAssignmentResponseSlaService.developmentNotice,
      loadData,
      acceptLead,
      rejectLead,
      clearMessages,
    }),
    [acceptLead, clearMessages, error, isLoading, leads, loadData, now, pendingAcceptId, pendingRejectId, rejectLead, successMessage]
  );
}
