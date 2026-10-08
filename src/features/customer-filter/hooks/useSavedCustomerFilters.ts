import { useCallback, useEffect, useRef, useState } from 'react';
import { customerFilterService } from '../services/CustomerFilterService';
import {
  CustomerFilterState,
  SavedCustomerFilter,
} from '../types/CustomerFilter.types';

export interface UseSavedCustomerFiltersResult {
  savedFilters: SavedCustomerFilter[];
  error: string | null;
  canRetry: boolean;
  isLoading: boolean;
  isSaving: boolean;
  applyingFilterId: string | null;
  deletingFilterId: string | null;
  reload: () => Promise<void>;
  saveFilter: (name: string, state: CustomerFilterState) => Promise<boolean>;
  applyFilter: (
    filter: SavedCustomerFilter,
    applyState: (state: CustomerFilterState) => void
  ) => Promise<void>;
  deleteFilter: (filterId: string) => Promise<void>;
  clearError: () => void;
}

const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

export const useSavedCustomerFilters = (): UseSavedCustomerFiltersResult => {
  const [savedFilters, setSavedFilters] = useState<SavedCustomerFilter[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [canRetry, setCanRetry] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [applyingFilterId, setApplyingFilterId] = useState<string | null>(null);
  const [deletingFilterId, setDeletingFilterId] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const operationLock = useRef(false);

  const reload = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setCanRetry(false);
    try {
      setSavedFilters(await customerFilterService.listSavedFilters());
    } catch (loadError: unknown) {
      setError(errorMessage(loadError, 'Không thể tải bộ lọc đã lưu.'));
      setCanRetry(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload, reloadToken]);

  const saveFilter = useCallback(
    async (name: string, state: CustomerFilterState): Promise<boolean> => {
      if (operationLock.current) {
        return false;
      }
      operationLock.current = true;
      setError(null);
      setCanRetry(false);
      setIsSaving(true);
      try {
        setSavedFilters(await customerFilterService.saveFilter(name, state));
        return true;
      } catch (saveError: unknown) {
        setError(errorMessage(saveError, 'Không thể lưu bộ lọc.'));
        return false;
      } finally {
        operationLock.current = false;
        setIsSaving(false);
      }
    },
    []
  );

  const applyFilter = useCallback(
    async (
      filter: SavedCustomerFilter,
      applyState: (state: CustomerFilterState) => void
    ): Promise<void> => {
      if (operationLock.current) {
        return;
      }
      operationLock.current = true;
      setError(null);
      setCanRetry(false);
      setApplyingFilterId(filter.id);
      try {
        await new Promise<void>((resolve) => {
          window.setTimeout(resolve, 0);
        });
        applyState(filter.state);
      } catch (applyError: unknown) {
        setError(errorMessage(applyError, 'Không thể áp dụng bộ lọc.'));
      } finally {
        operationLock.current = false;
        setApplyingFilterId(null);
      }
    },
    []
  );

  const deleteFilter = useCallback(async (filterId: string): Promise<void> => {
    if (operationLock.current) {
      return;
    }
    operationLock.current = true;
    setError(null);
    setCanRetry(false);
    setDeletingFilterId(filterId);
    try {
      setSavedFilters(await customerFilterService.deleteFilter(filterId));
    } catch (deleteError: unknown) {
      setError(errorMessage(deleteError, 'Không thể xóa bộ lọc.'));
    } finally {
      operationLock.current = false;
      setDeletingFilterId(null);
    }
  }, []);

  return {
    savedFilters,
    error,
    canRetry,
    isLoading,
    isSaving,
    applyingFilterId,
    deletingFilterId,
    reload: async () => {
      setReloadToken((current) => current + 1);
    },
    saveFilter,
    applyFilter,
    deleteFilter,
    clearError: () => setError(null),
  };
};
