import { useCallback, useEffect, useState } from 'react';
import { opportunityHistoryService } from '../services/OpportunityHistoryService';
import { IOpportunityHistoryEntry } from '../types/OpportunityHistory.types';

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Không thể tải lịch sử thay đổi cơ hội.';
}

export interface IUseOpportunityHistoryResult {
  entries: IOpportunityHistoryEntry[];
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

export function useOpportunityHistory(
  opportunityId: string | null,
  enabled: boolean
): IUseOpportunityHistoryResult {
  const [entries, setEntries] = useState<IOpportunityHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestNumber, setRequestNumber] = useState(0);

  const retry = useCallback((): void => {
    setRequestNumber((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!enabled || !opportunityId) {
      setEntries([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    let isCurrentRequest = true;
    setEntries([]);
    setIsLoading(true);
    setError(null);

    opportunityHistoryService
      .getHistory(opportunityId)
      .then((history) => {
        if (isCurrentRequest) {
          setEntries(history);
        }
      })
      .catch((requestError: unknown) => {
        if (isCurrentRequest) {
          setError(getErrorMessage(requestError));
        }
      })
      .finally(() => {
        if (isCurrentRequest) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [enabled, opportunityId, requestNumber]);

  return { entries, isLoading, error, retry };
}
