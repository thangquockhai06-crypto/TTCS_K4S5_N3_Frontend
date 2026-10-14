import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertCircle,
  ChevronRight,
  Clock,
  Kanban,
  List,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  ShieldAlert,
  Trash2,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import {
  IDeal,
  ISalesForecast,
  ICampaign,
  ICreateDealItemPayload,
} from '../interfaces';
import { dealService } from '../services/dealService';
import { campaignService } from '../services/campaignService';
import { sprint2Service } from '../services/sprint2Service';
import { formatCurrency, formatCompactCurrency } from '../utils/formatters';
import { showGlobalToast, ToastType } from '../context/ToastContext';
import { Badge, Button, Modal, SearchBar } from '../components/common';
import styles from './DealManagementPage.module.css';

const notifyToast = (opts: { title?: string; description?: string; type?: ToastType }) => {
  showGlobalToast(`${opts.title ? opts.title + ': ' : ''}${opts.description || ''}`, opts.type || 'info');
};

const STAGES = [
  { id: 'lead', name: 'Tiềm năng', prob: 20, color: '#64748b' },
  { id: 'contacted', name: 'Đã tiếp xúc', prob: 40, color: '#3b82f6' },
  { id: 'proposal', name: 'Đề xuất giải pháp', prob: 60, color: '#8b5cf6' },
  { id: 'negotiation', name: 'Đàm phán hợp đồng', prob: 80, color: '#f59e0b' },
  { id: 'won', name: 'Chốt thành công (Won)', prob: 100, color: '#16a34a' },
  { id: 'lost', name: 'Thất bại (Lost)', prob: 0, color: '#ef4444' },
];

export const normalizeStage = (st?: string): string => {
  const s = (st || '').toLowerCase().trim();
  if (s === 'contact') return 'contacted';
  return s || 'lead';
};

export const DealManagementPage: React.FC = () => {
  // Main state
  const [deals, setDeals] = useState<IDeal[]>([]);
  const [forecast, setForecast] = useState<ISalesForecast | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [stalledOnly, setStalledOnly] = useState<boolean>(false);
  const [selectedDeals, setSelectedDeals] = useState<string[]>([]);

  // Drag and drop state
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
  const [activeDropStage, setActiveDropStage] = useState<string | null>(null);

  // Catalogs
  const [campaigns, setCampaigns] = useState<ICampaign[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState<boolean>(false);
  const [isItemsModalOpen, setIsItemsModalOpen] = useState<boolean>(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState<boolean>(false);
  const [isOverrideStageModalOpen, setIsOverrideStageModalOpen] = useState<boolean>(false);

  // Active records for action
  const [activeDeal, setActiveDeal] = useState<IDeal | null>(null);
  const [targetStage, setTargetStage] = useState<string>('');
  const [overrideReason, setOverrideReason] = useState<string>('');

  // Forms
  const [createForm, setCreateForm] = useState({
    title: '',
    customerId: '',
    value: 50000000,
    stage: 'lead',
    probability: 20,
    expectedCloseDate: '',
    campaignId: '',
  });

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
    campaignService.getCampaigns().then(setCampaigns).catch(() => {});
    sprint2Service.getProducts().then(setProducts).catch(() => {});
  }, []);

  // Fetch Deals & Forecast
  const fetchDealsAndForecast = useCallback(async () => {
    setIsLoading(true);
    try {
      const [dealsRes, forecastRes] = await Promise.all([
        dealService.getDeals({
          search: searchQuery.trim() || undefined,
          stalled_only: stalledOnly || undefined,
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
  }, [searchQuery, stalledOnly]);

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

  // Create Deal
  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dealService.createDeal({
        ...createForm,
        customerId: createForm.customerId || 'cust-001',
      });
      notifyToast({
        title: 'Tạo Deal thành công',
        description: `Cơ hội "${createForm.title}" đã được thêm vào hệ thống.`,
        type: 'success',
      });
      setIsCreateModalOpen(false);
      setCreateForm({
        title: '',
        customerId: '',
        value: 50000000,
        stage: 'lead',
        probability: 20,
        expectedCloseDate: '',
        campaignId: '',
      });
      fetchDealsAndForecast();
    } catch (err: any) {
      notifyToast({
        title: 'Không thể tạo Deal',
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
          <h1 className={styles.header__title}>Cơ hội Bán hàng (Deal Management)</h1>
          <p className={styles.header__subtitle}>
            Kéo thả thẻ cơ hội giữa các cột hoặc dùng nút điều hướng để cập nhật tiến độ và dự báo doanh số.
          </p>
        </div>

        <div className={styles.header__actions}>
          <Button variant="secondary" onClick={handleScanStalled}>
            <Clock size={16} /> Quét Deal Ứ đọng
          </Button>
          {selectedDeals.length > 0 && (
            <Button variant="secondary" onClick={() => setIsReassignModalOpen(true)}>
              <UserCheck size={16} /> Bàn giao {selectedDeals.length} Deal
            </Button>
          )}
          <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={16} /> Tạo Cơ hội mới
          </Button>
        </div>
      </header>

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
          </div>

          <Button variant="ghost" onClick={fetchDealsAndForecast}>
            <RefreshCw size={15} />
          </Button>
        </div>
      </div>

      {/* Main Content: Kanban Board vs Full-Width Table */}
      {viewMode === 'kanban' ? (
        <div className={styles.kanbanBoard}>
          {STAGES.map((stage) => {
            const stageDeals = (deals || []).filter((d) => normalizeStage(d.stage) === stage.id);
            const stageTotal = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);

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
                  <Badge tone="neutral">{stageDeals.length}</Badge>
                </div>

                <div className={styles.kanbanColumn__summary}>
                  <span>Xác suất: {stage.prob}%</span>
                  <strong>{formatCompactCurrency(stageTotal)}</strong>
                </div>

                <div className={styles.kanbanColumn__body}>
                  {stageDeals.map((deal) => (
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
                        <span>👤 {deal.ownerName || 'Chưa gán'}</span>
                        {deal.expectedCloseDate && (
                          <span>📅 {new Date(deal.expectedCloseDate).toLocaleDateString('vi-VN')}</span>
                        )}
                      </div>

                      <div className={styles.dealCard__actions}>
                        <button
                          className={styles.cardActionBtn}
                          title="Quản lý Sản phẩm trong Deal"
                          onClick={() => handleOpenItems(deal)}
                        >
                          <Package size={13} /> {deal.items?.length || 0} SP
                        </button>

                        {/* Stage progress buttons */}
                        {stage.id !== 'won' && stage.id !== 'lost' && (
                          <>
                            {stage.id === 'negotiation' ? (
                              <button
                                className={styles.cardActionBtn}
                                style={{ color: '#16a34a' }}
                                onClick={() => handleOpenCloseDeal(deal, 'won')}
                              >
                                Chốt Won
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
                              style={{ color: '#ef4444' }}
                              title="Đóng Deal Lost"
                              onClick={() => handleOpenCloseDeal(deal, 'lost')}
                            >
                              Lost
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
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
                  deals.map((deal) => (
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
                          {deal.stage.toUpperCase()}
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
                          {deal.stage !== 'won' && deal.stage !== 'lost' && (
                            <button
                              className={styles.cardActionBtn}
                              style={{ color: '#16a34a' }}
                              onClick={() => handleOpenCloseDeal(deal, 'won')}
                            >
                              Won
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
        </div>
      )}

      {/* S5-01: Create Deal Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Tạo Cơ hội Bán hàng mới"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateDeal}>
          <div className={styles.formGrid}>
            <div className={styles['formGroup--full']}>
              <label className={styles.formLabel}>Tên cơ hội bán hàng *</label>
              <input
                className={styles.formInput}
                required
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                placeholder="VD: Triển khai Hệ thống CRM Doanh nghiệp Q4"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Quy mô trị giá (VNĐ) *</label>
              <input
                type="number"
                className={styles.formInput}
                required
                value={createForm.value}
                onChange={(e) => setCreateForm({ ...createForm, value: Number(e.target.value) })}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Giai đoạn Phễu</label>
              <select
                className={styles.formSelect}
                value={createForm.stage}
                onChange={(e) => {
                  const st = e.target.value;
                  const prob = STAGES.find((s) => s.id === st)?.prob || 20;
                  setCreateForm({ ...createForm, stage: st, probability: prob });
                }}
              >
                {STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.prob}%)
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Hạn chốt dự kiến (Expected Close Date)</label>
              <input
                type="date"
                className={styles.formInput}
                value={createForm.expectedCloseDate}
                onChange={(e) => setCreateForm({ ...createForm, expectedCloseDate: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Chiến dịch Marketing (S4-03 / EP-05)</label>
              <select
                className={styles.formSelect}
                value={createForm.campaignId}
                onChange={(e) => setCreateForm({ ...createForm, campaignId: e.target.value })}
              >
                <option value="">Không gắn chiến dịch</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
            <Button variant="secondary" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              Lưu Cơ hội Bán hàng
            </Button>
          </div>
        </form>
      </Modal>

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
                  type="number"
                  className={styles.formInput}
                  value={newItemForm.unitPrice}
                  onChange={(e) => setNewItemForm({ ...newItemForm, unitPrice: Number(e.target.value) })}
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
        title={closeForm.stage === 'won' ? 'Chốt Deal Thành Công (Close Won)' : 'Đóng Deal Thất Bại (Close Lost)'}
        maxWidth="md"
      >
        <form onSubmit={handleCloseDeal}>
          {closeForm.stage === 'won' ? (
            <div className={styles.formGrid}>
              <div className={styles['formGroup--full']}>
                <label className={styles.formLabel}>Doanh thu ký hợp đồng thực tế (VNĐ) *</label>
                <input
                  type="number"
                  className={styles.formInput}
                  required
                  value={closeForm.actualValue}
                  onChange={(e) => setCloseForm({ ...closeForm, actualValue: Number(e.target.value) })}
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
            <div className={styles.formGrid}>
              <div className={styles['formGroup--full']}>
                <label className={styles.formLabel}>Lý do thất bại (Loss Reason) *</label>
                <textarea
                  className={styles.formTextarea}
                  rows={3}
                  required
                  placeholder="VD: Giá quá cao so với ngân sách, thiếu tính năng tùy biến..."
                  value={closeForm.lossReason}
                  onChange={(e) => setCloseForm({ ...closeForm, lossReason: e.target.value })}
                />
              </div>

              <div className={styles['formGroup--full']}>
                <label className={styles.formLabel}>Đối thủ cạnh tranh thắng thầu</label>
                <input
                  className={styles.formInput}
                  placeholder="VD: Salesforce, Hubspot, Odoo..."
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
