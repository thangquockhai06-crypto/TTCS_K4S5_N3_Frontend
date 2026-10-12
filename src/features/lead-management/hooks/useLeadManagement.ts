import { useCallback, useEffect, useMemo, useState } from 'react';
import { leadManagementService } from '../services/LeadService';
import { ILead, ILeadFilter, ISavedLeadFilter } from '../types/Lead.types';
import {
  cloneLeadFilter,
  createEmptyLeadFilter,
  filterLeads,
  validateLeadFilterDateRange,
} from '../utils/leadFilters';

const PAGE_SIZE = 6;

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export interface IUseLeadManagementResult {
  leads: ILead[];
  now: Date;
  filteredLeads: ILead[];
  pageLeads: ILead[];
  draftFilters: ILeadFilter;
  activeFilters: ILeadFilter;
  savedFilters: ISavedLeadFilter[];
  activePresetId: string | null;
  page: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  filterError: string | null;
  actionError: string | null;
  setDraftFilters: (filters: ILeadFilter) => void;
  setPage: (page: number) => void;
  loadData: () => Promise<void>;
  applyFilters: () => boolean;
  clearFilters: () => void;
  applySavedFilter: (preset: ISavedLeadFilter) => void;
  createSavedFilter: (name: string) => Promise<boolean>;
  renameSavedFilter: (id: string, name: string) => Promise<boolean>;
  deleteSavedFilter: (id: string) => Promise<void>;
  clearActionError: () => void;
}

export function useLeadManagement(): IUseLeadManagementResult {
  const [leads, setLeads] = useState<ILead[]>([]);
  const [savedFilters, setSavedFilters] = useState<ISavedLeadFilter[]>([]);
  const [draftFilters, setDraftFilters] = useState<ILeadFilter>(createEmptyLeadFilter);
  const [activeFilters, setActiveFilters] = useState<ILeadFilter>(createEmptyLeadFilter);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [page, setPageState] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [now, setNow] = useState(() => new Date());
  const [error, setError] = useState<string | null>(null);
  const [filterError, setFilterError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const [leadData, presetData] = await Promise.all([
        leadManagementService.getLeads(),
        leadManagementService.getSavedFilters(),
      ]);
      setLeads(leadData);
      setSavedFilters(presetData);
    } catch (loadError: unknown) {
      setError(getErrorMessage(loadError, 'Không thể tải danh sách Lead.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const filteredLeads = useMemo(
    () => filterLeads(leads, activeFilters),
    [leads, activeFilters]
  );
  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / PAGE_SIZE));
  const pageLeads = useMemo(
    () => filteredLeads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredLeads, page]
  );

  const setPage = useCallback(
    (nextPage: number): void => {
      setPageState(Math.min(Math.max(1, nextPage), totalPages));
    },
    [totalPages]
  );

  const applyFilters = useCallback((): boolean => {
    const validationMessage = validateLeadFilterDateRange(draftFilters);
    if (validationMessage) {
      setFilterError(validationMessage);
      return false;
    }
    setFilterError(null);
    setActiveFilters(cloneLeadFilter(draftFilters));
    setActivePresetId(null);
    setPageState(1);
    return true;
  }, [draftFilters]);

  const clearFilters = useCallback((): void => {
    const emptyFilters = createEmptyLeadFilter();
    setDraftFilters(emptyFilters);
    setActiveFilters(emptyFilters);
    setActivePresetId(null);
    setFilterError(null);
    setActionError(null);
    setPageState(1);
  }, []);

  const applySavedFilter = useCallback((preset: ISavedLeadFilter): void => {
    const filters = cloneLeadFilter(preset.filters);
    setDraftFilters(filters);
    setActiveFilters(cloneLeadFilter(filters));
    setActivePresetId(preset.id);
    setFilterError(null);
    setPageState(1);
  }, []);

  const createSavedFilter = useCallback(
    async (name: string): Promise<boolean> => {
      setActionError(null);
      try {
        const created = await leadManagementService.createSavedFilter(name, activeFilters);
        setSavedFilters((current) => [created, ...current]);
        setActivePresetId(created.id);
        return true;
      } catch (saveError: unknown) {
        setActionError(getErrorMessage(saveError, 'Không thể lưu bộ lọc.'));
        return false;
      }
    },
    [activeFilters]
  );

  const renameSavedFilter = useCallback(
    async (id: string, name: string): Promise<boolean> => {
      setActionError(null);
      try {
        const updated = await leadManagementService.renameSavedFilter(id, name);
        setSavedFilters((current) =>
          current.map((preset) => (preset.id === id ? updated : preset))
        );
        return true;
      } catch (renameError: unknown) {
        setActionError(getErrorMessage(renameError, 'Không thể đổi tên bộ lọc.'));
        return false;
      }
    },
    []
  );

  const deleteSavedFilter = useCallback(async (id: string): Promise<void> => {
    setActionError(null);
    try {
      await leadManagementService.deleteSavedFilter(id);
      setSavedFilters((current) => current.filter((preset) => preset.id !== id));
      setActivePresetId((current) => (current === id ? null : current));
    } catch (deleteError: unknown) {
      setActionError(getErrorMessage(deleteError, 'Không thể xóa bộ lọc.'));
    }
  }, []);

  return {
    leads,
    now,
    filteredLeads,
    pageLeads,
    draftFilters,
    activeFilters,
    savedFilters,
    activePresetId,
    page,
    totalPages,
    isLoading,
    error,
    filterError,
    actionError,
    setDraftFilters,
    setPage,
    loadData,
    applyFilters,
    clearFilters,
    applySavedFilter,
    createSavedFilter,
    renameSavedFilter,
    deleteSavedFilter,
    clearActionError: () => setActionError(null),
  };
}
