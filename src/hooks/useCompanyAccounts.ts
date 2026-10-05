import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CreateCompanyAccountDTO,
  ICompanyAccount,
  ICompanyFilterState,
  ICompanyStats,
  UpdateCompanyAccountDTO,
} from '../interfaces/company-account.interface';
import { useAuth } from './useAuth';
import { companyAccountService } from '../services/companyAccountService';

const DEFAULT_FILTER_STATE: ICompanyFilterState = {
  searchQuery: '',
  status: 'all',
  scale: 'all',
  industry: 'all',
  ownerTeam: 'all',
  scope: 'all_accounts',
  sortField: 'createdAt',
  sortDirection: 'desc',
  viewMode: 'grid',
};

export function useCompanyAccounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<ICompanyAccount[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterState, setFilterState] = useState<ICompanyFilterState>(() => {
    // Initial scope based on user role
    const isSalesOnly = user?.role === 'Account Executive';
    const isTeamLead = user?.role === 'VP of Sales' || user?.role === 'RevOps Lead';

    let initialScope: ICompanyFilterState['scope'] = 'all_accounts';
    if (isSalesOnly) {
      initialScope = 'my_accounts';
    } else if (isTeamLead) {
      initialScope = 'team_accounts';
    }

    return {
      ...DEFAULT_FILTER_STATE,
      scope: initialScope,
    };
  });

  const loadAccounts = useCallback(() => {
    setIsLoading(true);
    try {
      const data = companyAccountService.getAll();
      setAccounts(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // Unique lists for filter dropdowns
  const availableIndustries = useMemo(() => {
    const set = new Set<string>();
    accounts.forEach((a) => {
      if (a.industry) set.add(a.industry);
    });
    return Array.from(set);
  }, [accounts]);

  const availableTeams = useMemo(() => {
    const set = new Set<string>();
    accounts.forEach((a) => {
      if (a.ownerTeam) set.add(a.ownerTeam);
    });
    return Array.from(set);
  }, [accounts]);

  // Filtered accounts considering scope (Sales sees own, Manager sees team, Admin sees all)
  const filteredAccounts = useMemo(() => {
    let result = [...accounts];

    // 1. Data Visibility Scope Filter
    if (filterState.scope === 'my_accounts' && user) {
      result = result.filter(
        (a) =>
          a.ownerId === user.id ||
          a.ownerEmail?.toLowerCase() === user.email?.toLowerCase() ||
          a.ownerName?.toLowerCase() === user.fullName?.toLowerCase()
      );
    } else if (filterState.scope === 'team_accounts' && user) {
      const userTeam = user.department || '';
      result = result.filter(
        (a) =>
          (userTeam && a.ownerTeam?.toLowerCase().includes(userTeam.toLowerCase())) ||
          a.ownerId === user.id ||
          a.ownerName?.toLowerCase() === user.fullName?.toLowerCase()
      );
    }

    // 2. Status Filter
    if (filterState.status !== 'all') {
      result = result.filter((a) => a.status === filterState.status);
    }

    // 3. Scale Filter
    if (filterState.scale !== 'all') {
      result = result.filter((a) => a.scale === filterState.scale);
    }

    // 4. Industry Filter
    if (filterState.industry !== 'all') {
      result = result.filter((a) => a.industry === filterState.industry);
    }

    // 5. Team Filter
    if (filterState.ownerTeam !== 'all') {
      result = result.filter((a) => a.ownerTeam === filterState.ownerTeam);
    }

    // 6. Search Query
    if (filterState.searchQuery.trim()) {
      const query = filterState.searchQuery.toLowerCase().trim();
      result = result.filter(
        (a) =>
          a.companyName.toLowerCase().includes(query) ||
          a.taxCode.toLowerCase().includes(query) ||
          a.address.toLowerCase().includes(query) ||
          a.website.toLowerCase().includes(query) ||
          a.ownerName.toLowerCase().includes(query) ||
          (a.primaryContactName && a.primaryContactName.toLowerCase().includes(query)) ||
          (a.primaryContactEmail && a.primaryContactEmail.toLowerCase().includes(query))
      );
    }

    // 7. Sorting
    result.sort((a, b) => {
      let comp = 0;
      if (filterState.sortField === 'companyName') {
        comp = a.companyName.localeCompare(b.companyName, 'vi');
      } else if (filterState.sortField === 'taxCode') {
        comp = a.taxCode.localeCompare(b.taxCode);
      } else if (filterState.sortField === 'dealValueEstimate') {
        comp = (b.dealValueEstimate || 0) - (a.dealValueEstimate || 0);
      } else if (filterState.sortField === 'status') {
        comp = a.status.localeCompare(b.status);
      } else if (filterState.sortField === 'createdAt') {
        comp = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }

      return filterState.sortDirection === 'asc' ? comp : -comp;
    });

    return result;
  }, [accounts, filterState, user]);

  const stats: ICompanyStats = useMemo(() => {
    return companyAccountService.getStats(filteredAccounts);
  }, [filteredAccounts]);

  const addAccount = useCallback(
    (dto: CreateCompanyAccountDTO, ownerName: string, ownerEmail: string, ownerTeam: string): ICompanyAccount => {
      const created = companyAccountService.create(dto, ownerName, ownerEmail, ownerTeam);
      loadAccounts();
      return created;
    },
    [loadAccounts]
  );

  const updateAccount = useCallback(
    (id: string, dto: UpdateCompanyAccountDTO): ICompanyAccount => {
      const updated = companyAccountService.update(id, dto);
      loadAccounts();
      return updated;
    },
    [loadAccounts]
  );

  const deleteAccount = useCallback(
    (id: string): boolean => {
      const deleted = companyAccountService.delete(id);
      if (deleted) {
        loadAccounts();
      }
      return deleted;
    },
    [loadAccounts]
  );

  const checkTaxCodeUnique = useCallback((taxCode: string, excludeId?: string): boolean => {
    return !companyAccountService.isTaxCodeTaken(taxCode, excludeId);
  }, []);

  const exportCsv = useCallback(() => {
    companyAccountService.exportToCsv(filteredAccounts);
  }, [filteredAccounts]);

  const resetData = useCallback(() => {
    companyAccountService.resetToMock();
    loadAccounts();
  }, [loadAccounts]);

  return {
    accounts: filteredAccounts,
    allAccounts: accounts,
    stats,
    isLoading,
    currentUser: user,
    filterState,
    setFilterState,
    availableIndustries,
    availableTeams,
    addAccount,
    updateAccount,
    deleteAccount,
    checkTaxCodeUnique,
    exportCsv,
    resetData,
    refresh: loadAccounts,
  };
}
