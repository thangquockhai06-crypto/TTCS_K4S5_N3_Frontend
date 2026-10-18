import React, { useEffect, useMemo, useState } from 'react';
import {
  PhoneCall,
  Users,
  Mail,
  MessageSquare,
  Briefcase,
  RefreshCw,
  Plus,
  Clock,
  Calendar,
  Building2,
} from 'lucide-react';
import { AuditLogViewer } from '../components/audit/AuditLogViewer';
import { Badge, Button, Card, Modal, SearchBar } from '../components/common';
import { activityService, IActivityDTO, ICreateActivityPayload } from '../services/activityService';
import { customerService } from '../services/customerService';
import { dealService } from '../services/dealService';
import { showGlobalToast } from '../context/ToastContext';
import styles from './ActivitiesPage.module.css';

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  call: { label: 'Cuộc gọi', color: '#2563eb', icon: <PhoneCall size={15} /> },
  meeting: { label: 'Cuộc họp', color: '#7c3aed', icon: <Users size={15} /> },
  email: { label: 'Email', color: '#059669', icon: <Mail size={15} /> },
  note: { label: 'Ghi chú', color: '#d97706', icon: <MessageSquare size={15} /> },
  deal_change: { label: 'Thay đổi Cơ hội', color: '#ea580c', icon: <Briefcase size={15} /> },
  status_change: { label: 'Trạng thái', color: '#475569', icon: <RefreshCw size={15} /> },
};

export const ActivitiesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'personal' | 'audit'>('personal');

  // Personal Activities state (S6-05)
  const [activities, setActivities] = useState<IActivityDTO[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterTime, setFilterTime] = useState<string>('all');
  const [query, setQuery] = useState<string>('');

  // Modal create activity
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [dealsList, setDealsList] = useState<any[]>([]);
  const [newActivityForm, setNewActivityForm] = useState<ICreateActivityPayload>({
    type: 'call',
    title: '',
    customerId: '',
    dealId: '',
    description: '',
    notes: '',
  });

  // Load catalogs for modal
  useEffect(() => {
    customerService.getCustomers({ limit: 100 }).then((res: any) => {
      setCustomersList(res.items || res.customers || res || []);
    }).catch(() => {});
    dealService.getDeals().then(setDealsList).catch(() => {});
  }, []);

  // Fetch personal activities (S6-05)
  const fetchPersonalActivities = async () => {
    setIsLoading(true);
    try {
      const data = await activityService.getPersonalActivities({
        search: query.trim() || undefined,
        type: filterType !== 'all' ? filterType : undefined,
      });
      setActivities(data);
    } catch (err: any) {
      showGlobalToast(err.response?.data?.detail || 'Không thể tải lịch sử hoạt động', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'personal') {
      fetchPersonalActivities();
    }
  }, [activeTab, filterType, query]);

  // Client-side time filtering for fast responsive UI
  const filteredActivities = useMemo(() => {
    if (filterTime === 'all') return activities;

    const now = new Date();
    return activities.filter((act) => {
      if (!act.createdAt) return false;
      const actDate = new Date(act.createdAt);
      if (filterTime === 'today') {
        return actDate.toDateString() === now.toDateString();
      }
      if (filterTime === '7days') {
        const diff = (now.getTime() - actDate.getTime()) / (1000 * 3600 * 24);
        return diff >= 0 && diff <= 7;
      }
      if (filterTime === '30days') {
        const diff = (now.getTime() - actDate.getTime()) / (1000 * 3600 * 24);
        return diff >= 0 && diff <= 30;
      }
      return true;
    });
  }, [activities, filterTime]);

  // Create personal activity
  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivityForm.title.trim()) {
      showGlobalToast('Vui lòng nhập tiêu đề hoạt động.', 'warning');
      return;
    }

    try {
      await activityService.createActivity({
        ...newActivityForm,
        customerId: newActivityForm.customerId || undefined,
        dealId: newActivityForm.dealId || undefined,
      });
      showGlobalToast('Đã ghi nhận hoạt động cá nhân thành công!', 'success');
      setIsModalOpen(false);
      setNewActivityForm({
        type: 'call',
        title: '',
        customerId: '',
        dealId: '',
        description: '',
        notes: '',
      });
      fetchPersonalActivities();
    } catch (err: any) {
      showGlobalToast(err.response?.data?.detail || 'Lỗi khi lưu hoạt động', 'error');
    }
  };

  return (
    <div className={styles.activitiesPage}>
      <header className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <Badge tone="primary" dot>
              SPRINT 6 · NHẬT KÝ HOẠT ĐỘNG &amp; KIỂM TOÁN
            </Badge>
            <h1 className={styles.title}>Nhật ký Hoạt động &amp; Kiểm toán Hệ thống</h1>
            <p className={styles.subtitle}>
              Xem lịch sử hoạt động cá nhân với đầy đủ loại tương tác, thời gian, khách hàng/cơ hội liên quan, mô tả và ghi chú.
            </p>
          </div>

          {activeTab === 'personal' && (
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              <Plus size={16} /> Ghi nhận Hoạt động mới
            </Button>
          )}
        </div>

        <nav className={styles.tabNav} aria-label="Phân loại nhật ký">
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'personal' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('personal')}
          >
            👤 Lịch sử hoạt động cá nhân
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'audit' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            📋 Nhật ký thay đổi hệ thống
          </button>
        </nav>
      </header>

      {activeTab === 'audit' ? (
        <AuditLogViewer />
      ) : (
        <>
          {/* Filters Bar (S6-05) */}
          <Card padding="sm" className={styles.filterBar}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569' }}>Loại hoạt động:</span>
              <div className={styles.chips}>
                <button
                  type="button"
                  onClick={() => setFilterType('all')}
                  className={`${styles.chip} ${filterType === 'all' ? styles['chip--active'] : ''}`}
                >
                  Tất cả
                </button>
                {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFilterType(key)}
                    className={`${styles.chip} ${filterType === key ? styles['chip--active'] : ''}`}
                    style={filterType === key ? { backgroundColor: cfg.color, borderColor: cfg.color, color: '#fff' } : {}}
                  >
                    {cfg.icon} {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={15} style={{ color: '#64748b' }} />
                <select
                  value={filterTime}
                  onChange={(e) => setFilterTime(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.8125rem',
                    backgroundColor: '#fff',
                    color: '#0f172a',
                    cursor: 'pointer',
                  }}
                >
                  <option value="all">Tất cả thời gian</option>
                  <option value="today">Hôm nay</option>
                  <option value="7days">7 ngày qua</option>
                  <option value="30days">30 ngày qua</option>
                </select>
              </div>

              <div className={styles.searchWrap}>
                <SearchBar
                  value={query}
                  onChange={setQuery}
                  placeholder="Tìm kiếm theo tiêu đề, mô tả, ghi chú..."
                  shortcutHint=""
                />
              </div>
            </div>
          </Card>

          {/* Activities List (S6-05) */}
          <Card padding="md">
            {isLoading ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>Đang nạp dữ liệu hoạt động...</div>
            ) : filteredActivities.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
                <Clock size={40} style={{ opacity: 0.35, margin: '0 auto 12px' }} />
                <p style={{ margin: 0, fontWeight: 600, color: '#475569' }}>Chưa có hoạt động nào phù hợp.</p>
                <p style={{ margin: '4px 0 0', fontSize: '0.8125rem' }}>Hãy bấm "+ Ghi nhận Hoạt động mới" để lưu lại tương tác.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {filteredActivities.map((act) => {
                  const cfg = TYPE_CONFIG[act.type] || { label: act.type, color: '#64748b', icon: <Clock size={15} /> };
                  return (
                    <div
                      key={act.id}
                      style={{
                        padding: '16px 20px',
                        borderRadius: 10,
                        border: '1px solid #e2e8f0',
                        backgroundColor: '#fff',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                        transition: 'box-shadow 0.2s',
                      }}
                    >
                      {/* Top Row: Type, Title, Time */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '4px 10px',
                              borderRadius: 6,
                              backgroundColor: `${cfg.color}15`,
                              color: cfg.color,
                              fontWeight: 700,
                              fontSize: '0.8125rem',
                            }}
                          >
                            {cfg.icon} {cfg.label}
                          </span>
                          <strong style={{ fontSize: '0.975rem', color: '#0f172a' }}>{act.title}</strong>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: '0.8125rem' }}>
                          <Clock size={14} />
                          <span>
                            {act.createdAt
                              ? new Date(act.createdAt).toLocaleString('vi-VN', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '—'}
                          </span>
                        </div>
                      </div>

                      {/* Associated Customer & Deal (S6-05) */}
                      {(act.customerName || act.customerId || act.dealTitle || act.dealId) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', fontSize: '0.8125rem' }}>
                          {(act.customerName || act.customerId) && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#1e40af', backgroundColor: '#eff6ff', padding: '2px 8px', borderRadius: 4 }}>
                              <Building2 size={13} />
                              <strong>Khách hàng:</strong> {act.customerName || act.customerId}
                            </span>
                          )}
                          {(act.dealTitle || act.dealId) && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#92400e', backgroundColor: '#fef3c7', padding: '2px 8px', borderRadius: 4 }}>
                              <Briefcase size={13} />
                              <strong>Deal:</strong> {act.dealTitle || act.dealId}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Description (S6-05) */}
                      {act.description && (
                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#334155', lineHeight: 1.5 }}>
                          {act.description}
                        </p>
                      )}

                      {/* Notes (S6-05) */}
                      {act.notes && (
                        <div
                          style={{
                            padding: '8px 12px',
                            borderRadius: 6,
                            backgroundColor: '#fffbeb',
                            borderLeft: '4px solid #f59e0b',
                            fontSize: '0.8125rem',
                            color: '#78350f',
                          }}
                        >
                          <strong>Ghi chú bổ sung:</strong> {act.notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}

      {/* Modal Create Personal Activity (S6-05) */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Ghi nhận Hoạt động cá nhân mới (S6-05)"
          maxWidth="md"
        >
          <form onSubmit={handleCreateActivity} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4 }}>
                Loại hoạt động <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                value={newActivityForm.type}
                onChange={(e) => setNewActivityForm({ ...newActivityForm, type: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}
              >
                <option value="call">📞 Cuộc gọi tư vấn</option>
                <option value="meeting">🤝 Cuộc họp trao đổi</option>
                <option value="email">✉️ Email liên hệ</option>
                <option value="note">📝 Ghi chú chăm sóc</option>
                <option value="deal_change">💼 Thay đổi Cơ hội bán hàng</option>
                <option value="status_change">🔄 Cập nhật trạng thái</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4 }}>
                Tiêu đề hoạt động <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Gọi điện trao đổi điều khoản thanh toán..."
                value={newActivityForm.title}
                onChange={(e) => setNewActivityForm({ ...newActivityForm, title: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4 }}>
                  Khách hàng liên quan (S6-05)
                </label>
                <select
                  value={newActivityForm.customerId}
                  onChange={(e) => setNewActivityForm({ ...newActivityForm, customerId: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                >
                  <option value="">— Không chọn —</option>
                  {customersList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company || c.fullName || c.name || c.id}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4 }}>
                  Cơ hội bán hàng liên quan (S6-05)
                </label>
                <select
                  value={newActivityForm.dealId}
                  onChange={(e) => setNewActivityForm({ ...newActivityForm, dealId: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                >
                  <option value="">— Không chọn —</option>
                  {dealsList.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4 }}>
                Mô tả chi tiết nội dung (S6-05)
              </label>
              <textarea
                rows={3}
                placeholder="Tóm tắt nội dung trao đổi, tiến độ hoặc kết quả đạt được..."
                value={newActivityForm.description}
                onChange={(e) => setNewActivityForm({ ...newActivityForm, description: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4 }}>
                Ghi chú nội bộ (S6-05)
              </label>
              <textarea
                rows={2}
                placeholder="Ghi chú thêm những điều cần lưu ý cho các lần tiếp xúc sau..."
                value={newActivityForm.notes}
                onChange={(e) => setNewActivityForm({ ...newActivityForm, notes: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
              <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
                Hủy bỏ
              </Button>
              <Button variant="primary" type="submit">
                Lưu hoạt động
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
