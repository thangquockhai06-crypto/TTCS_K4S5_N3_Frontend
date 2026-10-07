import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  GitMerge,
  Loader2,
  Search,
} from 'lucide-react';
import { ICustomer } from '../../interfaces';
import { customerService } from '../../services/customerService';
import { formatCurrency } from '../../utils/formatters';
import { Button, Modal } from '../common';
import { RiskBadge } from './RiskBadge';

export interface IMergeCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  primaryCustomer?: ICustomer | null;
  onMerged?: (masterCustomer: ICustomer) => void;
}

export const MergeCustomerModal: React.FC<IMergeCustomerModalProps> = ({
  isOpen,
  onClose,
  primaryCustomer,
  onMerged,
}) => {
  const [candidateCustomers, setCandidateCustomers] = useState<ICustomer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSecondaryId, setSelectedSecondaryId] = useState<string>('');
  const [masterSide, setMasterSide] = useState<'primary' | 'secondary'>('primary');
  const [reason, setReason] = useState('Gộp tài khoản trùng lặp dữ liệu');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedSecondaryId('');
      setErrorMessage(null);
      return;
    }

    const fetchCandidates = async () => {
      try {
        const res = await customerService.getCustomers({
          search: searchQuery.trim() || undefined,
          limit: 50,
        });
        const items = res.filter((c) => c.id !== primaryCustomer?.id);
        setCandidateCustomers(items);
      } catch (err: any) {
        console.error('Lỗi tải danh sách khách hàng gộp:', err);
      }
    };

    const timer = setTimeout(fetchCandidates, 300);
    return () => clearTimeout(timer);
  }, [isOpen, searchQuery, primaryCustomer?.id]);

  const secondaryCustomer = candidateCustomers.find((c) => c.id === selectedSecondaryId);

  const masterCustomer = masterSide === 'primary' ? primaryCustomer : secondaryCustomer;
  const duplicateCustomer = masterSide === 'primary' ? secondaryCustomer : primaryCustomer;

  const handleMerge = async () => {
    if (!masterCustomer || !duplicateCustomer) {
      setErrorMessage('Vui lòng chọn khách hàng thứ hai để tiến hành so sánh và gộp.');
      return;
    }

    if (masterCustomer.id === duplicateCustomer.id) {
      setErrorMessage('Không thể gộp một khách hàng vào chính nó.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const mergedResult = await customerService.mergeCustomers(
        masterCustomer.id,
        duplicateCustomer.id,
        { reason: reason.trim() }
      );

      if (onMerged) {
        onMerged(mergedResult);
      }
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Lỗi khi thực hiện gộp khách hàng';
      setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gộp Khách Hàng Trùng Lặp (S3-04)"
      subtitle="Chuyển toàn bộ Người liên hệ, Cơ hội bán hàng, và Hoạt động sang Khách hàng chính"
      maxWidth="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Hủy bỏ
          </Button>
          <Button
            variant="primary"
            leftIcon={isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <GitMerge size={16} />}
            onClick={handleMerge}
            disabled={isSubmitting || !masterCustomer || !duplicateCustomer}
          >
            {isSubmitting ? 'Đang thực hiện gộp...' : 'Xác nhận gộp hồ sơ'}
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {errorMessage && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: 8,
              color: '#B91C1C',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <AlertTriangle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Search for candidate customer */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6 }}>
            Chọn khách hàng trùng lặp để gộp cùng:
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                placeholder="Tìm theo tên doanh nghiệp, MST, số điện thoại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  borderRadius: 6,
                  border: '1px solid #D1D5DB',
                  fontSize: '0.875rem',
                }}
              />
              <Search
                size={16}
                style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }}
              />
            </div>
            <select
              value={selectedSecondaryId}
              onChange={(e) => setSelectedSecondaryId(e.target.value)}
              style={{
                maxWidth: 280,
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid #D1D5DB',
                fontSize: '0.875rem',
              }}
            >
              <option value="">-- Chọn khách hàng --</option>
              {candidateCustomers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company || c.fullName} {c.taxCode ? `(${c.taxCode})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Master selector toggle */}
        {primaryCustomer && secondaryCustomer && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#EFF6FF',
              borderRadius: 8,
              border: '1px solid #BFDBFE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '0.875rem', color: '#1E40AF', fontWeight: 500 }}>
              Chọn bên giữ làm <strong>HỒ SƠ GỐC (MASTER)</strong>:
            </span>
            <div style={{ display: 'flex', gap: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.875rem' }}>
                <input
                  type="radio"
                  name="masterSide"
                  checked={masterSide === 'primary'}
                  onChange={() => setMasterSide('primary')}
                />
                <strong>Bên trái ({primaryCustomer.company || primaryCustomer.fullName})</strong>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.875rem' }}>
                <input
                  type="radio"
                  name="masterSide"
                  checked={masterSide === 'secondary'}
                  onChange={() => setMasterSide('secondary')}
                />
                <strong>Bên phải ({secondaryCustomer.company || secondaryCustomer.fullName})</strong>
              </label>
            </div>
          </div>
        )}

        {/* Side-by-side comparison */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Card Left */}
          <div
            style={{
              padding: 16,
              borderRadius: 8,
              border: `2px solid ${masterSide === 'primary' ? '#2563EB' : '#E5E7EB'}`,
              backgroundColor: masterSide === 'primary' ? '#F8FAFC' : '#FFFFFF',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: 4,
                  backgroundColor: masterSide === 'primary' ? '#DBEAFE' : '#F3F4F6',
                  color: masterSide === 'primary' ? '#1D4ED8' : '#4B5563',
                }}
              >
                {masterSide === 'primary' ? 'HỒ SƠ CHÍNH (GIỮ LẠI)' : 'HỒ SƠ PHỤ (SẼ XÓA MỀM)'}
              </span>
            </div>

            {primaryCustomer ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.875rem' }}>
                <div>
                  <div style={{ color: '#6B7280', fontSize: '0.75rem' }}>Tên Doanh nghiệp:</div>
                  <strong style={{ fontSize: '1rem', color: '#111827' }}>
                    {primaryCustomer.company || primaryCustomer.fullName}
                  </strong>
                </div>
                <div>
                  <div style={{ color: '#6B7280', fontSize: '0.75rem' }}>Mã số thuế (MST):</div>
                  <code>{primaryCustomer.taxCode || '(Chưa có MST)'}</code>
                </div>
                <div>
                  <div style={{ color: '#6B7280', fontSize: '0.75rem' }}>Email / Điện thoại:</div>
                  <div>{primaryCustomer.email || '—'} / {primaryCustomer.phone || '—'}</div>
                </div>
                <div>
                  <div style={{ color: '#6B7280', fontSize: '0.75rem' }}>Ngành nghề / Phân hạng:</div>
                  <div>{primaryCustomer.industry || '—'} | Tier: {primaryCustomer.tier || 'Startup'}</div>
                </div>
                <div>
                  <div style={{ color: '#6B7280', fontSize: '0.75rem' }}>Tổng giá trị hợp đồng (ARR):</div>
                  <strong style={{ color: '#059669' }}>
                    {formatCurrency(primaryCustomer.totalContractValue || primaryCustomer.dealValue || 0)}
                  </strong>
                </div>
                {primaryCustomer.riskFlag && (
                  <div>
                    <RiskBadge isRisk={true} reason={primaryCustomer.riskReason} />
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: '#9CA3AF', fontStyle: 'italic', padding: 20, textAlign: 'center' }}>
                Chưa chọn khách hàng gốc
              </div>
            )}
          </div>

          {/* Card Right */}
          <div
            style={{
              padding: 16,
              borderRadius: 8,
              border: `2px solid ${masterSide === 'secondary' ? '#2563EB' : '#E5E7EB'}`,
              backgroundColor: masterSide === 'secondary' ? '#F8FAFC' : '#FFFFFF',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: 4,
                  backgroundColor: masterSide === 'secondary' ? '#DBEAFE' : '#F3F4F6',
                  color: masterSide === 'secondary' ? '#1D4ED8' : '#4B5563',
                }}
              >
                {masterSide === 'secondary' ? 'HỒ SƠ CHÍNH (GIỮ LẠI)' : 'HỒ SƠ PHỤ (SẼ XÓA MỀM)'}
              </span>
            </div>

            {secondaryCustomer ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.875rem' }}>
                <div>
                  <div style={{ color: '#6B7280', fontSize: '0.75rem' }}>Tên Doanh nghiệp:</div>
                  <strong style={{ fontSize: '1rem', color: '#111827' }}>
                    {secondaryCustomer.company || secondaryCustomer.fullName}
                  </strong>
                </div>
                <div>
                  <div style={{ color: '#6B7280', fontSize: '0.75rem' }}>Mã số thuế (MST):</div>
                  <code>{secondaryCustomer.taxCode || '(Chưa có MST)'}</code>
                </div>
                <div>
                  <div style={{ color: '#6B7280', fontSize: '0.75rem' }}>Email / Điện thoại:</div>
                  <div>{secondaryCustomer.email || '—'} / {secondaryCustomer.phone || '—'}</div>
                </div>
                <div>
                  <div style={{ color: '#6B7280', fontSize: '0.75rem' }}>Ngành nghề / Phân hạng:</div>
                  <div>{secondaryCustomer.industry || '—'} | Tier: {secondaryCustomer.tier || 'Startup'}</div>
                </div>
                <div>
                  <div style={{ color: '#6B7280', fontSize: '0.75rem' }}>Tổng giá trị hợp đồng (ARR):</div>
                  <strong style={{ color: '#059669' }}>
                    {formatCurrency(secondaryCustomer.totalContractValue || secondaryCustomer.dealValue || 0)}
                  </strong>
                </div>
                {secondaryCustomer.riskFlag && (
                  <div>
                    <RiskBadge isRisk={true} reason={secondaryCustomer.riskReason} />
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: '#9CA3AF', fontStyle: 'italic', padding: 20, textAlign: 'center' }}>
                Vui lòng chọn khách hàng trùng khớp ở trên để so sánh
              </div>
            )}
          </div>
        </div>

        {/* Notice */}
        <div
          style={{
            padding: 12,
            backgroundColor: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderRadius: 6,
            fontSize: '0.8125rem',
            color: '#92400E',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
          }}
        >
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong>Lưu ý quan trọng khi gộp hồ sơ:</strong>
            <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
              <li>Tất cả Người liên hệ (Contacts) của hồ sơ phụ sẽ được chuyển sang hồ sơ chính.</li>
              <li>Tất cả Cơ hội bán hàng (Deals), Phiếu hỗ trợ (Tickets), Nhật ký tương tác (Activities) sẽ được chuyển toàn vẹn.</li>
              <li>Tổng giá trị hợp đồng (ARR) sẽ được cộng dồn vào hồ sơ chính.</li>
              <li>Hồ sơ phụ sẽ được <strong>xóa mềm (soft-delete)</strong> để tránh trùng lặp MST trong hệ thống.</li>
            </ul>
          </div>
        </div>

        {/* Reason input */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: 4 }}>
            Lý do gộp (ghi nhận nhật ký kiểm toán):
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ví dụ: Hai chi nhánh cùng MST, nhập trùng lặp từ nhân viên cũ..."
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #D1D5DB',
              fontSize: '0.875rem',
            }}
          />
        </div>
      </div>
    </Modal>
  );
};
