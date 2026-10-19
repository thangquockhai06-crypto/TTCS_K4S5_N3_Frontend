import { useCallback, useEffect, useMemo, useState } from 'react';
import { IDeal } from '../../../interfaces';
import {
  IOpportunityFilterCriteria,
  IOpportunityProductsByDeal,
  IOpportunitySearchFilterState,
  ISavedOpportunityFilter,
  OpportunityFilterKey,
} from '../types/OpportunitySearchFilter.types';
import {
  cloneOpportunityFilters,
  EMPTY_OPPORTUNITY_FILTERS,
  filterOpportunities,
  getActiveOpportunityFilterCount,
  validateOpportunityFilters,
} from '../utils/opportunityFilters';

const STORAGE_KEY_PREFIX = 'nexuscrm:opportunity-filters:v1';

function isSavedFilter(value: unknown): value is ISavedOpportunityFilter {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ISavedOpportunityFilter>;
  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.name !== 'string' ||
    !candidate.criteria ||
    typeof candidate.criteria !== 'object'
  ) {
    return false;
  }
  return Object.entries(EMPTY_OPPORTUNITY_FILTERS).every(([key, emptyValue]) => {
    const criterion = candidate.criteria?.[key as OpportunityFilterKey];
    return typeof criterion === typeof emptyValue;
  });
}

export function useOpportunitySearchFilter(
  deals: ReadonlyArray<IDeal>,
  userId: string,
  productsByDeal: IOpportunityProductsByDeal
): IOpportunitySearchFilterState {
  const storageKey = `${STORAGE_KEY_PREFIX}:${encodeURIComponent(userId)}`;
  const [draftCriteria, setDraftCriteriaState] =
    useState<IOpportunityFilterCriteria>(() => cloneOpportunityFilters(EMPTY_OPPORTUNITY_FILTERS));
  const [activeCriteria, setActiveCriteria] =
    useState<IOpportunityFilterCriteria>(() => cloneOpportunityFilters(EMPTY_OPPORTUNITY_FILTERS));
  const [savedFilters, setSavedFilters] = useState<ISavedOpportunityFilter[]>([]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);

  useEffect(() => {
    const emptyCriteria = cloneOpportunityFilters(EMPTY_OPPORTUNITY_FILTERS);
    setDraftCriteriaState(emptyCriteria);
    setActiveCriteria(emptyCriteria);
    setActivePresetId(null);
    setValidationError(null);
    setPersistenceError(null);

    try {
      const storedFilters = window.localStorage.getItem(storageKey);
      if (!storedFilters) {
        setSavedFilters([]);
        return;
      }

      const parsed: unknown = JSON.parse(storedFilters);
      if (!Array.isArray(parsed) || !parsed.every(isSavedFilter)) {
        throw new Error('Định dạng bộ lọc đã lưu không hợp lệ.');
      }
      setSavedFilters(parsed.map((filter) => ({
        ...filter,
        criteria: cloneOpportunityFilters(filter.criteria),
      })));
      setPersistenceError(null);
    } catch (error: unknown) {
      setSavedFilters([]);
      setPersistenceError(
        error instanceof Error
          ? `Không thể đọc bộ lọc đã lưu trên trình duyệt: ${error.message}`
          : 'Không thể đọc bộ lọc đã lưu trên trình duyệt.'
      );
    }
  }, [storageKey]);

  const persistFilters = useCallback(
    (nextFilters: ISavedOpportunityFilter[]): boolean => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(nextFilters));
        setSavedFilters(nextFilters);
        setPersistenceError(null);
        return true;
      } catch (error: unknown) {
        setPersistenceError(
          error instanceof Error
            ? `Không thể lưu bộ lọc trên trình duyệt: ${error.message}`
            : 'Không thể lưu bộ lọc trên trình duyệt.'
        );
        return false;
      }
    },
    [storageKey]
  );

  const applyCriteria = useCallback((): boolean => {
    const error = validateOpportunityFilters(draftCriteria);
    if (error) {
      setValidationError(error);
      return false;
    }
    setValidationError(null);
    setActiveCriteria(cloneOpportunityFilters(draftCriteria));
    setActivePresetId(null);
    return true;
  }, [draftCriteria]);

  const clearAll = useCallback((): void => {
    const emptyCriteria = cloneOpportunityFilters(EMPTY_OPPORTUNITY_FILTERS);
    setDraftCriteriaState(emptyCriteria);
    setActiveCriteria(emptyCriteria);
    setActivePresetId(null);
    setValidationError(null);
  }, []);

  const clearActiveCondition = useCallback((key: OpportunityFilterKey): void => {
    setActiveCriteria((current) => ({ ...current, [key]: '' }));
    setDraftCriteriaState((current) => ({ ...current, [key]: '' }));
    setActivePresetId(null);
    setValidationError(null);
  }, []);

  const applySavedFilter = useCallback((filter: ISavedOpportunityFilter): void => {
    const criteria = cloneOpportunityFilters(filter.criteria);
    setDraftCriteriaState(criteria);
    setActiveCriteria(cloneOpportunityFilters(criteria));
    setActivePresetId(filter.id);
    setValidationError(null);
  }, []);

  const saveCurrentFilter = useCallback(
    (name: string): boolean => {
      const normalizedName = name.trim();
      if (!normalizedName) {
        setPersistenceError('Nhập tên bộ lọc trước khi lưu.');
        return false;
      }
      if (
        savedFilters.some(
          (filter) => filter.name.toLocaleLowerCase() === normalizedName.toLocaleLowerCase()
        )
      ) {
        setPersistenceError('Tên bộ lọc này đã được sử dụng.');
        return false;
      }

      const filter: ISavedOpportunityFilter = {
        id: `opportunity-filter-${Date.now()}`,
        name: normalizedName,
        criteria: cloneOpportunityFilters(activeCriteria),
      };
      const nextFilters = [filter, ...savedFilters];
      if (!persistFilters(nextFilters)) return false;
      setActivePresetId(filter.id);
      return true;
    },
    [activeCriteria, persistFilters, savedFilters]
  );

  const deleteSavedFilter = useCallback(
    (id: string): void => {
      const nextFilters = savedFilters.filter((filter) => filter.id !== id);
      if (persistFilters(nextFilters)) {
        setActivePresetId((current) => (current === id ? null : current));
      }
    },
    [persistFilters, savedFilters]
  );

  const filteredDeals = useMemo(
    () => filterOpportunities(deals, activeCriteria, productsByDeal),
    [deals, activeCriteria, productsByDeal]
  );

  return {
    filteredDeals,
    draftCriteria,
    activeCriteria,
    savedFilters,
    activePresetId,
    activeFilterCount: getActiveOpportunityFilterCount(activeCriteria),
    validationError,
    persistenceError,
    applyCriteria,
    clearAll,
    clearActiveCondition,
    applySavedFilter,
    saveCurrentFilter,
    deleteSavedFilter,
    setDraftCriteria: setDraftCriteriaState,
  };
}
