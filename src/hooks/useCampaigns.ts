import { useState, useCallback, useMemo } from 'react';
import {
  ICampaign,
  ICreateCampaignDTO,
  ICampaignPerformanceSummary,
  ICampaignFilterState,
} from '../interfaces/campaign.interface';
import { campaignService } from '../services/campaignService';
import { useCRMData } from '../context/CRMDataContext';
import { useLeadCapture } from './useLeadCapture';
import { useToast } from '../context/ToastContext';

export function useCampaigns() {
  const { deals } = useCRMData();
  const { submissions: leads } = useLeadCapture();
  const { showToast } = useToast();

  const [campaigns, setCampaigns] = useState<ICampaign[]>(() =>
    campaignService.getCampaigns()
  );
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  const [filterState, setFilterState] = useState<ICampaignFilterState>({
    searchQuery: '',
    channel: 'All',
    status: 'All',
    sortBy: 'startDate',
    sortOrder: 'desc',
  });

  const reload = useCallback(() => {
    setCampaigns(campaignService.getCampaigns());
  }, []);

  const createCampaign = useCallback(
    (dto: ICreateCampaignDTO): ICampaign => {
      const created = campaignService.createCampaign(dto);
      reload();
      showToast(`Đã khai báo chiến dịch mới "${created.name}" thành công!`, 'success');
      return created;
    },
    [reload, showToast]
  );

  const updateCampaign = useCallback(
    (id: string, partial: Partial<ICampaign>): ICampaign | null => {
      const updated = campaignService.updateCampaign(id, partial);
      if (updated) {
        reload();
        showToast(`Đã cập nhật chiến dịch "${updated.name}" thành công!`, 'success');
      }
      return updated;
    },
    [reload, showToast]
  );

  const deleteCampaign = useCallback(
    (id: string): boolean => {
      const target = campaigns.find((c) => c.id === id);
      const name = target ? target.name : 'Chiến dịch';
      const success = campaignService.deleteCampaign(id);
      if (success) {
        reload();
        if (selectedCampaignId === id) {
          setSelectedCampaignId(null);
        }
        showToast(`Đã xóa chiến dịch "${name}" khỏi hệ thống!`, 'success');
      }
      return success;
    },
    [campaigns, reload, selectedCampaignId, showToast]
  );

  // Performance calculations for all campaigns
  const performanceList: ICampaignPerformanceSummary[] = useMemo(() => {
    return campaignService.getAllCampaignsPerformance(leads, deals);
  }, [leads, deals]);

  // Overall totals across all campaigns
  const totalMetrics = useMemo(() => {
    const totalBudget = performanceList.reduce((sum, p) => sum + p.budget, 0);
    const totalLeads = performanceList.reduce((sum, p) => sum + p.totalLeads, 0);
    const totalDeals = performanceList.reduce((sum, p) => sum + p.totalDeals, 0);
    const totalWonRevenue = performanceList.reduce((sum, p) => sum + p.wonRevenue, 0);
    const overallRoi =
      totalBudget > 0
        ? `${(((totalWonRevenue - totalBudget) / totalBudget) * 100).toFixed(1)}%`
        : totalWonRevenue > 0
        ? '100%'
        : '0.0%';

    return {
      totalBudget,
      totalLeads,
      totalDeals,
      totalWonRevenue,
      overallRoi,
    };
  }, [performanceList]);

  // Filtered and sorted campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      if (filterState.channel !== 'All' && c.channel !== filterState.channel) {
        return false;
      }
      if (filterState.status !== 'All' && c.status !== filterState.status) {
        return false;
      }
      if (filterState.searchQuery.trim()) {
        const q = filterState.searchQuery.toLowerCase().trim();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesCode = c.code.toLowerCase().includes(q);
        const matchesChannel = c.channel.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesChannel) return false;
      }
      return true;
    }).sort((a, b) => {
      const order = filterState.sortOrder === 'asc' ? 1 : -1;
      if (filterState.sortBy === 'budget') {
        return (a.budget - b.budget) * order;
      }
      if (filterState.sortBy === 'startDate') {
        return a.startDate.localeCompare(b.startDate) * order;
      }
      return a.name.localeCompare(b.name) * order;
    });
  }, [campaigns, filterState]);

  // Active selected campaign
  const selectedCampaign = useMemo(() => {
    if (!selectedCampaignId) return null;
    return campaigns.find((c) => c.id === selectedCampaignId) || null;
  }, [campaigns, selectedCampaignId]);

  // Leads and deals belonging to the selected campaign
  const selectedCampaignLeads = useMemo(() => {
    if (!selectedCampaign) return leads;
    return leads.filter(
      (l) =>
        l.campaignId === selectedCampaign.id ||
        (l.leadSource && l.leadSource.toLowerCase().includes(selectedCampaign.name.toLowerCase())) ||
        (l.leadSource && l.leadSource.toLowerCase().includes(selectedCampaign.code.toLowerCase()))
    );
  }, [leads, selectedCampaign]);

  const selectedCampaignDeals = useMemo(() => {
    if (!selectedCampaign) return deals;
    return deals.filter(
      (d) =>
        d.campaignId === selectedCampaign.id ||
        (d.campaignName && d.campaignName.toLowerCase().includes(selectedCampaign.name.toLowerCase())) ||
        (d.tags && d.tags.some((t) => t.toLowerCase().includes(selectedCampaign.code.toLowerCase())))
    );
  }, [deals, selectedCampaign]);

  return {
    campaigns,
    filteredCampaigns,
    selectedCampaignId,
    setSelectedCampaignId,
    selectedCampaign,
    selectedCampaignLeads,
    selectedCampaignDeals,
    performanceList,
    totalMetrics,
    filterState,
    setFilterState,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    reload,
  };
}
