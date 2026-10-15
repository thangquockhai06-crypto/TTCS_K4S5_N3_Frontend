import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Edit2,
  Loader2,
  Megaphone,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { ICampaign } from '../interfaces';
import { campaignService } from '../services/campaignService';
import { formatCurrency } from '../utils/formatters';
import { showGlobalToast, ToastType } from '../context/ToastContext';
import { Badge, Button, SearchBar } from '../components/common';
import styles from './CampaignsPage.module.css';

const notifyToast = (opts: { title?: string; description?: string; type?: ToastType }) => {
  showGlobalToast(`${opts.title ? opts.title + ': ' : ''}${opts.description || ''}`, opts.type || 'info');
};

export const CampaignsPage: React.FC = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<ICampaign[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

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
          <Button variant="primary" onClick={() => navigate('/campaigns/create')}>
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
                <th style={{ textAlign: 'right' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px' }}>
                    <Loader2 className="animate-spin" size={28} style={{ margin: '0 auto', color: 'var(--color-primary)' }} />
                  </td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '48px' }}>
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
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => navigate(`/campaigns/${c.id}/edit`)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 8px',
                          border: '1px solid #cbd5e1',
                          borderRadius: 6,
                          background: '#ffffff',
                          color: '#2563eb',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                        }}
                        title="Chỉnh sửa Chiến dịch"
                      >
                        <Edit2 size={13} /> Sửa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
