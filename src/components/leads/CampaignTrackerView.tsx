import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  Trash2,
  Edit2,
  Eye,
  FileSpreadsheet,
} from 'lucide-react';
import { Button, Badge, Modal, Input, ConfirmModal } from '../common';
import { CustomSelect, ICustomSelectOption } from '../common/CustomSelect';
import {
  CampaignChannelType,
  CampaignStatusType,
  ICampaign,
} from '../../interfaces/campaign.interface';
import { useCampaigns } from '../../hooks/useCampaigns';
import { formatCurrency } from '../../utils/formatters';
import styles from './CampaignTrackerView.module.css';

const CHANNEL_OPTIONS: ICustomSelectOption<CampaignChannelType>[] = [
  { value: 'Google Ads', label: 'Google Ads (Tìm kiếm & GDN)' },
  { value: 'Facebook Ads', label: 'Facebook / Meta Ads' },
  { value: 'LinkedIn Ads', label: 'LinkedIn B2B Ads' },
  { value: 'Email Marketing', label: 'Email Marketing Chăm Sóc' },
  { value: 'Hội thảo / Sự kiện', label: 'Hội Thảo / Sự Kiện Trực Tiếp' },
  { value: 'SEO / Organic', label: 'SEO / Tìm Kiếm Tự Nhiên' },
  { value: 'TikTok Ads', label: 'TikTok Video Ads' },
  { value: 'Đối tác giới thiệu', label: 'Đối Tác & Mạng Lưới Giới Thiệu' },
];

const CHANNEL_FILTER_OPTIONS: ICustomSelectOption<string>[] = [
  { value: 'All', label: 'Tất cả các kênh tiếp thị' },
  { value: 'Google Ads', label: 'Google Ads' },
  { value: 'Facebook Ads', label: 'Facebook Ads' },
  { value: 'LinkedIn Ads', label: 'LinkedIn Ads' },
  { value: 'Email Marketing', label: 'Email Marketing' },
  { value: 'Hội thảo / Sự kiện', label: 'Hội Thảo / Sự Kiện' },
  { value: 'SEO / Organic', label: 'SEO / Organic' },
];

const STATUS_FILTER_OPTIONS: ICustomSelectOption<string>[] = [
  { value: 'All', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'completed', label: 'Đã hoàn thành' },
  { value: 'paused', label: 'Đang tạm dừng' },
  { value: 'planning', label: 'Đang lên kế hoạch' },
];

export const CampaignTrackerView: React.FC = () => {
  const {
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
    deleteCampaign,
  } = useCampaigns();

  // Active sub-tab in detail tracker section: 'leads' | 'deals'
  const [detailTab, setDetailTab] = useState<'leads' | 'deals'>('leads');

  // Modal create campaign state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [newCampaignName, setNewCampaignName] = useState<string>('');
  const [newCampaignCode, setNewCampaignCode] = useState<string>('');
  const [newCampaignChannel, setNewCampaignChannel] = useState<CampaignChannelType>('Google Ads');
  const [newCampaignBudget, setNewCampaignBudget] = useState<string>('20000000');
  const [newCampaignStartDate, setNewCampaignStartDate] = useState<string>('2026-10-01');
  const [newCampaignEndDate, setNewCampaignEndDate] = useState<string>('2026-11-30');
  const [newCampaignTargetLeads, setNewCampaignTargetLeads] = useState<string>('40');
  const [newCampaignDesc, setNewCampaignDesc] = useState<string>('');

  // Delete confirm modal state
  const [campaignToDelete, setCampaignToDelete] = useState<ICampaign | null>(null);

  const handleOpenCreateModal = (): void => {
    setNewCampaignName('');
    setNewCampaignCode(`CAMP-${Date.now().toString(36).toUpperCase()}`);
    setNewCampaignChannel('Google Ads');
    setNewCampaignBudget('20000000');
    setNewCampaignStartDate(new Date().toISOString().slice(0, 10));
    setNewCampaignEndDate(
      new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    );
    setNewCampaignTargetLeads('40');
    setNewCampaignDesc('');
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!newCampaignName.trim()) return;

    createCampaign({
      name: newCampaignName.trim(),
      code: newCampaignCode.trim(),
      channel: newCampaignChannel,
      budget: Number(newCampaignBudget) || 0,
      startDate: newCampaignStartDate,
      endDate: newCampaignEndDate,
      status: 'active',
      targetLeads: Number(newCampaignTargetLeads) || undefined,
      description: newCampaignDesc.trim(),
    });

    setIsCreateModalOpen(false);
  };

  const handleConfirmDelete = (): void => {
    if (!campaignToDelete) return;
    deleteCampaign(campaignToDelete.id);
    setCampaignToDelete(null);
  };

  // Find performance for a campaign
  const getPerf = (id: string) => {
    return (
      performanceList.find((p) => p.campaignId === id) || {
        totalLeads: 0,
        totalDeals: 0,
        wonDealsCount: 0,
        wonRevenue: 0,
        conversionRate: '0.0%',
        roi: '0.0%',
      }
    );
  };

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <div className={styles.mainTitle}>
            <TrendingUp size={22} color="var(--color-primary)" />
            Theo Dõi Lead &amp; Hiệu Quả Theo Chiến Dịch
          </div>
          <div className={styles.subTitle}>
            Đo lường chi tiết chiến dịch nào thực sự đem lại doanh thu và giá trị chốt hợp đồng, không chỉ ra nhiều lead.
          </div>
        </div>

        <Button
          type="button"
          variant="primary"
          size="md"
          leftIcon={<Plus size={16} />}
          onClick={handleOpenCreateModal}
        >
          Khai Báo Chiến Dịch Mới
        </Button>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div>
            <div className={styles.kpiLabel}>TỔNG NGÂN SÁCH ĐẦU TƯ</div>
            <div className={styles.kpiValue}>
              {formatCurrency(totalMetrics.totalBudget)}
            </div>
            <div className={styles.kpiSubText}>Trên toàn bộ các chiến dịch</div>
          </div>
          <div className={styles.kpiIconBox} style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#2563EB' }}>
            <DollarSign size={22} />
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div>
            <div className={styles.kpiLabel}>TỔNG LEAD THU THẬP</div>
            <div className={styles.kpiValue} style={{ color: '#0284C7' }}>
              {totalMetrics.totalLeads}
            </div>
            <div className={styles.kpiSubText}>Từ web form, sự kiện &amp; ads</div>
          </div>
          <div className={styles.kpiIconBox} style={{ backgroundColor: 'rgba(2, 132, 199, 0.1)', color: '#0284C7' }}>
            <Users size={22} />
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div>
            <div className={styles.kpiLabel}>CƠ HỘI KINH DOANH (DEALS)</div>
            <div className={styles.kpiValue} style={{ color: '#7C3AED' }}>
              {totalMetrics.totalDeals}
            </div>
            <div className={styles.kpiSubText}>Đã được phân bổ chăm sóc</div>
          </div>
          <div className={styles.kpiIconBox} style={{ backgroundColor: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED' }}>
            <Target size={22} />
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div>
            <div className={styles.kpiLabel}>DOANH THU ĐÃ CHỐT &amp; ROI</div>
            <div className={styles.kpiValue} style={{ color: '#16A34A' }}>
              {formatCurrency(totalMetrics.totalWonRevenue)}
            </div>
            <div className={styles.kpiSubText} style={{ color: '#16A34A', fontWeight: 600 }}>
              ROI ước tính: {totalMetrics.overallRoi}
            </div>
          </div>
          <div className={styles.kpiIconBox} style={{ backgroundColor: 'rgba(22, 163, 74, 0.1)', color: '#16A34A' }}>
            <ArrowUpRight size={22} />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className={styles.filterRow}>
        <div className={styles.searchBox}>
          <Search size={16} color="var(--color-text-muted)" />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Tìm theo tên chiến dịch, mã code hoặc kênh..."
            value={filterState.searchQuery}
            onChange={(e) =>
              setFilterState((prev) => ({ ...prev, searchQuery: e.target.value }))
            }
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ minWidth: '180px' }}>
            <CustomSelect
              options={CHANNEL_FILTER_OPTIONS}
              value={filterState.channel}
              onChange={(val) =>
                setFilterState((prev) => ({
                  ...prev,
                  channel: val as CampaignChannelType | 'All',
                }))
              }
              height="38px"
            />
          </div>

          <div style={{ minWidth: '160px' }}>
            <CustomSelect
              options={STATUS_FILTER_OPTIONS}
              value={filterState.status}
              onChange={(val) =>
                setFilterState((prev) => ({
                  ...prev,
                  status: val as CampaignStatusType | 'All',
                }))
              }
              height="38px"
            />
          </div>
        </div>
      </div>

      {/* Table of Campaigns */}
      <div className={styles.tableWrapper}>
        <table className={styles.customTable}>
          <thead>
            <tr>
              <th style={{ width: '22%' }}>Chiến Dịch &amp; Mã Tag</th>
              <th style={{ width: '13%' }}>Kênh Tiếp Thị</th>
              <th style={{ width: '12%' }}>Ngân Sách</th>
              <th style={{ width: '14%' }}>Thời Gian Chạy</th>
              <th style={{ width: '8%', textAlign: 'center' }}>Số Lead</th>
              <th style={{ width: '8%', textAlign: 'center' }}>Số Deal</th>
              <th style={{ width: '12%', textAlign: 'right' }}>Doanh Thu Won</th>
              <th style={{ width: '8%', textAlign: 'center' }}>ROI</th>
              <th style={{ width: '10%', textAlign: 'center' }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredCampaigns.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--color-text-muted)' }}>
                  Không tìm thấy chiến dịch nào phù hợp với điều kiện tìm kiếm.
                </td>
              </tr>
            ) : (
              filteredCampaigns.map((camp) => {
                const perf = getPerf(camp.id);
                const isSelected = selectedCampaignId === camp.id;

                return (
                  <tr
                    key={camp.id}
                    style={{
                      backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.05)' : undefined,
                    }}
                  >
                    <td>
                      <div>
                        <strong style={{ fontSize: '0.88rem', color: 'var(--color-text-main)' }}>
                          {camp.name}
                        </strong>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontFamily: 'monospace', marginTop: '2px' }}>
                          code: {camp.code}
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge tone="primary">{camp.channel}</Badge>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{formatCurrency(camp.budget)}</div>
                    </td>
                    <td style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)' }}>
                      <div>Từ: {camp.startDate}</div>
                      <div>Đến: {camp.endDate}</div>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: '#0284C7' }}>
                      {perf.totalLeads}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: '#7C3AED' }}>
                      {perf.totalDeals}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#16A34A' }}>
                      {formatCurrency(perf.wonRevenue)}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: perf.wonRevenue > 0 ? '#16A34A' : 'var(--color-text-muted)' }}>
                      {perf.roi}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <button
                          type="button"
                          className={styles.actionBtn}
                          onClick={() => setSelectedCampaignId(isSelected ? null : camp.id)}
                          title="Lọc xem chi tiết Lead & Deal của chiến dịch này"
                          style={{
                            backgroundColor: isSelected ? 'var(--color-primary)' : undefined,
                            color: isSelected ? '#FFFFFF' : undefined,
                          }}
                        >
                          <Eye size={12} /> {isSelected ? 'Đang lọc' : 'Lọc'}
                        </button>
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                          onClick={() => setCampaignToDelete(camp)}
                          title="Xóa chiến dịch"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Lead & Deal Tracker for Selected Campaign */}
      <div className={styles.detailSection}>
        <div className={styles.detailHeader}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="var(--color-primary)" />
              {selectedCampaign
                ? `Danh Sách Lead & Cơ Hội Thuộc Chiến Dịch: "${selectedCampaign.name}"`
                : 'Tất Cả Lead & Cơ Hội Trên Hệ Thống'}
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
              {selectedCampaign
                ? `Đang hiển thị ${selectedCampaignLeads.length} lead và ${selectedCampaignDeals.length} deals được sinh ra từ chiến dịch này.`
                : 'Nhấp nút "Lọc" ở bảng trên để xem chi tiết theo từng chiến dịch tiếp thị.'}
            </span>
          </div>

          <div className={styles.tabsNav}>
            <button
              type="button"
              className={`${styles.tabBtn} ${detailTab === 'leads' ? styles.tabBtnActive : ''}`}
              onClick={() => setDetailTab('leads')}
            >
              Danh Sách Lead ({selectedCampaignLeads.length})
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${detailTab === 'deals' ? styles.tabBtnActive : ''}`}
              onClick={() => setDetailTab('deals')}
            >
              Cơ Hội / Deals Doanh Thu ({selectedCampaignDeals.length})
            </button>
          </div>
        </div>

        {/* Tab Leads */}
        {detailTab === 'leads' && (
          <div className={styles.tableWrapper}>
            <table className={styles.customTable}>
              <thead>
                <tr>
                  <th>Khách Hàng &amp; Doanh Nghiệp</th>
                  <th>Email &amp; Điện Thoại</th>
                  <th>Nhu Cầu Quan Tâm</th>
                  <th>Nguồn Lead / Chiến Dịch</th>
                  <th>Trạng Thái CRM</th>
                  <th>Thời Gian Tiếp Nhận</th>
                </tr>
              </thead>
              <tbody>
                {selectedCampaignLeads.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>
                      Chưa có lead nào phát sinh từ chiến dịch này.
                    </td>
                  </tr>
                ) : (
                  selectedCampaignLeads.map((lead) => (
                    <tr key={lead.id}>
                      <td>
                        <strong>{lead.fullName}</strong>
                        <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                          {lead.company || 'Doanh nghiệp chưa phân loại'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8rem' }}>{lead.email}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                          {lead.phone}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{lead.interest}</div>
                      </td>
                      <td>
                        <Badge tone="primary">{lead.leadSource}</Badge>
                      </td>
                      <td>
                        <Badge tone="success">{lead.status}</Badge>
                      </td>
                      <td style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)' }}>
                        {lead.submittedAt}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab Deals */}
        {detailTab === 'deals' && (
          <div className={styles.tableWrapper}>
            <table className={styles.customTable}>
              <thead>
                <tr>
                  <th>Tên Cơ Hội / Hợp Đồng</th>
                  <th>Khách Hàng &amp; Doanh Nghiệp</th>
                  <th style={{ textAlign: 'right' }}>Giá Trị Deal</th>
                  <th style={{ textAlign: 'center' }}>Xác Suất</th>
                  <th style={{ textAlign: 'center' }}>Giai Đoạn</th>
                  <th>Ngày Đóng Dự Kiến</th>
                </tr>
              </thead>
              <tbody>
                {selectedCampaignDeals.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>
                      Chưa có cơ hội kinh doanh (deal) nào được tạo từ chiến dịch này.
                    </td>
                  </tr>
                ) : (
                  selectedCampaignDeals.map((deal) => (
                    <tr key={deal.id}>
                      <td>
                        <strong style={{ fontSize: '0.85rem' }}>{deal.title}</strong>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                          Phụ trách: {deal.ownerName}
                        </div>
                      </td>
                      <td>
                        <div>{deal.customerName}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                          {deal.company}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: deal.stage === 'Won' ? '#16A34A' : 'var(--color-text-main)' }}>
                        {formatCurrency(deal.value)}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>
                        {deal.probability}%
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <Badge tone={deal.stage === 'Won' ? 'success' : deal.stage === 'Negotiation' ? 'warning' : 'primary'}>
                          {deal.stage === 'Won' ? 'Đã Chốt (Won)' : deal.stage === 'Negotiation' ? 'Đàm Phán' : deal.stage === 'Contacted' ? 'Đã Liên Hệ' : 'Mới'}
                        </Badge>
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                        {deal.expectedCloseDate}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Campaign Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Khai Báo Chiến Dịch Tiếp Thị Mới"
        subtitle="Thiết lập ngân sách, kênh tiếp thị và thời gian triển khai để đo lường hiệu quả chuyển đổi"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className={styles.modalForm}>
          <div className={styles.formRow2}>
            <Input
              label="Tên chiến dịch"
              placeholder="Ví dụ: Chiến dịch Google Ads Q4"
              value={newCampaignName}
              onChange={(e) => setNewCampaignName(e.target.value)}
              required
            />
            <Input
              label="Mã code chiến dịch"
              placeholder="Ví dụ: CAMP-GOOGLE-Q4"
              value={newCampaignCode}
              onChange={(e) => setNewCampaignCode(e.target.value)}
              required
            />
          </div>

          <div className={styles.formRow2}>
            <CustomSelect
              label="Kênh tiếp thị"
              options={CHANNEL_OPTIONS}
              value={newCampaignChannel}
              onChange={(val) => setNewCampaignChannel(val as CampaignChannelType)}
              height="47px"
            />
            <Input
              label="Ngân sách đầu tư (VND)"
              type="number"
              placeholder="20000000"
              value={newCampaignBudget}
              onChange={(e) => setNewCampaignBudget(e.target.value)}
              required
            />
          </div>

          <div className={styles.formRow2}>
            <Input
              label="Ngày bắt đầu"
              type="date"
              value={newCampaignStartDate}
              onChange={(e) => setNewCampaignStartDate(e.target.value)}
              required
            />
            <Input
              label="Ngày kết thúc"
              type="date"
              value={newCampaignEndDate}
              onChange={(e) => setNewCampaignEndDate(e.target.value)}
              required
            />
          </div>

          <Input
            label="Mục tiêu số lượng Lead"
            type="number"
            placeholder="Ví dụ: 40"
            value={newCampaignTargetLeads}
            onChange={(e) => setNewCampaignTargetLeads(e.target.value)}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              Mô tả chi tiết mục tiêu chiến dịch
            </label>
            <textarea
              className={styles.formTextarea}
              placeholder="Mô tả đối tượng khách hàng mục tiêu, thông điệp truyền thông hoặc chỉ số kỳ vọng..."
              value={newCampaignDesc}
              onChange={(e) => setNewCampaignDesc(e.target.value)}
            />
          </div>

          <div className={styles.modalFooter}>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Hủy bỏ
            </Button>
            <Button type="submit" variant="primary" size="md">
              Khai Báo Chiến Dịch
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={campaignToDelete !== null}
        title="Xác nhận xóa Chiến dịch"
        message={`Bạn có chắc chắn muốn xóa chiến dịch "${campaignToDelete?.name}"? Thao tác này sẽ xóa chiến dịch khỏi danh sách theo dõi.`}
        confirmLabel="Xác nhận xóa"
        cancelLabel="Hủy bỏ"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setCampaignToDelete(null)}
      />
    </div>
  );
};
