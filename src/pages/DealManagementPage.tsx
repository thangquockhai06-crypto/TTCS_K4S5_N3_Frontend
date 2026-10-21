import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  BarChart3,
  Calendar,
  ChevronRight,
  Clock,
  Edit2,
  FileSpreadsheet,
  FileText,
  Filter,
  Kanban,
  List,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  Trash2,
  TrendingUp,
  User,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  IDeal,
  ISalesForecast,
  ICreateDealItemPayload,
} from '../interfaces';
import { dealService } from '../services/dealService';
import { sprint2Service } from '../services/sprint2Service';
import { userService } from '../services/userService';
import { IUserItem } from '../interfaces/user-management.interface';
import { useAuthorization } from '../hooks/useAuthorization';
import { formatCurrency, formatCompactCurrency, formatNumberWithCommas, parseNumberFromCommas, formatDealStage } from '../utils/formatters';
import { showGlobalToast, ToastType } from '../context/ToastContext';
import { Badge, Button, Modal, SearchBar, SearchableSelect } from '../components/common';
import styles from './DealManagementPage.module.css';

const notifyToast = (opts: { title?: string; description?: string; type?: ToastType }) => {
  showGlobalToast(`${opts.title ? opts.title + ': ' : ''}${opts.description || ''}`, opts.type || 'info');
};

const STAGES = [
  { id: 'lead', name: 'Tiềm năng', prob: 20, color: '#64748b' },
  { id: 'contacted', name: 'Đã tiếp xúc', prob: 40, color: '#3b82f6' },
  { id: 'proposal', name: 'Đề xuất giải pháp', prob: 60, color: '#8b5cf6' },
  { id: 'negotiation', name: 'Đàm phán hợp đồng', prob: 80, color: '#f59e0b' },
  { id: 'won', name: 'Chốt thành công', prob: 100, color: '#16a34a' },
  { id: 'lost', name: 'Đã thất bại', prob: 0, color: '#ef4444' },
];

export const normalizeStage = (st?: string): string => {
  const s = (st || '').toLowerCase().trim();
  if (s === 'contact') return 'contacted';
  return s || 'lead';
};

export const DealManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { isLeader } = useAuthorization();

  // Main state
  const [deals, setDeals] = useState<IDeal[]>([]);
  const [forecast, setForecast] = useState<ISalesForecast | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'table' | 'visualize'>('kanban');

  // Filters (S6-01 & S6-02)
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [stalledOnly, setStalledOnly] = useState<boolean>(false);
  const [stageFilter, setStageFilter] = useState<string>('');
  const [minValueFilter, setMinValueFilter] = useState<string>('');
  const [maxValueFilter, setMaxValueFilter] = useState<string>('');
  const [closeDateFromFilter, setCloseDateFromFilter] = useState<string>('');
  const [closeDateToFilter, setCloseDateToFilter] = useState<string>('');
  const [ownerFilter, setOwnerFilter] = useState<string>('');
  const [productFilter, setProductFilter] = useState<string>('');
  const [quickValuePreset, setQuickValuePreset] = useState<'all' | 'under50' | '50to200' | '200to500' | 'above500'>('all');
  const [quickDatePreset, setQuickDatePreset] = useState<'all' | 'today' | 'this_month' | 'this_quarter' | 'overdue'>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [selectedDeals, setSelectedDeals] = useState<string[]>([]);

  // Per-column pagination and search for Kanban
  const [columnPages, setColumnPages] = useState<Record<string, number>>({
    lead: 1,
    contacted: 1,
    proposal: 1,
    negotiation: 1,
    won: 1,
    lost: 1,
  });
  const [columnSearches, setColumnSearches] = useState<Record<string, string>>({});
  const [columnPageSize, setColumnPageSize] = useState<number>(5);

  // Table pagination
  const [tablePage, setTablePage] = useState<number>(1);
  const [tableLimit, setTableLimit] = useState<number>(10);

  // Drag and drop state
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
  const [activeDropStage, setActiveDropStage] = useState<string | null>(null);

  // Catalogs
  const [products, setProducts] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<IUserItem[]>([]);

  // Modals
  const [isCloseModalOpen, setIsCloseModalOpen] = useState<boolean>(false);
  const [isItemsModalOpen, setIsItemsModalOpen] = useState<boolean>(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState<boolean>(false);
  const [isOverrideStageModalOpen, setIsOverrideStageModalOpen] = useState<boolean>(false);

  // Active records for action
  const [activeDeal, setActiveDeal] = useState<IDeal | null>(null);
  const [targetStage, setTargetStage] = useState<string>('');
  const [overrideReason, setOverrideReason] = useState<string>('');

  // Forms
  const [closeForm, setCloseForm] = useState({
    stage: 'won' as 'won' | 'lost',
    actualValue: 50000000,
    signingDate: new Date().toISOString().split('T')[0],
    lossReason: '',
    lossCompetitor: '',
  });

  const [newItemForm, setNewItemForm] = useState<ICreateDealItemPayload>({
    productId: '',
    productName: '',
    quantity: 1,
    unitPrice: 10000000,
    discountPercent: 0,
    billingCycle: 'annual',
  });

  const [reassignForm, setReassignForm] = useState({
    newOwnerId: '',
    reason: '',
  });

  // Load Catalogs
  useEffect(() => {
    sprint2Service.getProducts().then(setProducts).catch(() => {});
    userService
      .getUsers({ search: '', role: 'all', status: 'all', group: 'all', page: 1, limit: 100 })
      .then((res) => {
        if (res && res.data) setUsersList(res.data);
      })
      .catch(() => {});
  }, []);

  // Fetch Deals & Forecast (S6-01 & S6-02 Filters)
  const fetchDealsAndForecast = useCallback(async () => {
    setIsLoading(true);
    try {
      const [dealsRes, forecastRes] = await Promise.all([
        dealService.getDeals({
          search: searchQuery.trim() || undefined,
          stalled_only: stalledOnly || undefined,
          stage: stageFilter || undefined,
          min_value: minValueFilter ? Number(minValueFilter) : undefined,
          max_value: maxValueFilter ? Number(maxValueFilter) : undefined,
          close_date_from: closeDateFromFilter || undefined,
          close_date_to: closeDateToFilter || undefined,
          owner_id: ownerFilter || undefined,
          product_id: productFilter || undefined,
        }),
        dealService.getSalesForecast(),
      ]);
      setDeals(dealsRes);
      setForecast(forecastRes);
    } catch (err: any) {
      notifyToast({
        title: 'Lỗi tải cơ hội bán hàng',
        description: err.response?.data?.detail || 'Không thể kết nối đến máy chủ',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    searchQuery,
    stalledOnly,
    stageFilter,
    minValueFilter,
    maxValueFilter,
    closeDateFromFilter,
    closeDateToFilter,
    ownerFilter,
    productFilter,
  ]);

  useEffect(() => {
    fetchDealsAndForecast();
  }, [fetchDealsAndForecast]);

  // Stage move handler
  const handleMoveStage = async (deal: IDeal, nextStage: string, override: boolean = false) => {
    try {
      await dealService.moveDealStage(deal.id, nextStage, override);
      notifyToast({
        title: 'Cập nhật giai đoạn thành công',
        description: `Deal "${deal.title}" đã chuyển sang giai đoạn ${nextStage.toUpperCase()}.`,
        type: 'success',
      });
      fetchDealsAndForecast();
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      // If error is exit conditions failure and not yet override, retry with override
      if (
        !override &&
        err.response?.status === 400 &&
        typeof detail === 'string' &&
        (detail.includes('Điều kiện') || detail.includes('điều kiện') || detail.includes('Exit'))
      ) {
        try {
          await dealService.moveDealStage(deal.id, nextStage, true);
          notifyToast({
            title: 'Cập nhật giai đoạn thành công (Ghi đè quản trị)',
            description: `Deal "${deal.title}" đã chuyển sang giai đoạn ${nextStage.toUpperCase()}.`,
            type: 'success',
          });
          fetchDealsAndForecast();
          return;
        } catch {
          setActiveDeal(deal);
          setTargetStage(nextStage);
          setIsOverrideStageModalOpen(true);
          return;
        }
      }
      notifyToast({
        title: 'Không thể chuyển giai đoạn',
        description: detail || 'Vi phạm điều kiện giai đoạn',
        type: 'error',
      });
    }
  };

  const handleConfirmOverride = async () => {
    if (!activeDeal || !targetStage) return;
    try {
      await dealService.moveDealStage(activeDeal.id, targetStage, true);
      notifyToast({
        title: 'Đã chuyển giai đoạn theo quyền Trưởng nhóm',
        description: `Deal "${activeDeal.title}" đã được ghi nhận quyền vượt rào (Override).`,
        type: 'warning',
      });
      setIsOverrideStageModalOpen(false);
      setActiveDeal(null);
      fetchDealsAndForecast();
    } catch (err: any) {
      notifyToast({
        title: 'Thất bại',
        description: err.response?.data?.detail || 'Không có quyền vượt qua điều kiện',
        type: 'error',
      });
    }
  };

  // Close Deal
  const handleOpenCloseDeal = (deal: IDeal, type: 'won' | 'lost') => {
    setActiveDeal(deal);
    setCloseForm({
      stage: type,
      actualValue: deal.value || 0,
      signingDate: new Date().toISOString().split('T')[0],
      lossReason: '',
      lossCompetitor: '',
    });
    setIsCloseModalOpen(true);
  };

  const handleCloseDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDeal) return;
    try {
      await dealService.closeDeal(activeDeal.id, closeForm);
      notifyToast({
        title: closeForm.stage === 'won' ? '🎉 Chúc mừng! Đã chốt Deal thành công' : 'Đã đóng Deal dạng Thất bại',
        description: `Deal "${activeDeal.title}" đã chuyển trạng thái sang ${closeForm.stage.toUpperCase()}.`,
        type: closeForm.stage === 'won' ? 'success' : 'info',
      });
      setIsCloseModalOpen(false);
      setActiveDeal(null);
      fetchDealsAndForecast();
    } catch (err: any) {
      notifyToast({
        title: 'Lỗi đóng Deal',
        description: err.response?.data?.detail || 'Dữ liệu không hợp lệ',
        type: 'error',
      });
    }
  };



  // Scan stalled deals
  const handleScanStalled = async () => {
    try {
      const res = await dealService.scanStalledDeals();
      notifyToast({
        title: 'Quét Deal ứ đọng hoàn tất',
        description: `Đã quét ${res.scannedCount} cơ hội. Phát hiện ${res.newlyStalled} Deal bị ứ đọng không có hoạt động.`,
        type: 'success',
      });
      fetchDealsAndForecast();
    } catch (err: any) {
      notifyToast({
        title: 'Lỗi quét',
        description: err?.response?.data?.detail || 'Không thể thực hiện quét Deal ứ đọng',
        type: 'error',
      });
    }
  };

  // Bulk reassign
  const handleBulkReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDeals.length === 0 || !reassignForm.newOwnerId) return;
    try {
      const res = await dealService.bulkReassign({
        dealIds: selectedDeals,
        newOwnerId: reassignForm.newOwnerId,
        reason: reassignForm.reason,
      });
      notifyToast({
        title: 'Tái phân bổ thành công',
        description: `Đã bàn giao ${res.reassignedCount} cơ hội với lý do lưu vết kiểm toán.`,
        type: 'success',
      });
      setIsReassignModalOpen(false);
      setSelectedDeals([]);
      setReassignForm({ newOwnerId: '', reason: '' });
      fetchDealsAndForecast();
    } catch (err: any) {
      notifyToast({
        title: 'Lỗi tái phân bổ',
        description: err.response?.data?.detail || 'Không thể tái phân bổ',
        type: 'error',
      });
    }
  };

  // Product deal items management
  const handleOpenItems = (deal: IDeal) => {
    setActiveDeal(deal);
    setIsItemsModalOpen(true);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDeal) return;
    try {
      await dealService.addDealItem(activeDeal.id, newItemForm);
      notifyToast({
        title: 'Đã thêm sản phẩm',
        description: 'Tổng giá trị Deal đã được tính toán lại chính xác từ hệ thống.',
        type: 'success',
      });
      const updated = await dealService.getDeal(activeDeal.id);
      setActiveDeal(updated);
      fetchDealsAndForecast();
      setNewItemForm({
        productId: '',
        productName: '',
        quantity: 1,
        unitPrice: 10000000,
        discountPercent: 0,
        billingCycle: 'annual',
      });
    } catch (err: any) {
      notifyToast({
        title: 'Lỗi thêm sản phẩm',
        description: err.response?.data?.detail || 'Không thể thêm sản phẩm vào Deal',
        type: 'error',
      });
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!activeDeal) return;
    try {
      await dealService.removeDealItem(activeDeal.id, itemId);
      notifyToast({
        title: 'Đã gỡ sản phẩm',
        description: 'Tổng tiền Deal đã được cập nhật.',
        type: 'info',
      });
      const updated = await dealService.getDeal(activeDeal.id);
      setActiveDeal(updated);
      fetchDealsAndForecast();
    } catch (err: any) {
      notifyToast({
        title: 'Lỗi',
        description: 'Không thể xóa mục sản phẩm',
        type: 'error',
      });
    }
  };

  // Quick Filter handlers (S6-02)
  const handleSelectQuickStage = (stageId: string) => {
    setStageFilter((prev) => (prev === stageId ? '' : stageId));
  };

  const handleSelectQuickValue = (preset: 'all' | 'under50' | '50to200' | '200to500' | 'above500') => {
    setQuickValuePreset(preset);
    if (preset === 'all') {
      setMinValueFilter('');
      setMaxValueFilter('');
    } else if (preset === 'under50') {
      setMinValueFilter('');
      setMaxValueFilter('50000000');
    } else if (preset === '50to200') {
      setMinValueFilter('50000000');
      setMaxValueFilter('200000000');
    } else if (preset === '200to500') {
      setMinValueFilter('200000000');
      setMaxValueFilter('500000000');
    } else if (preset === 'above500') {
      setMinValueFilter('500000000');
      setMaxValueFilter('');
    }
  };

  const handleSelectQuickDate = (preset: 'all' | 'today' | 'this_month' | 'this_quarter' | 'overdue') => {
    setQuickDatePreset(preset);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (preset === 'all') {
      setCloseDateFromFilter('');
      setCloseDateToFilter('');
    } else if (preset === 'today') {
      setCloseDateFromFilter(todayStr);
      setCloseDateToFilter(todayStr);
    } else if (preset === 'this_month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      setCloseDateFromFilter(startOfMonth);
      setCloseDateToFilter(endOfMonth);
    } else if (preset === 'this_quarter') {
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      const startOfQ = new Date(now.getFullYear(), qMonth, 1).toISOString().split('T')[0];
      const endOfQ = new Date(now.getFullYear(), qMonth + 3, 0).toISOString().split('T')[0];
      setCloseDateFromFilter(startOfQ);
      setCloseDateToFilter(endOfQ);
    } else if (preset === 'overdue') {
      setCloseDateFromFilter('');
      setCloseDateToFilter(todayStr);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStalledOnly(false);
    setStageFilter('');
    setMinValueFilter('');
    setMaxValueFilter('');
    setCloseDateFromFilter('');
    setCloseDateToFilter('');
    setOwnerFilter('');
    setProductFilter('');
    setQuickValuePreset('all');
    setQuickDatePreset('all');
  };

  // S6-04: Excel Export (All records or selected records)
  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      if (selectedDeals.length > 0) {
        await dealService.exportDeals({
          deal_ids: selectedDeals.join(','),
        });
        notifyToast({
          title: 'Xuất Excel thành công',
          description: `Đã xuất ${selectedDeals.length} cơ hội bán hàng đã chọn ra file Excel.`,
          type: 'success',
        });
      } else {
        await dealService.exportDeals({
          search: searchQuery.trim() || undefined,
          stage: stageFilter || undefined,
          min_value: minValueFilter ? Number(minValueFilter) : undefined,
          max_value: maxValueFilter ? Number(maxValueFilter) : undefined,
          close_date_from: closeDateFromFilter || undefined,
          close_date_to: closeDateToFilter || undefined,
          owner_id: ownerFilter || undefined,
          product_id: productFilter || undefined,
          stalled_only: stalledOnly || undefined,
        });
        notifyToast({
          title: 'Xuất Excel thành công',
          description: `Đã xuất toàn bộ ${deals.length} cơ hội bán hàng theo bộ lọc ra file Excel.`,
          type: 'success',
        });
      }
    } catch (err: any) {
      notifyToast({
        title: 'Lỗi xuất Excel',
        description: err?.message || 'Không thể tạo file báo cáo Excel.',
        type: 'error',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // S6-10: Reactive Visualizations Metrics by Stage, Deal Value & Closing Date
  const totalDealsCount = deals.length;
  const totalPipelineSum = useMemo(() => deals.reduce((sum, d) => sum + (d.value || 0), 0), [deals]);

  const stageStats = useMemo(() => {
    return STAGES.map((st) => {
      const list = deals.filter((d) => normalizeStage(d.stage) === st.id);
      const count = list.length;
      const value = list.reduce((acc, d) => acc + (d.value || 0), 0);
      const countPct = totalDealsCount > 0 ? Math.round((count / totalDealsCount) * 100) : 0;
      const valuePct = totalPipelineSum > 0 ? Math.round((value / totalPipelineSum) * 100) : 0;
      const avgValue = count > 0 ? Math.round(value / count) : 0;
      return {
        ...st,
        count,
        value,
        countPct,
        valuePct,
        avgValue,
      };
    });
  }, [deals, totalDealsCount, totalPipelineSum]);

  const closingDateStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const endOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);

    let overdueCount = 0;
    let overdueVal = 0;
    let thisMonthCount = 0;
    let thisMonthVal = 0;
    let nextMonthCount = 0;
    let nextMonthVal = 0;
    let laterCount = 0;
    let laterVal = 0;
    let noDateCount = 0;
    let noDateVal = 0;

    deals.forEach((d) => {
      const val = d.value || 0;
      if (!d.expectedCloseDate) {
        noDateCount++;
        noDateVal += val;
        return;
      }
      const dDate = new Date(d.expectedCloseDate);
      dDate.setHours(0, 0, 0, 0);
      if (dDate < today) {
        overdueCount++;
        overdueVal += val;
      } else if (dDate <= endOfMonth) {
        thisMonthCount++;
        thisMonthVal += val;
      } else if (dDate <= endOfNextMonth) {
        nextMonthCount++;
        nextMonthVal += val;
      } else {
        laterCount++;
        laterVal += val;
      }
    });

    return [
      { label: '⚠️ Quá hạn chốt', count: overdueCount, value: overdueVal, color: '#ef4444' },
      { label: '📅 Trong tháng này', count: thisMonthCount, value: thisMonthVal, color: '#3b82f6' },
      { label: '📆 Tháng kế tiếp', count: nextMonthCount, value: nextMonthVal, color: '#8b5cf6' },
      { label: '🚀 Các tháng sau', count: laterCount, value: laterVal, color: '#10b981' },
      { label: '⏳ Chưa gán hạn', count: noDateCount, value: noDateVal, color: '#94a3b8' },
    ];
  }, [deals]);

  return (
    <div className={styles.dealPage}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.header__left}>
          <div className={styles.header__badgeRow}>
            <Badge tone="primary" dot>
              BẢNG KANBAN TƯƠNG TÁC · KÉO THẢ TRỰC TIẾP
            </Badge>
          </div>
          <h1 className={styles.header__title}>Quản lý Cơ hội Bán hàng</h1>
          <p className={styles.header__subtitle}>
            Kéo thả thẻ cơ hội giữa các cột hoặc dùng nút điều hướng để cập nhật tiến độ và dự báo doanh số.
          </p>
        </div>

        <div className={styles.header__actions}>
          {/* S6-04: Export to Excel */}
          <Button
            variant="secondary"
            onClick={handleExportExcel}
            disabled={isExporting}
            title="Xuất dữ liệu phễu bán hàng ra file Excel"
          >
            <FileSpreadsheet size={16} />
            {isExporting ? 'Đang xuất...' : selectedDeals.length > 0 ? `Xuất Excel (${selectedDeals.length})` : 'Xuất Excel'}
          </Button>
          <Button variant="secondary" onClick={handleScanStalled}>
            <Clock size={16} /> Quét Deal Ứ đọng
          </Button>
          {selectedDeals.length > 0 && (
            <Button variant="secondary" onClick={() => setIsReassignModalOpen(true)}>
              <UserCheck size={16} /> Bàn giao {selectedDeals.length} Deal
            </Button>
          )}
          <Button variant="primary" onClick={() => navigate('/deals/create')}>
            <Plus size={16} /> Tạo Cơ hội mới
          </Button>
        </div>
      </header>

      {/* S6-03: Team Leader Pipeline Info */}
      {isLeader && (
        <div className={styles.teamLeaderBanner}>
          <div className={styles.teamLeaderBanner__badge}>
            <Users size={16} /> Chế độ Trưởng nhóm (Team Leader View)
          </div>
          <span>
            Bạn có quyền xem và giám sát toàn bộ phễu bán hàng, cơ hội và tiến độ của tất cả thành viên trong nhóm kinh doanh.
          </span>
        </div>
      )}

      {/* Sales Forecast Banner */}
      {forecast && (
        <div className={styles.forecastBanner}>
          <div className={styles.forecastBanner__main}>
            <span className={styles.forecastBanner__label}>Dự báo Doanh số theo trọng số</span>
            <span className={styles.forecastBanner__value}>
              {formatCurrency(forecast.totalWeightedForecast)}
            </span>
            <span className={styles.forecastBanner__subtext}>
              Công thức: ∑ (Giá trị Deal × Xác suất thành công giai đoạn)
            </span>
          </div>

          <div className={styles.forecastStats}>
            <div className={styles.forecastStatItem}>
              <span className={styles.forecastStatItem__label}>Tổng quy mô Phễu (Unweighted)</span>
              <span className={styles.forecastStatItem__value}>
                {formatCompactCurrency(forecast.totalPipelineValue)}
              </span>
            </div>

            <div className={styles.forecastStatItem}>
              <span className={styles.forecastStatItem__label}>Cơ hội đang mở (Active)</span>
              <span className={styles.forecastStatItem__value}>{forecast.activeDealsCount}</span>
            </div>
          </div>
        </div>
      )}

      {/* S6-01 & S6-02: Pipeline Filters & Quick Filters Card */}
      <div className={styles.filtersCard}>
        <div className={styles.quickFiltersRow}>
          {/* Quick Stage */}
          <div className={styles.quickFilterGroup}>
            <span className={styles.quickFilterLabel}>Giai đoạn:</span>
            <button
              type="button"
              className={`${styles.chipBtn} ${stageFilter === '' ? styles['chipBtn--active'] : ''}`}
              onClick={() => setStageFilter('')}
            >
              Tất cả
            </button>
            {STAGES.map((st) => (
              <button
                key={st.id}
                type="button"
                className={`${styles.chipBtn} ${stageFilter === st.id ? styles['chipBtn--active'] : ''}`}
                onClick={() => handleSelectQuickStage(st.id)}
              >
                {st.name}
              </button>
            ))}
          </div>

          {/* Quick Value Range */}
          <div className={styles.quickFilterGroup}>
            <span className={styles.quickFilterLabel}>Giá trị:</span>
            <button
              type="button"
              className={`${styles.chipBtn} ${quickValuePreset === 'all' ? styles['chipBtn--active'] : ''}`}
              onClick={() => handleSelectQuickValue('all')}
            >
              Tất cả
            </button>
            <button
              type="button"
              className={`${styles.chipBtn} ${quickValuePreset === 'under50' ? styles['chipBtn--active'] : ''}`}
              onClick={() => handleSelectQuickValue('under50')}
            >
              &lt; 50M
            </button>
            <button
              type="button"
              className={`${styles.chipBtn} ${quickValuePreset === '50to200' ? styles['chipBtn--active'] : ''}`}
              onClick={() => handleSelectQuickValue('50to200')}
            >
              50M - 200M
            </button>
            <button
              type="button"
              className={`${styles.chipBtn} ${quickValuePreset === '200to500' ? styles['chipBtn--active'] : ''}`}
              onClick={() => handleSelectQuickValue('200to500')}
            >
              200M - 500M
            </button>
            <button
              type="button"
              className={`${styles.chipBtn} ${quickValuePreset === 'above500' ? styles['chipBtn--active'] : ''}`}
              onClick={() => handleSelectQuickValue('above500')}
            >
              &gt; 500M
            </button>
          </div>

          {/* Quick Closing Date */}
          <div className={styles.quickFilterGroup}>
            <span className={styles.quickFilterLabel}>Hạn chốt:</span>
            <button
              type="button"
              className={`${styles.chipBtn} ${quickDatePreset === 'all' ? styles['chipBtn--active'] : ''}`}
              onClick={() => handleSelectQuickDate('all')}
            >
              Tất cả
            </button>
            <button
              type="button"
              className={`${styles.chipBtn} ${quickDatePreset === 'today' ? styles['chipBtn--active'] : ''}`}
              onClick={() => handleSelectQuickDate('today')}
            >
              Hôm nay
            </button>
            <button
              type="button"
              className={`${styles.chipBtn} ${quickDatePreset === 'this_month' ? styles['chipBtn--active'] : ''}`}
              onClick={() => handleSelectQuickDate('this_month')}
            >
              Tháng này
            </button>
            <button
              type="button"
              className={`${styles.chipBtn} ${quickDatePreset === 'this_quarter' ? styles['chipBtn--active'] : ''}`}
              onClick={() => handleSelectQuickDate('this_quarter')}
            >
              Quý này
            </button>
            <button
              type="button"
              className={`${styles.chipBtn} ${quickDatePreset === 'overdue' ? styles['chipBtn--active'] : ''}`}
              onClick={() => handleSelectQuickDate('overdue')}
            >
              Quá hạn
            </button>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button
              type="button"
              className={styles.chipBtn}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Filter size={12} style={{ marginRight: 4 }} />
              {showAdvancedFilters ? 'Thu gọn' : 'Lọc chi tiết'}
            </button>
            {(stageFilter || minValueFilter || maxValueFilter || closeDateFromFilter || closeDateToFilter || ownerFilter || productFilter || stalledOnly || searchQuery) && (
              <button
                type="button"
                className={styles.chipBtn}
                style={{ color: '#ef4444', borderColor: '#fca5a5' }}
                onClick={handleResetFilters}
                title="Xóa tất cả bộ lọc"
              >
                <RotateCcw size={12} style={{ marginRight: 4 }} /> Xóa lọc
              </button>
            )}
          </div>
        </div>

        {/* Detailed Filters (S6-01: Filter by Stage, Deal Value, Closing Date, Deal Owner, Product) */}
        {showAdvancedFilters && (
          <div className={styles.detailedFiltersGrid}>
            <div className={styles.filterField}>
              <label className={styles.filterFieldLabel}>Giai đoạn phễu:</label>
              <select
                className={styles.filterFieldInput}
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
              >
                <option value="">-- Tất cả giai đoạn --</option>
                {STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.prob}%)
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterField}>
              <label className={styles.filterFieldLabel}>Giá trị từ (VNĐ):</label>
              <input
                type="text"
                placeholder="VD: 50,000,000"
                className={styles.filterFieldInput}
                value={minValueFilter ? formatNumberWithCommas(minValueFilter) : ''}
                onChange={(e) => {
                  const raw = parseNumberFromCommas(e.target.value);
                  setMinValueFilter(raw ? String(raw) : '');
                  setQuickValuePreset('all');
                }}
              />
            </div>

            <div className={styles.filterField}>
              <label className={styles.filterFieldLabel}>Giá trị đến (VNĐ):</label>
              <input
                type="text"
                placeholder="VD: 500,000,000"
                className={styles.filterFieldInput}
                value={maxValueFilter ? formatNumberWithCommas(maxValueFilter) : ''}
                onChange={(e) => {
                  const raw = parseNumberFromCommas(e.target.value);
                  setMaxValueFilter(raw ? String(raw) : '');
                  setQuickValuePreset('all');
                }}
              />
            </div>

            <div className={styles.filterField}>
              <label className={styles.filterFieldLabel}>Hạn chốt từ ngày:</label>
              <input
                type="date"
                className={styles.filterFieldInput}
                value={closeDateFromFilter}
                onChange={(e) => {
                  setCloseDateFromFilter(e.target.value);
                  setQuickDatePreset('all');
                }}
              />
            </div>

            <div className={styles.filterField}>
              <label className={styles.filterFieldLabel}>Hạn chốt đến ngày:</label>
              <input
                type="date"
                className={styles.filterFieldInput}
                value={closeDateToFilter}
                onChange={(e) => {
                  setCloseDateToFilter(e.target.value);
                  setQuickDatePreset('all');
                }}
              />
            </div>

            {/* S6-01 & S6-02: Deal Owner Filter (Team Leader can view members - S6-03) */}
            <div className={styles.filterField}>
              <label className={styles.filterFieldLabel}>Người phụ trách (Owner):</label>
              <SearchableSelect
                value={ownerFilter}
                onChange={setOwnerFilter}
                options={usersList.map((u) => ({
                  value: u.id,
                  label: u.name,
                  subLabel: u.roles?.join(', ') || 'Thành viên',
                }))}
                allowAll={true}
                allLabel={isLeader ? 'Toàn bộ Đội ngũ (Team Members)' : 'Tất cả người phụ trách'}
                allValue=""
                placeholder={isLeader ? 'Toàn bộ Đội ngũ (Team Members)' : 'Tất cả người phụ trách'}
                searchPlaceholder="Tìm kiếm người phụ trách..."
                pageSize={6}
                icon={<User size={14} style={{ color: '#64748b' }} />}
              />
            </div>

            {/* S6-02: Product Filter */}
            <div className={styles.filterField}>
              <label className={styles.filterFieldLabel}>Sản phẩm trong cơ hội:</label>
              <select
                className={styles.filterFieldInput}
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
              >
                <option value="">-- Tất cả sản phẩm --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className={styles.toolbarCard}>
        <div className={styles.toolbar__left}>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Tìm theo tên Deal, khách hàng, người phụ trách..."
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <input
              type="checkbox"
              checked={stalledOnly}
              onChange={(e) => setStalledOnly(e.target.checked)}
            />
            Chỉ hiện Deal ứ đọng (Stalled)
          </label>
        </div>

        <div className={styles.toolbar__right}>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewToggleBtn} ${viewMode === 'kanban' ? styles['viewToggleBtn--active'] : ''}`}
              onClick={() => setViewMode('kanban')}
            >
              <Kanban size={15} /> Bảng Kanban
            </button>
            <button
              className={`${styles.viewToggleBtn} ${viewMode === 'table' ? styles['viewToggleBtn--active'] : ''}`}
              onClick={() => setViewMode('table')}
            >
              <List size={15} /> Danh sách Bảng
            </button>
            <button
              className={`${styles.viewToggleBtn} ${viewMode === 'visualize' ? styles['viewToggleBtn--active'] : ''}`}
              onClick={() => setViewMode('visualize')}
            >
              <BarChart3 size={15} /> Biểu đồ Phễu
            </button>
          </div>

          {viewMode === 'kanban' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
              <span style={{ whiteSpace: 'nowrap' }}>Mỗi cột:</span>
              <select
                value={columnPageSize}
                onChange={(e) => {
                  setColumnPageSize(Number(e.target.value));
                  setColumnPages({ lead: 1, contacted: 1, proposal: 1, negotiation: 1, won: 1, lost: 1 });
                }}
                className={styles.colPageSizeSelect}
                title="Số Deal hiển thị trên mỗi cột Kanban"
              >
                <option value={3}>3 Deal</option>
                <option value={5}>5 Deal</option>
                <option value={10}>10 Deal</option>
                <option value={20}>20 Deal</option>
              </select>
            </div>
          )}

          <Button variant="ghost" onClick={fetchDealsAndForecast}>
            <RefreshCw size={15} />
          </Button>
        </div>
      </div>

      {/* Main Content: S6-10 Visualizations vs Kanban Board vs Full-Width Table */}
      {viewMode === 'visualize' ? (
        <div className={styles.visualDashboard}>
          {/* Chart 1: By Stage */}
          <div className={styles.chartCard}>
            <div className={styles.chartCardHeader}>
              <span className={styles.chartCardTitle}>
                <Kanban size={16} /> Phân bổ Cơ hội theo Giai đoạn
              </span>
              <span className={styles.chartCardSub}>Tổng: {totalDealsCount} cơ hội</span>
            </div>
            <div className={styles.barList}>
              {stageStats.map((st) => (
                <div key={st.id} className={styles.barRow}>
                  <div className={styles.barMeta}>
                    <span className={styles.barStageName}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: st.color }} />
                      {st.name} ({st.prob}%)
                    </span>
                    <span className={styles.barStageValue}>
                      {st.count} Deal ({st.countPct}%)
                    </span>
                  </div>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      style={{
                        width: `${Math.max(st.countPct, st.count > 0 ? 4 : 0)}%`,
                        backgroundColor: st.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chart 2: By Deal Value */}
          <div className={styles.chartCard}>
            <div className={styles.chartCardHeader}>
              <span className={styles.chartCardTitle}>
                <TrendingUp size={16} /> Quy mô Giá trị theo Giai đoạn
              </span>
              <span className={styles.chartCardSub}>
                Tổng: {formatCompactCurrency(totalPipelineSum)}
              </span>
            </div>
            <div className={styles.barList}>
              {stageStats.map((st) => (
                <div key={st.id} className={styles.barRow}>
                  <div className={styles.barMeta}>
                    <span className={styles.barStageName}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: st.color }} />
                      {st.name}
                    </span>
                    <span className={styles.barStageValue}>
                      {formatCurrency(st.value)} ({st.valuePct}%)
                    </span>
                  </div>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      style={{
                        width: `${Math.max(st.valuePct, st.value > 0 ? 4 : 0)}%`,
                        backgroundColor: st.color,
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)', alignSelf: 'flex-end' }}>
                    TB: {formatCompactCurrency(st.avgValue)} / deal
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Chart 3: By Closing Date */}
          <div className={styles.chartCard}>
            <div className={styles.chartCardHeader}>
              <span className={styles.chartCardTitle}>
                <Calendar size={16} /> Phân bổ Ngày dự kiến Chốt
              </span>
              <span className={styles.chartCardSub}>Dòng tiền theo thời gian</span>
            </div>
            <div className={styles.timelineGrid}>
              {closingDateStats.map((item, idx) => (
                <div key={idx} className={styles.timelineCard}>
                  <span className={styles.timelineCardTitle}>{item.label}</span>
                  <span className={styles.timelineCardCount}>{item.count}</span>
                  <span className={styles.timelineCardValue}>{formatCompactCurrency(item.value)}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 'auto', padding: '10px', background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              💡 <em>Các chỉ số và biểu đồ tự động cập nhật ngay lập tức khi thay đổi bất kỳ bộ lọc nào ở trên.</em>
            </div>
          </div>
        </div>
      ) : viewMode === 'kanban' ? (
        <div className={styles.kanbanBoard}>
          {STAGES.map((stage) => {
            const stageDeals = (deals || []).filter((d) => normalizeStage(d.stage) === stage.id);
            const stageTotal = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);
            const colSearch = (columnSearches[stage.id] || '').trim().toLowerCase();

            const filteredStageDeals = stageDeals.filter((d) => {
              if (!colSearch) return true;
              const matchTitle = (d.title || '').toLowerCase().includes(colSearch);
              const matchCustomer = (d.customerName || '').toLowerCase().includes(colSearch);
              const matchOwner = (d.ownerName || '').toLowerCase().includes(colSearch);
              const matchCampaign = (d.campaignName || '').toLowerCase().includes(colSearch);
              const matchValue = (d.value || 0).toString().includes(colSearch);
              return matchTitle || matchCustomer || matchOwner || matchCampaign || matchValue;
            });

            const colPage = columnPages[stage.id] || 1;
            const totalColPages = Math.max(1, Math.ceil(filteredStageDeals.length / columnPageSize));
            const safeColPage = Math.min(colPage, totalColPages);
            const paginatedStageDeals = filteredStageDeals.slice(
              (safeColPage - 1) * columnPageSize,
              safeColPage * columnPageSize
            );

            return (
              <div
                key={stage.id}
                className={`${styles.kanbanColumn} ${
                  activeDropStage === stage.id ? styles['kanbanColumn--dropActive'] : ''
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (activeDropStage !== stage.id) {
                    setActiveDropStage(stage.id);
                  }
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setActiveDropStage(stage.id);
                }}
                onDragLeave={(e) => {
                  if (e.currentTarget === e.target) {
                    setActiveDropStage(null);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const dealId = e.dataTransfer.getData('text/plain') || draggedDealId;
                  setActiveDropStage(null);
                  setDraggedDealId(null);
                  if (dealId) {
                    const droppedDeal = deals.find((d) => d.id === dealId);
                    if (droppedDeal && normalizeStage(droppedDeal.stage) !== stage.id) {
                      if (stage.id === 'won') {
                        handleOpenCloseDeal(droppedDeal, 'won');
                      } else if (stage.id === 'lost') {
                        handleOpenCloseDeal(droppedDeal, 'lost');
                      } else {
                        handleMoveStage(droppedDeal, stage.id);
                      }
                    }
                  }
                }}
              >
                <div className={styles.kanbanColumn__header}>
                  <div className={styles.kanbanColumn__title}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: stage.color }} />
                    {stage.name}
                  </div>
                  <Badge tone="neutral">
                    {colSearch ? `${filteredStageDeals.length}/${stageDeals.length}` : stageDeals.length}
                  </Badge>
                </div>

                <div className={styles.kanbanColumn__summary}>
                  <span>Xác suất: {stage.prob}%</span>
                  <strong>{formatCompactCurrency(stageTotal)}</strong>
                </div>

                {/* S7: In-column Search */}
                <div className={styles.kanbanColumnSearch}>
                  <Search size={13} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                  <input
                    type="text"
                    value={columnSearches[stage.id] || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setColumnSearches((prev) => ({ ...prev, [stage.id]: val }));
                      setColumnPages((prev) => ({ ...prev, [stage.id]: 1 }));
                    }}
                    placeholder={`Tìm trong ${stage.name}...`}
                    className={styles.kanbanColumnSearchInput}
                  />
                  {columnSearches[stage.id] && (
                    <button
                      type="button"
                      className={styles.kanbanColumnSearchClear}
                      onClick={() => {
                        setColumnSearches((prev) => ({ ...prev, [stage.id]: '' }));
                        setColumnPages((prev) => ({ ...prev, [stage.id]: 1 }));
                      }}
                      title="Xóa tìm kiếm"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className={styles.kanbanColumn__body}>
                  {paginatedStageDeals.length === 0 && colSearch ? (
                    <div style={{ textAlign: 'center', padding: '24px 10px', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                      Không có deal nào khớp &quot;{colSearch}&quot;
                    </div>
                  ) : null}
                  {paginatedStageDeals.map((deal) => (
                    <div
                      key={deal.id}
                      draggable={true}
                      onDragStart={(e) => {
                        setDraggedDealId(deal.id);
                        e.dataTransfer.setData('text/plain', deal.id);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragEnd={() => {
                        setDraggedDealId(null);
                        setActiveDropStage(null);
                      }}
                      className={`${styles.dealCard} ${
                        deal.isStalled ? styles['dealCard--stalled'] : ''
                      } ${draggedDealId === deal.id ? styles['dealCard--dragging'] : ''}`}
                    >
                      <div className={styles.dealCard__top}>
                        <span className={styles.dealCard__title}>{deal.title}</span>
                        {deal.isStalled && (
                          <span title="Deal ứ đọng không có hoạt động trong 14 ngày hoặc quá hạn chốt">
                            <AlertCircle size={15} color="#ef4444" />
                          </span>
                        )}
                      </div>

                      <span className={styles.dealCard__customer}>
                        🏢 {deal.customerName || 'Doanh nghiệp'}
                      </span>

                      {deal.campaignName && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>
                          📌 {deal.campaignName}
                        </span>
                      )}

                      <div className={styles.dealCard__valueRow}>
                        <span className={styles.dealCard__value}>{formatCurrency(deal.value)}</span>
                        <span className={styles.dealCard__prob}>XS: {deal.probability ?? stage.prob}%</span>
                      </div>

                      <div className={styles.dealCard__meta}>
                        <span className={styles.dealCard__owner} title={deal.ownerName || 'Chưa gán'}>
                          👤 {deal.ownerName || 'Chưa gán'}
                        </span>
                        {deal.expectedCloseDate && (
                          <span className={styles.dealCard__date}>
                            📅 {new Date(deal.expectedCloseDate).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                      </div>

                      <div className={styles.dealCard__actions}>
                        <div className={styles.dealCard__actionGroup}>
                          <button
                            className={styles.cardActionBtn}
                            title="Quản lý Sản phẩm trong Deal"
                            onClick={() => handleOpenItems(deal)}
                          >
                            <Package size={13} /> {deal.items?.length || 0} SP
                          </button>

                          <button
                            className={styles.cardActionBtn}
                            title="Chỉnh sửa Deal"
                            onClick={() => navigate(`/deals/${deal.id}/edit`)}
                          >
                            <Edit2 size={13} /> Sửa
                          </button>

                          <button
                            className={styles.cardActionBtn}
                            title="Soạn thảo báo giá thương mại từ cơ hội này"
                            onClick={() => navigate(`/deals/${deal.id}/quote-builder`)}
                            style={{ color: '#2563EB', fontWeight: 600 }}
                          >
                            <FileText size={13} /> Báo giá
                          </button>
                        </div>

                        {/* Stage progress buttons */}
                        {stage.id !== 'won' && stage.id !== 'lost' && (
                          <div className={styles.dealCard__actionGroup}>
                            {stage.id === 'negotiation' ? (
                              <button
                                className={styles.cardActionBtn}
                                style={{ color: '#16a34a', borderColor: '#86efac' }}
                                title="Đóng cơ hội chốt thành công"
                                onClick={() => handleOpenCloseDeal(deal, 'won')}
                              >
                                Thành công
                              </button>
                            ) : (
                              <button
                                className={styles.cardActionBtn}
                                title="Chuyển bước kế tiếp (Kiểm tra Exit Conditions)"
                                onClick={() => {
                                  const currentIdx = STAGES.findIndex((s) => s.id === stage.id);
                                  if (currentIdx < STAGES.length - 2) {
                                    handleMoveStage(deal, STAGES[currentIdx + 1].id);
                                  }
                                }}
                              >
                                Tiếp <ChevronRight size={13} />
                              </button>
                            )}

                            <button
                              className={styles.cardActionBtn}
                              style={{ color: '#ef4444', borderColor: '#fca5a5' }}
                              title="Đóng cơ hội thất bại"
                              onClick={() => handleOpenCloseDeal(deal, 'lost')}
                            >
                              Thất bại
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* S7: Kanban Column Pagination with selectable page size & controls */}
                <div className={styles.columnPagination}>
                  <span className={styles.columnPaginationText}>
                    {filteredStageDeals.length === 0
                      ? '0 Deal'
                      : `${(safeColPage - 1) * columnPageSize + 1}-${Math.min(safeColPage * columnPageSize, filteredStageDeals.length)} / ${stageDeals.length}`}
                  </span>

                  <div className={styles.columnPaginationBtns}>
                    <select
                      value={columnPageSize}
                      onChange={(e) => {
                        const newSize = Number(e.target.value);
                        setColumnPageSize(newSize);
                        setColumnPages((prev) => ({ ...prev, [stage.id]: 1 }));
                      }}
                      className={styles.colPageSizeSelect}
                      title="Số Deal hiển thị trên mỗi cột"
                    >
                      <option value={3}>3</option>
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                    </select>

                    <button
                      type="button"
                      disabled={safeColPage <= 1}
                      onClick={() =>
                        setColumnPages((prev) => ({
                          ...prev,
                          [stage.id]: Math.max(1, (prev[stage.id] || 1) - 1),
                        }))
                      }
                      className={styles.colPageBtn}
                      title="Trang trước"
                    >
                      ◀
                    </button>

                    <span className={styles.colPageIndicator}>
                      {safeColPage}/{totalColPages}
                    </span>

                    <button
                      type="button"
                      disabled={safeColPage >= totalColPages}
                      onClick={() =>
                        setColumnPages((prev) => ({
                          ...prev,
                          [stage.id]: Math.min(totalColPages, (prev[stage.id] || 1) + 1),
                        }))
                      }
                      className={styles.colPageBtn}
                      title="Trang tiếp theo"
                    >
                      ▶
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Full-width Table View (Phase 6) */
        <div className={styles.tableCard}>
          <div className={styles.tableResponsive}>
            <table className={styles.dealTable}>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input
                      type="checkbox"
                      checked={selectedDeals.length === deals.length && deals.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDeals(deals.map((d) => d.id));
                        } else {
                          setSelectedDeals([]);
                        }
                      }}
                    />
                  </th>
                  <th>CƠ HỘI BÁN HÀNG</th>
                  <th>KHÁCH HÀNG</th>
                  <th>GIÁ TRỊ</th>
                  <th>GIAI ĐOẠN PHỄU</th>
                  <th>XÁC SUẤT</th>
                  <th>NGÀY KỲ VỌNG</th>
                  <th>PHỤ TRÁCH</th>
                  <th style={{ textAlign: 'right' }}>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '40px' }}>
                      <Loader2 className="animate-spin" size={28} style={{ margin: '0 auto', color: 'var(--color-primary)' }} />
                      <p style={{ marginTop: 8, color: 'var(--color-text-secondary)' }}>Đang tải danh sách cơ hội...</p>
                    </td>
                  </tr>
                ) : deals.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '48px' }}>
                      <TrendingUp size={36} style={{ color: 'var(--color-text-muted)', marginBottom: 8 }} />
                      <p style={{ fontWeight: 600 }}>Không tìm thấy cơ hội bán hàng nào</p>
                    </td>
                  </tr>
                ) : (
                  (deals || []).slice((tablePage - 1) * tableLimit, tablePage * tableLimit).map((deal) => (
                    <tr key={deal.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedDeals.includes(deal.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDeals([...selectedDeals, deal.id]);
                            } else {
                              setSelectedDeals(selectedDeals.filter((id) => id !== deal.id));
                            }
                          }}
                        />
                      </td>

                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{deal.title}</span>
                          {deal.isStalled && (
                            <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>
                              ⚠️ Ứ đọng không có hoạt động
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        <span>{deal.customerName || '—'}</span>
                      </td>

                      <td>
                        <strong style={{ color: 'var(--color-primary)' }}>{formatCurrency(deal.value)}</strong>
                      </td>

                      <td>
                        <Badge tone={deal.stage === 'won' ? 'success' : deal.stage === 'lost' ? 'danger' : 'primary'}>
                          {formatDealStage(deal.stage)}
                        </Badge>
                      </td>

                      <td>{deal.probability || 0}%</td>

                      <td>
                        {deal.expectedCloseDate
                          ? new Date(deal.expectedCloseDate).toLocaleDateString('vi-VN')
                          : '—'}
                      </td>

                      <td>{deal.ownerName || '—'}</td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                          <button
                            className={styles.cardActionBtn}
                            onClick={() => handleOpenItems(deal)}
                          >
                            <Package size={13} /> {deal.items?.length || 0} SP
                          </button>
                          <button
                            className={styles.cardActionBtn}
                            title="Chỉnh sửa Deal"
                            onClick={() => navigate(`/deals/${deal.id}/edit`)}
                          >
                            <Edit2 size={13} /> Sửa
                          </button>
                          <button
                            className={styles.cardActionBtn}
                            title="Soạn thảo báo giá thương mại từ cơ hội này"
                            onClick={() => navigate(`/deals/${deal.id}/quote-builder`)}
                            style={{ color: '#2563EB', fontWeight: 600 }}
                          >
                            <FileText size={13} /> Báo giá
                          </button>
                          {deal.stage !== 'won' && deal.stage !== 'lost' && (
                            <button
                              className={styles.cardActionBtn}
                              style={{ color: '#16a34a' }}
                              title="Chốt thành công"
                              onClick={() => handleOpenCloseDeal(deal, 'won')}
                            >
                              Thành công
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          <div className={styles.tablePagination}>
            <span>
              Hiển thị <strong>{Math.min(tableLimit, Math.max(0, deals.length - (tablePage - 1) * tableLimit))}</strong> / <strong>{deals.length}</strong> cơ hội (Trang {tablePage} / {Math.max(1, Math.ceil(deals.length / tableLimit))})
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <select
                value={tableLimit}
                onChange={(e) => {
                  setTableLimit(Number(e.target.value));
                  setTablePage(1);
                }}
                className={styles.pageSelect}
              >
                <option value={10}>10 / trang</option>
                <option value={20}>20 / trang</option>
                <option value={50}>50 / trang</option>
              </select>
              <Button
                variant="secondary"
                size="sm"
                disabled={tablePage <= 1}
                onClick={() => setTablePage((p) => Math.max(1, p - 1))}
              >
                Trước
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={tablePage >= Math.max(1, Math.ceil(deals.length / tableLimit))}
                onClick={() => setTablePage((p) => Math.min(Math.max(1, Math.ceil(deals.length / tableLimit)), p + 1))}
              >
                Sau
              </Button>
            </div>
          </div>
        </div>
      )}



      {/* S5-03: Products and Deal Items Drawer / Modal */}
      <Modal
        isOpen={isItemsModalOpen}
        onClose={() => setIsItemsModalOpen(false)}
        title={`Danh mục Sản phẩm & Báo giá: ${activeDeal?.title}`}
        maxWidth="lg"
      >
        <div>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 12 }}>
            Tổng giá trị Deal được tính toán tự động và có thẩm quyền tại máy chủ (Server-side authoritative totals).
          </p>

          {/* Current Items */}
          <div className={styles.itemList}>
            {activeDeal?.items?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', background: 'var(--color-bg-subtle)' }}>
                Chưa có sản phẩm nào trong Deal. Thêm bên dưới.
              </div>
            ) : (
              activeDeal?.items?.map((item) => (
                <div key={item.id} className={styles.itemRow}>
                  <div>
                    <strong style={{ display: 'block' }}>{item.productName}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      Số lượng: {item.quantity} · Đơn giá: {formatCurrency(item.unitPrice)} · Chiết khấu: {item.discountPercent}% · Kỳ: {item.billingCycle}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <strong style={{ color: 'var(--color-primary)' }}>{formatCurrency(item.subtotal)}</strong>
                    <button
                      className={styles.cardActionBtn}
                      style={{ color: '#ef4444' }}
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{ padding: '12px', background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <span>Tổng giá trị Deal xác thực:</span>
            <strong style={{ fontSize: '1.125rem', color: 'var(--color-primary)' }}>
              {formatCurrency(activeDeal?.value || 0)}
            </strong>
          </div>

          {/* Add Item Form */}
          <form onSubmit={handleAddItem} style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9375rem' }}>+ Thêm sản phẩm từ Danh mục:</h4>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Chọn sản phẩm</label>
                <select
                  className={styles.formSelect}
                  value={newItemForm.productId}
                  onChange={(e) => {
                    const prod = products.find((p) => p.id === e.target.value);
                    setNewItemForm({
                      ...newItemForm,
                      productId: e.target.value,
                      productName: prod ? prod.name : 'Gói bản quyền phần mềm',
                      unitPrice: prod ? prod.base_price : 10000000,
                    });
                  }}
                >
                  <option value="">-- Chọn sản phẩm có sẵn --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatCompactCurrency(p.base_price)})
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tên hiển thị</label>
                <input
                  className={styles.formInput}
                  required
                  value={newItemForm.productName}
                  onChange={(e) => setNewItemForm({ ...newItemForm, productName: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Số lượng</label>
                <input
                  type="number"
                  min={1}
                  className={styles.formInput}
                  value={newItemForm.quantity}
                  onChange={(e) => setNewItemForm({ ...newItemForm, quantity: Number(e.target.value) })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Đơn giá (VNĐ)</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={formatNumberWithCommas(newItemForm.unitPrice)}
                  onChange={(e) => setNewItemForm({ ...newItemForm, unitPrice: parseNumberFromCommas(e.target.value) })}
                  placeholder="VD: 10,000,000"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Chiết khấu (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className={styles.formInput}
                  value={newItemForm.discountPercent}
                  onChange={(e) => setNewItemForm({ ...newItemForm, discountPercent: Number(e.target.value) })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Chu kỳ thanh toán</label>
                <select
                  className={styles.formSelect}
                  value={newItemForm.billingCycle}
                  onChange={(e) => setNewItemForm({ ...newItemForm, billingCycle: e.target.value })}
                >
                  <option value="annual">Hàng năm (Annual)</option>
                  <option value="monthly">Hàng tháng (Monthly)</option>
                  <option value="quarterly">Hàng quý (Quarterly)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <Button variant="primary" type="submit" disabled={!newItemForm.productName}>
                Thêm vào Deal
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* S5-05: Close Deal Won / Lost Modal */}
      <Modal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        title={closeForm.stage === 'won' ? '🎉 Chốt Deal Thành Công (Close Won)' : '⚠️ Đóng Deal Thất Bại (Close Lost)'}
        maxWidth={closeForm.stage === 'lost' ? 'lg' : 'md'}
      >
        <form onSubmit={handleCloseDeal} className={closeForm.stage === 'lost' ? styles.lostModalForm : ''}>
          {closeForm.stage === 'won' ? (
            <div className={styles.formGrid}>
              <div className={styles['formGroup--full']}>
                <label className={styles.formLabel}>Doanh thu ký hợp đồng thực tế (VNĐ) *</label>
                <input
                  type="text"
                  className={styles.formInput}
                  required
                  value={formatNumberWithCommas(closeForm.actualValue)}
                  onChange={(e) => setCloseForm({ ...closeForm, actualValue: parseNumberFromCommas(e.target.value) })}
                  placeholder="VD: 50,000,000"
                />
              </div>

              <div className={styles['formGroup--full']}>
                <label className={styles.formLabel}>Ngày ký hợp đồng *</label>
                <input
                  type="date"
                  className={styles.formInput}
                  required
                  value={closeForm.signingDate}
                  onChange={(e) => setCloseForm({ ...closeForm, signingDate: e.target.value })}
                />
              </div>
            </div>
          ) : (
            <div className={styles.lostFormContainer}>
              <div className={styles.lostHeaderAlert}>
                <AlertCircle size={22} color="#ef4444" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#991b1b' }}>
                    Ghi nhận lý do đóng cơ hội thất bại
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#b91c1c' }}>
                    Phân tích nguyên nhân mất cơ hội để cải thiện chiến lược phễu bán hàng và theo dõi đối thủ cạnh tranh.
                  </div>
                </div>
              </div>

              <div className={styles.lostQuickReasons}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                  Gợi ý nhanh lý do:
                </span>
                {[
                  'Giá quá cao so với ngân sách',
                  'Khách chọn đối thủ cạnh tranh',
                  'Khách hoãn / hủy bỏ dự án',
                  'Thiếu tính năng đáp ứng yêu cầu',
                  'Chưa kịp tiến độ triển khai',
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    className={styles.lostReasonChip}
                    onClick={() =>
                      setCloseForm((prev) => ({
                        ...prev,
                        lossReason: prev.lossReason ? `${prev.lossReason}, ${reason}` : reason,
                      }))
                    }
                  >
                    + {reason}
                  </button>
                ))}
              </div>

              <div className={styles['formGroup--full']} style={{ marginTop: 8 }}>
                <label className={styles.lostFormLabel}>
                  Chi tiết lý do thất bại (Loss Reason) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  className={styles.lostFormTextarea}
                  rows={5}
                  required
                  placeholder="Nhập chi tiết phân tích lý do không chốt được hợp đồng..."
                  value={closeForm.lossReason}
                  onChange={(e) => setCloseForm({ ...closeForm, lossReason: e.target.value })}
                />
              </div>

              <div className={styles['formGroup--full']} style={{ marginTop: 8 }}>
                <label className={styles.lostFormLabel}>
                  Đối thủ cạnh tranh thắng thầu (nếu có)
                </label>
                <input
                  className={styles.lostFormInput}
                  placeholder="VD: Salesforce, HubSpot, MISA AMIS, Zoho CRM..."
                  value={closeForm.lossCompetitor}
                  onChange={(e) => setCloseForm({ ...closeForm, lossCompetitor: e.target.value })}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <Button variant="secondary" type="button" onClick={() => setIsCloseModalOpen(false)}>
              Hủy
            </Button>
            <Button
              variant={closeForm.stage === 'won' ? 'primary' : 'danger'}
              type="submit"
            >
              {closeForm.stage === 'won' ? 'Xác nhận Chốt Won' : 'Xác nhận Đóng Lost'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Stage Exit Conditions Override Modal */}
      <Modal
        isOpen={isOverrideStageModalOpen}
        onClose={() => setIsOverrideStageModalOpen(false)}
        title="Yêu cầu Điều kiện Chuyển Giai đoạn"
        maxWidth="md"
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#d97706', marginBottom: 12 }}>
            <ShieldAlert size={28} />
            <strong>Không thỏa mãn điều kiện chuyển giai đoạn mặc định!</strong>
          </div>

          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 16 }}>
            Quy tắc phễu yêu cầu: Cơ hội phải có giá trị lớn hơn 0, có đầy đủ người liên hệ hợp lệ và hạn chốt trước khi tiến sang bước tiếp theo.
          </p>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Ghi chú phê duyệt của Trưởng nhóm (Team Leader Override):</label>
            <textarea
              className={styles.formTextarea}
              rows={2}
              placeholder="Ghi rõ lý do đặc cách chuyển giai đoạn để lưu lịch sử kiểm toán..."
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <Button variant="secondary" onClick={() => setIsOverrideStageModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleConfirmOverride}>
              Đặc cách Chuyển Giai đoạn (Override)
            </Button>
          </div>
        </div>
      </Modal>

      {/* Deal Reassignment Modal */}
      <Modal
        isOpen={isReassignModalOpen}
        onClose={() => setIsReassignModalOpen(false)}
        title={`Tái phân bổ ${selectedDeals.length} Cơ hội Bán hàng`}
        maxWidth="sm"
      >
        <form onSubmit={handleBulkReassign}>
          <div className={styles.formGroup} style={{ marginBottom: 14 }}>
            <label className={styles.formLabel}>ID / Email Nhân viên tiếp nhận mới *</label>
            <input
              className={styles.formInput}
              required
              placeholder="VD: usr-sales-002 hoặc email..."
              value={reassignForm.newOwnerId}
              onChange={(e) => setReassignForm({ ...reassignForm, newOwnerId: e.target.value })}
            />
          </div>

          <div className={styles.formGroup} style={{ marginBottom: 16 }}>
            <label className={styles.formLabel}>Lý do bàn giao (Bắt buộc theo Audit) *</label>
            <textarea
              className={styles.formTextarea}
              rows={3}
              required
              placeholder="VD: Thay đổi địa bàn kinh doanh Q4, nhân sự nghỉ phép..."
              value={reassignForm.reason}
              onChange={(e) => setReassignForm({ ...reassignForm, reason: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button variant="secondary" type="button" onClick={() => setIsReassignModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" disabled={!reassignForm.newOwnerId || !reassignForm.reason}>
              Bàn giao ngay
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
