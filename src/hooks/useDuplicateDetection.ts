import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  IDuplicatePair,
  IDuplicateStats,
  IMergeCustomerDTO,
  IMergeHistoryRecord,
} from '../interfaces/duplicate-merge.interface';
import { useAuth } from './useAuth';
import { duplicateMergeService } from '../services/duplicateMergeService';

export function useDuplicateDetection() {
  const { user } = useAuth();
  const [pairs, setPairs] = useState<IDuplicatePair[]>([]);
  const [history, setHistory] = useState<IMergeHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'history' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Role check: Only Team Lead or above (VP of Sales, Super Admin, RevOps Lead) can execute merges
  const isTeamLeadOrAbove = useMemo(() => {
    if (!user) return false;
    const role = user.role;
    return role === 'Super Admin' || role === 'VP of Sales' || role === 'RevOps Lead';
  }, [user]);

  const loadData = useCallback(() => {
    setIsLoading(true);
    try {
      setPairs(duplicateMergeService.getAllPairs());
      setHistory(duplicateMergeService.getMergeHistory());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredPairs = useMemo(() => {
    let result = [...pairs];

    if (activeTab === 'pending') {
      result = result.filter((p) => p.status === 'pending');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.primaryRecord.companyName.toLowerCase().includes(q) ||
          p.duplicateRecord.companyName.toLowerCase().includes(q) ||
          p.primaryRecord.taxCode.toLowerCase().includes(q) ||
          p.duplicateRecord.taxCode.toLowerCase().includes(q) ||
          p.primaryRecord.ownerName.toLowerCase().includes(q) ||
          p.duplicateRecord.ownerName.toLowerCase().includes(q)
      );
    }

    return result;
  }, [pairs, activeTab, searchQuery]);

  const stats: IDuplicateStats = useMemo(() => {
    return duplicateMergeService.getStats();
  }, [pairs]);

  const executeMerge = useCallback(
    (dto: IMergeCustomerDTO): IMergeHistoryRecord => {
      const result = duplicateMergeService.executeMerge(dto);
      loadData();
      return result;
    },
    [loadData]
  );

  const dismissPair = useCallback(
    (pairId: string) => {
      duplicateMergeService.dismissPair(pairId);
      loadData();
    },
    [loadData]
  );

  const resetData = useCallback(() => {
    duplicateMergeService.resetToMock();
    loadData();
  }, [loadData]);

  return {
    pairs: filteredPairs,
    allPairs: pairs,
    history,
    stats,
    isLoading,
    currentUser: user,
    isTeamLeadOrAbove,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    executeMerge,
    dismissPair,
    resetData,
    refresh: loadData,
  };
}
