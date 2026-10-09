import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  LifeBuoy,
  Loader2,
  Plus,
  ShieldAlert,
  X,
} from 'lucide-react';
import {
  ICreateSupportTicketDTO,
  ISupportTicket,
} from '../../interfaces/customer.interface';
import { customerService } from '../../services/customerService';
import { formatDate } from '../../utils/formatters';
import { Button, Modal } from '../common';
import { RiskBadge } from './RiskBadge';
import { showGlobalToast } from '../../context/ToastContext';

export interface ISupportTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
  riskFlag?: boolean;
  riskReason?: string | null;
  onRiskUpdated?: () => void;
}

export const SupportTicketModal: React.FC<ISupportTicketModalProps> = ({
  isOpen,
  onClose,
  customerId,
  customerName,
  riskFlag,
  riskReason,
  onRiskUpdated,
}) => {
  const [tickets, setTickets] = useState<ISupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [scanResultNotice, setScanResultNotice] = useState<string | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('high');
  const [formDueDate, setFormDueDate] = useState(
    new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && customerId) {
      loadTickets();
    }
  }, [isOpen, customerId]);

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const data = await customerService.getSupportTickets(customerId);
      setTickets(data);
    } catch (err) {
      console.error('Lỗi tải danh sách yêu cầu hỗ trợ:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Vui lòng nhập tiêu đề yêu cầu');
      showGlobalToast('Vui lòng nhập tiêu đề yêu cầu', 'warning');
      return;
    }

    setIsCreating(true);
    setFormError(null);

    try {
      const payload: ICreateSupportTicketDTO = {
        title: formTitle.trim(),
        description: formDescription.trim(),
        priority: formPriority,
        dueDate: formDueDate ? new Date(formDueDate).toISOString() : undefined,
      };

      await customerService.createSupportTicket(customerId, payload);
      showGlobalToast(`Đã tạo yêu cầu hỗ trợ "${formTitle.trim()}" thành công!`, 'success');
      setShowCreateForm(false);
      setFormTitle('');
      setFormDescription('');
      loadTickets();
      if (onRiskUpdated) onRiskUpdated();
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Lỗi khi tạo yêu cầu hỗ trợ';
      setFormError(errorMsg);
      showGlobalToast(errorMsg, 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: ISupportTicket['status']) => {
    try {
      await customerService.updateSupportTicket(ticketId, { status: newStatus });
      const statusLabel =
        newStatus === 'resolved'
          ? 'Đã giải quyết'
          : newStatus === 'in_progress'
          ? 'Đang xử lý'
          : newStatus === 'closed'
          ? 'Đã đóng'
          : 'Mới tiếp nhận';
      showGlobalToast(`Đã cập nhật trạng thái phiếu hỗ trợ: ${statusLabel}`, 'success');
      loadTickets();
      if (onRiskUpdated) onRiskUpdated();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.detail || 'Lỗi cập nhật trạng thái phiếu hỗ trợ';
      showGlobalToast(errorMsg, 'error');
      console.error('Lỗi cập nhật trạng thái phiếu hỗ trợ:', err);
    }
  };

  const handleScanRisks = async () => {
    setIsScanning(true);
    setScanResultNotice(null);
    try {
      const result = await customerService.scanRisks(2);
      const msg = `Quét xong hệ thống: Quét ${result.scannedCount || 0} khách hàng, phát hiện ${result.flaggedCount || 0} cờ rủi ro.`;
      setScanResultNotice(msg);
      showGlobalToast(msg, 'info');
      if (onRiskUpdated) onRiskUpdated();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.detail || 'Lỗi quét cờ rủi ro';
      showGlobalToast(errorMsg, 'error');
      console.error('Lỗi quét cờ rủi ro:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const isOverdue = (ticket: ISupportTicket) => {
    if (ticket.isOverdue) return true;
    if (!ticket.dueDate || ticket.status === 'resolved' || ticket.status === 'closed') {
      return false;
    }
    return new Date(ticket.dueDate) < new Date();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Yêu Cầu Hỗ Trợ & Cờ Rủi Ro"
      subtitle={`Khách hàng: ${customerName}`}
      maxWidth="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleScanRisks}
            disabled={isScanning}
            leftIcon={isScanning ? <Loader2 size={14} className="animate-spin" /> : <ShieldAlert size={14} />}
          >
            {isScanning ? 'Đang quét cờ rủi ro...' : 'Quét cờ rủi ro tự động'}
          </Button>

          <Button variant="secondary" onClick={onClose}>
            Đóng
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Risk Banner */}
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            backgroundColor: riskFlag ? '#FEF2F2' : '#F0FDF4',
            border: `1px solid ${riskFlag ? '#FCA5A5' : '#BBF7D0'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {riskFlag ? (
              <AlertTriangle size={24} color="#DC2626" />
            ) : (
              <CheckCircle2 size={24} color="#16A34A" />
            )}
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: riskFlag ? '#991B1B' : '#166534' }}>
                {riskFlag ? 'CẢNH BÁO: KHÁCH HÀNG ĐANG CÓ CỜ RỦI RO (AT RISK)' : 'Khách hàng an toàn (Không có cờ rủi ro)'}
              </div>
              <div style={{ fontSize: '0.8125rem', color: riskFlag ? '#B91C1C' : '#15803D' }}>
                {riskReason || (riskFlag ? 'Phát hiện yêu cầu hỗ trợ quá hạn xử lý' : 'Tất cả các phiếu hỗ trợ đều đang được xử lý đúng hạn')}
              </div>
            </div>
          </div>

          <RiskBadge isRisk={Boolean(riskFlag)} reason={riskReason || undefined} />
        </div>

        {scanResultNotice && (
          <div style={{ padding: '8px 12px', backgroundColor: '#EFF6FF', borderRadius: 6, fontSize: '0.8125rem', color: '#1D4ED8' }}>
            ℹ {scanResultNotice}
          </div>
        )}

        {/* Header action */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 6 }}>
            <LifeBuoy size={18} color="#2563EB" /> Danh sách phiếu hỗ trợ ({tickets.length})
          </h3>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateForm(!showCreateForm)}
            leftIcon={showCreateForm ? <X size={14} /> : <Plus size={14} />}
          >
            {showCreateForm ? 'Hủy thêm mới' : 'Tạo phiếu hỗ trợ'}
          </Button>
        </div>

        {/* Create ticket form */}
        {showCreateForm && (
          <form
            onSubmit={handleCreateTicket}
            style={{
              padding: 16,
              backgroundColor: '#F8FAFC',
              borderRadius: 8,
              border: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', margin: 0 }}>
              Thêm Phiếu Hỗ Trợ Mới
            </h4>

            {formError && (
              <div style={{ color: '#DC2626', fontSize: '0.8125rem', fontWeight: 500 }}>
                {formError}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: 4 }}>
                Tiêu đề vấn đề / khiếu nại *
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Lỗi tích hợp hóa đơn điện tử..."
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid #CBD5E1',
                  fontSize: '0.8125rem',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: 4 }}>
                  Mức độ ưu tiên
                </label>
                <select
                  value={formPriority}
                  onChange={(e) => setFormPriority(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: '1px solid #CBD5E1',
                    fontSize: '0.8125rem',
                  }}
                >
                  <option value="low">Thấp (Low)</option>
                  <option value="medium">Trung bình (Medium)</option>
                  <option value="high">Cao (High)</option>
                  <option value="urgent">Khẩn cấp (Urgent - Có thể gắn cờ rủi ro)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: 4 }}>
                  Hạn xử lý (Due date)
                </label>
                <input
                  type="date"
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: '1px solid #CBD5E1',
                    fontSize: '0.8125rem',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: 4 }}>
                Chi tiết nội dung yêu cầu
              </label>
              <textarea
                rows={2}
                placeholder="Mô tả sự cố hoặc yêu cầu của khách hàng..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid #CBD5E1',
                  fontSize: '0.8125rem',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button variant="secondary" size="sm" type="button" onClick={() => setShowCreateForm(false)}>
                Hủy
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={isCreating}>
                {isCreating ? 'Đang lưu...' : 'Lưu yêu cầu'}
              </Button>
            </div>
          </form>
        )}

        {/* Tickets List */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 24, color: '#64748B' }}>
            <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 6px' }} />
            Đang tải danh sách yêu cầu...
          </div>
        ) : tickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#94A3B8', fontStyle: 'italic' }}>
            Khách hàng này hiện chưa có phiếu yêu cầu hỗ trợ nào.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 320, overflowY: 'auto' }}>
            {tickets.map((t) => {
              const overdue = isOverdue(t);
              return (
                <div
                  key={t.id}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    border: `1px solid ${overdue ? '#FCA5A5' : '#E2E8F0'}`,
                    backgroundColor: overdue ? '#FFF5F5' : '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <code style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>
                        {t.ticketCode}
                      </code>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1E293B' }}>
                        {t.title}
                      </span>
                      {overdue && (
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            padding: '1px 6px',
                            backgroundColor: '#FEE2E2',
                            color: '#DC2626',
                            borderRadius: 4,
                          }}
                        >
                          QUÁ HẠN XỬ LÝ
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.75rem', color: '#64748B' }}>
                      <span>Mức độ: <strong style={{ textTransform: 'uppercase' }}>{t.priority}</strong></span>
                      {t.dueDate && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} /> Hạn: {formatDate(t.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status changer */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <select
                      value={t.status}
                      onChange={(e) => handleUpdateStatus(t.id, e.target.value as any)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '0.75rem',
                        borderRadius: 4,
                        border: '1px solid #CBD5E1',
                        backgroundColor:
                          t.status === 'resolved' || t.status === 'closed' ? '#F0FDF4' : '#FFFFFF',
                        color:
                          t.status === 'resolved' || t.status === 'closed' ? '#166534' : '#1E293B',
                        fontWeight: 600,
                      }}
                    >
                      <option value="open">Mở (Open)</option>
                      <option value="in_progress">Đang xử lý</option>
                      <option value="resolved">Đã giải quyết</option>
                      <option value="closed">Đóng phiếu</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};
