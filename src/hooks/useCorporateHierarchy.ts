import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  IAssignSubsidiaryDTO,
  ICorporateGroupSummary,
  ICorporateHierarchyStats,
  ICorporateNode,
} from '../interfaces/corporate-hierarchy.interface';
import { corporateHierarchyService } from '../services/corporateHierarchyService';

export function useCorporateHierarchy(initialParentId?: string) {
  const [groups, setGroups] = useState<ICorporateGroupSummary[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(initialParentId || '');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadHierarchy = useCallback(() => {
    setIsLoading(true);
    try {
      const allGroups = corporateHierarchyService.getAllGroups();
      setGroups(allGroups);
      if (allGroups.length > 0) {
        setSelectedGroupId((prev) => (prev ? prev : allGroups[0].parentCompany.id));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHierarchy();
  }, [loadHierarchy]);

  const selectedGroupSummary = useMemo<ICorporateGroupSummary | undefined>(() => {
    if (!selectedGroupId) return groups[0];
    return corporateHierarchyService.getGroupSummary(selectedGroupId) || groups[0];
  }, [selectedGroupId, groups]);

  const availableCandidates = useMemo<ICorporateNode[]>(() => {
    if (!selectedGroupId) return [];
    return corporateHierarchyService.getAvailableCandidates(selectedGroupId);
  }, [selectedGroupId, groups]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const q = searchQuery.toLowerCase().trim();
    return groups.filter(
      (g) =>
        g.parentCompany.companyName.toLowerCase().includes(q) ||
        g.parentCompany.taxCode.toLowerCase().includes(q) ||
        g.subsidiaries.some((s) => s.companyName.toLowerCase().includes(q))
    );
  }, [groups, searchQuery]);

  const stats: ICorporateHierarchyStats = useMemo(() => {
    return corporateHierarchyService.getStats();
  }, [groups]);

  const assignSubsidiary = useCallback(
    (dto: IAssignSubsidiaryDTO) => {
      corporateHierarchyService.assignSubsidiary(dto);
      loadHierarchy();
    },
    [loadHierarchy]
  );

  const removeSubsidiary = useCallback(
    (subsidiaryId: string) => {
      corporateHierarchyService.removeSubsidiary(subsidiaryId);
      loadHierarchy();
    },
    [loadHierarchy]
  );

  const resetData = useCallback(() => {
    corporateHierarchyService.resetToMock();
    loadHierarchy();
  }, [loadHierarchy]);

  return {
    groups: filteredGroups,
    allGroups: groups,
    selectedGroupId,
    setSelectedGroupId,
    selectedGroupSummary,
    availableCandidates,
    stats,
    isLoading,
    searchQuery,
    setSearchQuery,
    assignSubsidiary,
    removeSubsidiary,
    resetData,
    refresh: loadHierarchy,
  };
}
