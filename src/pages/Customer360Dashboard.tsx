import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Clock,
  DollarSign,
  Edit,
  ExternalLink,
  FileText,
  GitMerge,
  Globe,
  LifeBuoy,
  Loader2,
  MapPin,
  Plus,
  Send,
} from 'lucide-react';
import { ICustomer360, ISupportTicket } from '../interfaces/customer.interface';
import { customerService } from '../services/customerService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Avatar, Badge, Button, Card, LoadingSkeleton } from '../components/common';
import { RiskBadge } from '../components/customer/RiskBadge';
import { ContactListTab } from '../components/customer/ContactListTab';
import { CorporateTree } from '../components/customer/CorporateTree';
import { CustomerForm } from '../components/customer/CustomerForm';
import { SupportTicketModal } from '../components/customer/SupportTicketModal';
import { MergeCustomerModal } from '../components/customer/MergeCustomerModal';
import { showGlobalToast } from '../context/ToastContext';

type TabKey = 'info' | 'deals' | 'activities' | 'docs';

export const Customer360Dashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabKey>('info');
  const [data360, setData360] = useState<ICustomer360 | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);

  // Activity form
  const [newActivityType, setNewActivityType] = useState<'call' | 'meeting' | 'email' | 'note'>('call');
  const [newActivityTitle, setNewActivityTitle] = useState('');
  const [newActivityDesc, setNewActivityDesc] = useState('');
  const [isSubmittingActivity, setIsSubmittingActivity] = useState(false);

  useEffect(() => {
    if (id) {
      loadCustomer360(id);
    }
  }, [id]);

  const loadCustomer360 = async (customerId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await customerService.getCustomer360(customerId);
      setData360(res);
    } catch (err: any) {
      console.error('Lỗi tải dữ liệu Customer 360:', err);
      setError(err.response?.data?.detail || 'Không tìm thấy hồ sơ khách hàng 360 này.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newActivityTitle.trim()) return;

    setIsSubmittingActivity(true);
    try {
      await customerService.quickTouchCustomer(id);
      showGlobalToast('Đã ghi nhận tương tác khách hàng thành công!', 'success');
      setNewActivityTitle('');
      setNewActivityDesc('');
      loadCustomer360(id);
    } catch (err: any) {
      const errMsg = err?.response?.data?.detail || 'Lỗi khi thêm hoạt động';
      showGlobalToast(errMsg, 'error');
      console.error('Lỗi khi thêm hoạt động:', err);
    } finally {
      setIsSubmittingActivity(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <LoadingSkeleton height={80} />
        <LoadingSkeleton height={400} />
      </div>
    );
  }

  if (error || !data360) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <h2 style={{ color: '#DC2626', marginBottom: 12 }}>{error || 'Lỗi dữ liệu'}</h2>
        <Button variant="primary" onClick={() => navigate('/customers')} leftIcon={<ArrowLeft size={16} />}>
          Quay lại danh bạ khách hàng
        </Button>
      </div>
    );
  }

  const { customer, contacts, deals, activities, tickets } = data360;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Breadcrumb & Actions Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/customers')}
          leftIcon={<ArrowLeft size={16} />}
        >
          Quay lại danh sách
        </Button>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/customers/merge?primaryId=${customer.id}`)}
            leftIcon={<GitMerge size={15} />}
          >
            Gộp trùng
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsTicketModalOpen(true)}
            leftIcon={<LifeBuoy size={15} />}
          >
            Phiếu hỗ trợ ({tickets?.length || 0})
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/customers/${customer.id}/edit`)}
            leftIcon={<Edit size={15} />}
          >
            Chỉnh sửa thông tin
          </Button>
        </div>
      </div>

      {/* Customer 360 Header Banner */}
      <Card padding="lg">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Avatar
              name={customer.company || customer.fullName}
              src={customer.avatarUrl}
              size="lg"
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  {customer.company || customer.fullName}
                </h1>
                <RiskBadge isRisk={Boolean(customer.riskFlag)} reason={customer.riskReason} />
                <Badge tone="primary" size="sm">
                  {customer.tier || 'Enterprise'}
                </Badge>
                <Badge tone={customer.status === 'Active' ? 'success' : 'neutral'} size="sm">
                  {customer.status || 'New Lead'}
                </Badge>
              </div>

              <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: '0.875rem', color: '#64748B', flexWrap: 'wrap' }}>
                {customer.taxCode && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <strong>MST:</strong> <code>{customer.taxCode}</code>
                  </span>
                )}
                {customer.industry && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Briefcase size={14} /> {customer.industry}
                  </span>
                )}
                {customer.location && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={14} /> {customer.location}
                  </span>
                )}
                {customer.website && (
                  <a
                    href={customer.website.startsWith('http') ? customer.website : `https://${customer.website}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#2563EB', textDecoration: 'none' }}
                  >
                    <Globe size={14} /> {customer.website} <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'flex', gap: 24, textAlign: 'right' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                Doanh thu định kỳ (ARR)
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669', marginTop: 2 }}>
                {formatCurrency(customer.totalContractValue || customer.dealValue || 0)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                Người liên hệ
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1E293B', marginTop: 2 }}>
                {contacts?.length || 0}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                Cơ hội bán hàng
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2563EB', marginTop: 2 }}>
                {deals?.length || 0}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', borderBottom: '2px solid #E2E8F0', gap: 24 }}>
        <button
          type="button"
          onClick={() => setActiveTab('info')}
          style={{
            padding: '10px 4px',
            fontSize: '0.9375rem',
            fontWeight: activeTab === 'info' ? 700 : 500,
            color: activeTab === 'info' ? '#2563EB' : '#64748B',
            border: 'none',
            borderBottom: activeTab === 'info' ? '2px solid #2563EB' : '2px solid transparent',
            marginBottom: -2,
            background: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Building2 size={16} /> 1. Thông Tin Chi Tiết & Cơ Cấu
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('deals')}
          style={{
            padding: '10px 4px',
            fontSize: '0.9375rem',
            fontWeight: activeTab === 'deals' ? 700 : 500,
            color: activeTab === 'deals' ? '#2563EB' : '#64748B',
            border: 'none',
            borderBottom: activeTab === 'deals' ? '2px solid #2563EB' : '2px solid transparent',
            marginBottom: -2,
            background: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <DollarSign size={16} /> 2. Cơ Hội & Hợp Đồng ({deals?.length || 0})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('activities')}
          style={{
            padding: '10px 4px',
            fontSize: '0.9375rem',
            fontWeight: activeTab === 'activities' ? 700 : 500,
            color: activeTab === 'activities' ? '#2563EB' : '#64748B',
            border: 'none',
            borderBottom: activeTab === 'activities' ? '2px solid #2563EB' : '2px solid transparent',
            marginBottom: -2,
            background: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Clock size={16} /> 3. Nhật Ký Hoạt Động ({activities?.length || 0})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('docs')}
          style={{
            padding: '10px 4px',
            fontSize: '0.9375rem',
            fontWeight: activeTab === 'docs' ? 700 : 500,
            color: activeTab === 'docs' ? '#2563EB' : '#64748B',
            border: 'none',
            borderBottom: activeTab === 'docs' ? '2px solid #2563EB' : '2px solid transparent',
            marginBottom: -2,
            background: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <FileText size={16} /> 4. Tài Liệu & Yêu Cầu Hỗ Trợ ({tickets?.length || 0})
        </button>
      </div>

      {/* Tab 1: Info */}
      {activeTab === 'info' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* General details */}
            <Card padding="md">
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>
                Thông tin doanh nghiệp
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Người đại diện:</span>
                  <strong>{customer.fullName || '—'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Mã số thuế (MST):</span>
                  <code>{customer.taxCode || '—'}</code>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Email liên hệ:</span>
                  <span>{customer.email || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Số điện thoại:</span>
                  <span>{customer.phone || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Địa chỉ:</span>
                  <span>{customer.location || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Tương tác gần nhất:</span>
                  <span>{customer.lastInteractionAt ? formatDate(customer.lastInteractionAt) : 'Chưa có'}</span>
                </div>
                {customer.notesSummary && (
                  <div style={{ marginTop: 8, padding: 10, backgroundColor: '#F8FAFC', borderRadius: 6 }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Ghi chú tổng hợp:</div>
                    <div style={{ marginTop: 2, color: '#334155' }}>{customer.notesSummary}</div>
                  </div>
                )}
              </div>
            </Card>

            {/* Corporate Tree */}
            <Card padding="md">
              <CorporateTree
                customerId={customer.id}
                onHierarchyUpdated={() => loadCustomer360(customer.id)}
              />
            </Card>
          </div>

          {/* Contact List Tab */}
          <Card padding="md">
            <ContactListTab
              customerId={customer.id}
              customerName={customer.company || customer.fullName}
            />
          </Card>
        </div>
      )}

      {/* Tab 2: Deals */}
      {activeTab === 'deals' && (
        <Card padding="md">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Cơ hội bán hàng liên kết ({deals?.length || 0})
            </h3>
          </div>

          {(!deals || deals.length === 0) ? (
            <div style={{ padding: 36, textAlign: 'center', color: '#94A3B8', fontStyle: 'italic' }}>
              Chưa có cơ hội bán hàng nào được ghi nhận cho khách hàng này.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600 }}>Tên cơ hội</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600 }}>Giai đoạn</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600 }}>Giá trị hợp đồng</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600 }}>Xác suất</th>
                </tr>
              </thead>
              <tbody>
                {deals.map((deal: any) => (
                  <tr key={deal.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0F172A' }}>
                      {deal.title}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <Badge tone="primary" size="sm">{deal.stage}</Badge>
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                      {formatCurrency(deal.value)}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      {deal.probability}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {/* Tab 3: Activities */}
      {activeTab === 'activities' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Quick add activity form */}
          <Card padding="md">
            <form onSubmit={handleAddActivity} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Ghi nhận tương tác mới
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 140px', gap: 10 }}>
                <select
                  value={newActivityType}
                  onChange={(e) => setNewActivityType(e.target.value as any)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: '1px solid #CBD5E1',
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="call">📞 Cuộc gọi</option>
                  <option value="meeting">🤝 Cuộc họp</option>
                  <option value="email">✉ Email</option>
                  <option value="note">📝 Ghi chú</option>
                </select>

                <input
                  type="text"
                  placeholder="Tiêu đề tương tác (ví dụ: Họp demo giải pháp, Gọi tư vấn gói dịch vụ...)"
                  value={newActivityTitle}
                  onChange={(e) => setNewActivityTitle(e.target.value)}
                  required
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #CBD5E1',
                    fontSize: '0.875rem',
                  }}
                />

                <Button
                  variant="primary"
                  type="submit"
                  disabled={isSubmittingActivity}
                  leftIcon={isSubmittingActivity ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                >
                  {isSubmittingActivity ? 'Đang lưu...' : 'Lưu'}
                </Button>
              </div>

              <textarea
                rows={2}
                placeholder="Nội dung tóm tắt buổi làm việc / cam kết tiếp theo..."
                value={newActivityDesc}
                onChange={(e) => setNewActivityDesc(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #CBD5E1',
                  fontSize: '0.875rem',
                }}
              />
            </form>
          </Card>

          {/* Activities list feed */}
          <Card padding="md">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>
              Dòng thời gian tương tác ({activities?.length || 0})
            </h3>
            {(!activities || activities.length === 0) ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#94A3B8', fontStyle: 'italic' }}>
                Chưa có nhật ký hoạt động nào được ghi nhận.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {activities.map((act: any) => (
                  <div
                    key={act.id}
                    style={{
                      padding: 12,
                      backgroundColor: '#F8FAFC',
                      borderRadius: 6,
                      border: '1px solid #E2E8F0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: '#1E293B', fontSize: '0.875rem' }}>
                        {act.type === 'call' ? '📞' : act.type === 'meeting' ? '🤝' : '📝'} {act.title}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        {formatDate(act.createdAt)}
                      </span>
                    </div>
                    {act.description && (
                      <p style={{ margin: 0, fontSize: '0.8125rem', color: '#475569' }}>
                        {act.description}
                      </p>
                    )}
                    {act.userName && (
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                        Thực hiện bởi: {act.userName}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Tab 4: Docs & Support Tickets */}
      {activeTab === 'docs' && (
        <Card padding="md">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Yêu cầu hỗ trợ kỹ thuật & sự cố ({tickets?.length || 0})
            </h3>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsTicketModalOpen(true)}
              leftIcon={<Plus size={14} />}
            >
              Mở quản lý phiếu hỗ trợ
            </Button>
          </div>

          {(!tickets || tickets.length === 0) ? (
            <div style={{ padding: 36, textAlign: 'center', color: '#94A3B8', fontStyle: 'italic' }}>
              Không có sự cố hoặc phiếu khiếu nại nào từ khách hàng này.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600 }}>Mã phiếu</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600 }}>Tiêu đề</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600 }}>Mức độ</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600 }}>Trạng thái</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600 }}>Hạn xử lý</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t: ISupportTicket) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <code>{t.ticketCode}</code>
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0F172A' }}>
                      {t.title}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '2px 8px',
                          borderRadius: 4,
                          backgroundColor: t.priority === 'urgent' ? '#FEE2E2' : '#F1F5F9',
                          color: t.priority === 'urgent' ? '#DC2626' : '#475569',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                        }}
                      >
                        {t.priority}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <Badge tone={t.status === 'resolved' || t.status === 'closed' ? 'success' : 'neutral'} size="sm">
                        {t.status}
                      </Badge>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748B' }}>
                      {t.dueDate ? formatDate(t.dueDate) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {/* Edit Customer Modal */}
      {isEditModalOpen && (
        <CustomerForm
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          customerToEdit={customer}
          onSuccess={() => {
            setIsEditModalOpen(false);
            loadCustomer360(customer.id);
          }}
        />
      )}

      {/* Support Ticket Modal */}
      {isTicketModalOpen && (
        <SupportTicketModal
          isOpen={isTicketModalOpen}
          onClose={() => setIsTicketModalOpen(false)}
          customerId={customer.id}
          customerName={customer.company || customer.fullName}
          riskFlag={customer.riskFlag}
          riskReason={customer.riskReason}
          onRiskUpdated={() => loadCustomer360(customer.id)}
        />
      )}

      {/* Merge Customer Modal */}
      {isMergeModalOpen && (
        <MergeCustomerModal
          isOpen={isMergeModalOpen}
          onClose={() => setIsMergeModalOpen(false)}
          primaryCustomer={customer}
          onMerged={(master) => {
            setIsMergeModalOpen(false);
            loadCustomer360(master.id);
          }}
        />
      )}
    </div>
  );
};
