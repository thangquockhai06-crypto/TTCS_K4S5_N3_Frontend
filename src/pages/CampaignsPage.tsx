import React, { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  Megaphone,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { ICampaign, ICampaignCreatePayload } from '../interfaces';
import { campaignService } from '../services/campaignService';
import { formatCurrency } from '../utils/formatters';
import { showGlobalToast, ToastType } from '../context/ToastContext';
import { Badge, Button, Modal, SearchBar } from '../components/common';
import styles from './CampaignsPage.module.css';

const notifyToast = (opts: { title?: string; description?: string; type?: ToastType }) => {
  showGlobalToast(`${opts.title ? opts.title + ': ' : ''}${opts.description || ''}`, opts.type || 'info');
};

export const CampaignsPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<ICampaign[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  const [createForm, setCreateForm] = useState<ICampaignCreatePayload>({
    name: '',
    code: '',
    type: 'Email',
    status: 'ACTIVE',
    budget: 20000000,
    expected_revenue: 100000000,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
  });

  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await campaignService.getCampaigns({
        search: searchQuery.trim() || undefined,
      });
      setCampaigns(data);
    } catch (err: any) {
      notifyToast({
        title: 'Lỗi tải chiến dịch',
        description: err.response?.data?.detail || 'Không thể kết nối máy chủ',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await campaignService.createCampaign(createForm);
      notifyToast({
        title: 'Tạo chiến dịch thành công',
        description: `Chiến dịch "${createForm.name}" đã được lưu.`,
        type: 'success',
      });
      setIsCreateModalOpen(false);
      setCreateForm({
        name: '',
        code: '',
        type: 'Email',
        status: 'ACTIVE',
        budget: 20000000,
        expected_revenue: 100000000,
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
      });
      fetchCampaigns();
    } catch (err: any) {
      notifyToast({
        title: 'Lỗi tạo chiến dịch',
        description: err.response?.data?.detail || 'Dữ liệu không hợp lệ',
        type: 'error',
      });
    }
  };

  return (
    <div className={styles.campaignPage}>
      <header className={styles.header}>
        <div className={styles.header__left}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Badge tone="primary" dot>
              CHIẾN DỊCH TIẾP THỊ
            </Badge>
          </div>
          <h1 className={styles.header__title}>Chiến dịch Tiếp thị (Campaign Tracking)</h1>
          <p className={styles.header__subtitle}>
            Theo dõi số lượng Lead, Deals và doanh thu thực tế phát sinh theo từng chiến dịch từ dữ liệu thời gian thực.
          </p>
        </div>

        <div>
          <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={16} /> Tạo Chiến dịch mới
          </Button>
        </div>
      </header>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ flex: 1, maxWidth: 380 }}>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Tìm theo tên hoặc mã chiến dịch..."
          />
        </div>
        <Button variant="ghost" onClick={fetchCampaigns}>
          <RefreshCw size={15} />
        </Button>
      </div>

      {/* Full-width Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableResponsive}>
          <table className={styles.campaignTable}>
            <thead>
              <tr>
                <th>TÊN CHIẾN DỊCH</th>
                <th>MÃ CODE</th>
                <th>LOẠI HÌNH</th>
                <th>TRẠNG THÁI</th>
                <th>NGÂN SÁCH</th>
                <th>SỐ LƯỢNG LEAD</th>
                <th>SỐ LƯỢNG DEAL</th>
                <th>DOANH THU THỰC TẾ</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>
                    <Loader2 className="animate-spin" size={28} style={{ margin: '0 auto', color: 'var(--color-primary)' }} />
                  </td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '48px' }}>
                    <Megaphone size={36} style={{ color: 'var(--color-text-muted)', marginBottom: 8 }} />
                    <p style={{ fontWeight: 600 }}>Chưa có chiến dịch nào</p>
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong style={{ color: 'var(--color-text-primary)' }}>{c.name}</strong>
                    </td>
                    <td>
                      <code>{c.code}</code>
                    </td>
                    <td>
                      <Badge tone="neutral">{c.type}</Badge>
                    </td>
                    <td>
                      <Badge tone={c.status === 'ACTIVE' ? 'success' : 'neutral'}>{c.status}</Badge>
                    </td>
                    <td>{formatCurrency(c.budget)}</td>
                    <td>
                      <strong style={{ color: 'var(--color-primary)' }}>{c.leads_count}</strong> Lead
                    </td>
                    <td>
                      <strong>{c.deals_count}</strong> Deal
                    </td>
                    <td>
                      <strong style={{ color: '#16a34a' }}>{formatCurrency(c.actual_revenue)}</strong>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Thêm mới Chiến dịch Tiếp thị"
        maxWidth="md"
      >
        <form onSubmit={handleCreate}>
          <div className={styles.formGrid}>
            <div className={styles['formGroup--full']}>
              <label className={styles.formLabel}>Tên chiến dịch *</label>
              <input
                className={styles.formInput}
                required
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="VD: Chiến dịch Ra mắt Phiên bản Mùa Thu"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Mã định danh (Code) *</label>
              <input
                className={styles.formInput}
                required
                value={createForm.code}
                onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
                placeholder="VD: CMP-AUTUMN-2026"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Kênh / Loại hình</label>
              <select
                className={styles.formSelect}
                value={createForm.type}
                onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
              >
                <option value="Email">Email Marketing</option>
                <option value="Social">Mạng xã hội (Facebook/LinkedIn)</option>
                <option value="Search Ads">Quảng cáo Google Search</option>
                <option value="Event">Hội thảo / Sự kiện</option>
                <option value="Webinar">Webinar Trực tuyến</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Ngân sách (VNĐ)</label>
              <input
                type="number"
                className={styles.formInput}
                value={createForm.budget}
                onChange={(e) => setCreateForm({ ...createForm, budget: Number(e.target.value) })}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Doanh thu kỳ vọng (VNĐ)</label>
              <input
                type="number"
                className={styles.formInput}
                value={createForm.expected_revenue}
                onChange={(e) => setCreateForm({ ...createForm, expected_revenue: Number(e.target.value) })}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Ngày bắt đầu</label>
              <input
                type="date"
                className={styles.formInput}
                value={createForm.start_date || ''}
                onChange={(e) => setCreateForm({ ...createForm, start_date: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Ngày kết thúc</label>
              <input
                type="date"
                className={styles.formInput}
                value={createForm.end_date || ''}
                onChange={(e) => setCreateForm({ ...createForm, end_date: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <Button variant="secondary" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              Lưu Chiến dịch
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
