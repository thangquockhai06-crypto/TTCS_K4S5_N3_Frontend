import { useCallback, useEffect, useMemo, useState } from 'react';
import { leadRoutingService } from '../services/LeadRoutingService';
import {
  ILeadRoutingRuleDraft,
  ILeadRoutingSnapshot,
} from '../types/LeadRouting.types';

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export interface IUseLeadRoutingConfigurationResult {
  snapshot: ILeadRoutingSnapshot | null;
  now: Date;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  actionError: string | null;
  successMessage: string | null;
  developmentNotice: string | null;
  loadData: () => Promise<void>;
  saveRule: (rule: ILeadRoutingRuleDraft) => Promise<boolean>;
  setRuleActive: (ruleId: string, isActive: boolean) => Promise<boolean>;
  savePriorityOrder: (ruleIds: string[]) => Promise<boolean>;
  assignLead: (leadId: string, employeeId: string) => Promise<boolean>;
  clearMessages: () => void;
}

export function useLeadRoutingConfiguration(): IUseLeadRoutingConfigurationResult {
  const [snapshot, setSnapshot] = useState<ILeadRoutingSnapshot | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      setSnapshot(await leadRoutingService.getSnapshot());
    } catch (loadError: unknown) {
      setError(getErrorMessage(loadError, 'Không thể tải cấu hình điều phối Lead.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(timer);
  }, []);

  const runAction = useCallback(
    async (
      action: () => Promise<ILeadRoutingSnapshot>,
      success: string
    ): Promise<boolean> => {
      setActionError(null);
      setSuccessMessage(null);
      setIsSaving(true);
      try {
        setSnapshot(await action());
        setSuccessMessage(success);
        return true;
      } catch (actionFailure: unknown) {
        setActionError(getErrorMessage(actionFailure, 'Không thể lưu thay đổi.'));
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  const saveRule = useCallback(
    (rule: ILeadRoutingRuleDraft): Promise<boolean> =>
      runAction(() => leadRoutingService.saveRule(rule), 'Quy tắc đã được lưu (bản mô phỏng).'),
    [runAction]
  );

  const setRuleActive = useCallback(
    (ruleId: string, isActive: boolean): Promise<boolean> =>
      runAction(
        () => leadRoutingService.setRuleActive(ruleId, isActive),
        'Trạng thái quy tắc đã được lưu (bản mô phỏng).'
      ),
    [runAction]
  );

  const savePriorityOrder = useCallback(
    (ruleIds: string[]): Promise<boolean> =>
      runAction(
        () => leadRoutingService.savePriorityOrder(ruleIds),
        'Thứ tự ưu tiên đã được lưu và xác nhận bởi dịch vụ mô phỏng.'
      ),
    [runAction]
  );

  const assignLead = useCallback(
    (leadId: string, employeeId: string): Promise<boolean> =>
      runAction(
        () => leadRoutingService.assignLead(leadId, employeeId),
        'Đã ghi nhận phân công thủ công trong dữ liệu mô phỏng.'
      ),
    [runAction]
  );

  const clearMessages = useCallback((): void => {
    setActionError(null);
    setSuccessMessage(null);
  }, []);

  return useMemo(
    () => ({
      snapshot,
      now,
      isLoading,
      isSaving,
      error,
      actionError,
      successMessage,
      developmentNotice: leadRoutingService.developmentNotice,
      loadData,
      saveRule,
      setRuleActive,
      savePriorityOrder,
      assignLead,
      clearMessages,
    }),
    [
      snapshot,
      now,
      isLoading,
      isSaving,
      error,
      actionError,
      successMessage,
      loadData,
      saveRule,
      setRuleActive,
      savePriorityOrder,
      assignLead,
      clearMessages,
    ]
  );
}
