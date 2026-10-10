import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  AlertTriangle,
  GitMerge,
  Loader2,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { ICustomer } from '../interfaces';
import { customerService } from '../services/customerService';
import { formatCurrency } from '../utils/formatters';
import { RiskBadge } from '../components/customer/RiskBadge';
import { showGlobalToast } from '../context/ToastContext';
import styles from './CustomerCreatePage.module.css';

export const CustomerMergePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPrimaryId = searchParams.get('primaryId') || '';

  const [candidateCustomers, setCandidateCustomers] = useState<ICustomer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrimaryId, setSelectedPrimaryId] = useState<string>(initialPrimaryId);
  const [selectedSecondaryId, setSelectedSecondaryId] = useState<string>('');
  const [primaryCustomer, setPrimaryCustomer] = useState<ICustomer | null>(null);
  const [secondaryCustomer, setSecondaryCustomer] = useState<ICustomer | null>(null);
  const [masterSide, setMasterSide] = useState<'primary' | 'secondary'>('primary');
  const [reason, setReason] = useState('Gộp tài khoản trùng lặp dữ liệu');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mergeSuccessCustomer, setMergeSuccessCustomer] = useState<ICustomer | null>(null);

  // Fetch all candidate customers
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const res = await customerService.getCustomers({
          search: searchQuery.trim() || undefined,
          limit: 100,
        });
        setCandidateCustomers(res);
      } catch (err: any) {
        console.error('Lỗi tải danh sách khách hàng:', err);
      }
    };

    const timer = setTimeout(fetchCandidates, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load primary customer if ID is given
  useEffect(() => {
    if (!selectedPrimaryId) {
      setPrimaryCustomer(null);
      return;
    }
    const found = candidateCustomers.find((c) => c.id === selectedPrimaryId);
    if (found) {
      setPrimaryCustomer(found);
    } else {
      customerService
        .getCustomerById(selectedPrimaryId)
        .then((res) => setPrimaryCustomer(res))
        .catch((err) => console.error('Lỗi tải thông tin khách hàng chính:', err));
    }
  }, [selectedPrimaryId, candidateCustomers]);

  // Load secondary customer
  useEffect(() => {
    if (!selectedSecondaryId) {
      setSecondaryCustomer(null);
      return;
    }
    const found = candidateCustomers.find((c) => c.id === selectedSecondaryId);
    if (found) {
      setSecondaryCustomer(found);
    } else {
      customerService
        .getCustomerById(selectedSecondaryId)
        .then((res) => setSecondaryCustomer(res))
        .catch((err) => console.error('Lỗi tải thông tin khách hàng phụ:', err));
    }
  }, [selectedSecondaryId, candidateCustomers]);

  const masterCustomer = masterSide === 'primary' ? primaryCustomer : secondaryCustomer;
  const duplicateCustomer = masterSide === 'primary' ? secondaryCustomer : primaryCustomer;

  const handleMerge = async () => {
    if (!masterCustomer || !duplicateCustomer) {
      setErrorMessage('Vui lòng chọn đầy đủ 2 khách hàng để tiến hành so sánh và gộp.');
      showGlobalToast('Vui lòng chọn 2 khách hàng để so sánh và gộp', 'warning');
      return;
    }

    if (masterCustomer.id === duplicateCustomer.id) {
      setErrorMessage('Không thể gộp một khách hàng vào chính nó.');
      showGlobalToast('Không thể gộp một khách hàng vào chính nó', 'warning');
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

      setMergeSuccessCustomer(mergedResult);
      const msg = `Đã gộp hồ sơ trùng thành công vào khách hàng "${mergedResult.company || mergedResult.fullName}".`;
      showGlobalToast(msg, 'success');
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Lỗi khi thực hiện gộp khách hàng';
      const text = typeof msg === 'string' ? msg : JSON.stringify(msg);
      setErrorMessage(text);
      showGlobalToast(text, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <button
        type="button"
        onClick={() => navigate('/customers')}
        className={styles.backBtn}
        aria-label="Quay lại danh sách khách hàng"
      >
        <ArrowLeft size={16} />
        <span>Trở về danh sách khách hàng</span>
      </button>

      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              backgroundColor: '#EFF6FF',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <GitMerge size={24} />
          </div>
          <div>
            <h1 className={styles.title}>Gộp Hồ Sơ Khách Hàng Trùng Lặp</h1>
            <p className={styles.subtitle}>
              Hợp nhất dữ liệu giữa hai hồ sơ khách hàng doanh nghiệp, chuyển toàn bộ Người liên hệ, Cơ hội và Hoạt động sang hồ sơ chính
            </p>
          </div>
        </div>
      </header>

      {mergeSuccessCustomer ? (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            border: '1px solid #BBF7D0',
            padding: 32,
            textAlign: 'center',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: '#DCFCE7',
              color: '#16A34A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <CheckCircle2 size={32} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#166534', marginBottom: 8 }}>
            Gộp hồ sơ khách hàng thành công!
          </h2>
          <p style={{ color: '#4B5563', fontSize: '0.95rem', maxWidth: 600, margin: '0 auto 24px' }}>
            Hồ sơ chính hiện tại là <strong>{mergeSuccessCustomer.company || mergeSuccessCustomer.fullName}</strong>. Toàn bộ cơ hội kinh doanh, người liên hệ và lịch sử tương tác đã được tổng hợp lại.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={() => navigate(`/customers/${mergeSuccessCustomer.id}`)}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Xem hồ sơ Customer 360°
            </button>
            <button
              type="button"
              onClick={() => {
                setMergeSuccessCustomer(null);
                setSelectedSecondaryId('');
              }}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                backgroundColor: '#F3F4F6',
                color: '#374151',
                fontWeight: 600,
                border: '1px solid #D1D5DB',
                cursor: 'pointer',
              }}
            >
              Tiếp tục gộp hồ sơ khác
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {errorMessage && (
            <div
              style={{
                padding: '14px 18px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FCA5A5',
                borderRadius: 8,
                color: '#B91C1C',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <AlertTriangle size={20} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Card chọn khách hàng */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              border: '1px solid #E2E8F0',
              padding: 24,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            }}
          >
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#1E293B', marginBottom: 16 }}>
              1. Chọn hai hồ sơ cần so sánh và gộp
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              {/* Cột chọn khách hàng 1 */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Hồ sơ khách hàng thứ nhất (Bên trái):
                </label>
                <select
                  value={selectedPrimaryId}
                  onChange={(e) => setSelectedPrimaryId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #CBD5E1',
                    fontSize: '0.875rem',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <option value="">-- Chọn khách hàng --</option>
                  {candidateCustomers.map((c) => (
                    <option key={c.id} value={c.id} disabled={c.id === selectedSecondaryId}>
                      {c.company || c.fullName} {c.taxCode ? `(MST: ${c.taxCode})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cột chọn khách hàng 2 */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Hồ sơ khách hàng thứ hai (Bên phải):
                </label>
                <select
                  value={selectedSecondaryId}
                  onChange={(e) => setSelectedSecondaryId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #CBD5E1',
                    fontSize: '0.875rem',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <option value="">-- Chọn khách hàng trùng lặp --</option>
                  {candidateCustomers.map((c) => (
                    <option key={c.id} value={c.id} disabled={c.id === selectedPrimaryId}>
                      {c.company || c.fullName} {c.taxCode ? `(MST: ${c.taxCode})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tìm kiếm nhanh */}
            <div style={{ marginTop: 16 }}>
              <div style={{ position: 'relative', maxWidth: 450 }}>
                <input
                  type="text"
                  placeholder="Lọc danh sách theo tên, MST, SĐT..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    borderRadius: 6,
                    border: '1px solid #E2E8F0',
                    fontSize: '0.85rem',
                  }}
                />
                <Search
                  size={16}
                  style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
                />
              </div>
            </div>
          </div>

          {/* Master Selector Banner */}
          {primaryCustomer && secondaryCustomer && (
            <div
              style={{
                backgroundColor: '#EFF6FF',
                borderRadius: 10,
                border: '1px solid #93C5FD',
                padding: '16px 20px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1E40AF' }}>
                  2. Chọn hồ sơ được giữ lại làm HỒ SƠ CHÍNH (MASTER):
                </span>
              </div>
              <div style={{ display: 'flex', gap: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input
                    type="radio"
                    name="masterSide"
                    checked={masterSide === 'primary'}
                    onChange={() => setMasterSide('primary')}
                    style={{ cursor: 'pointer', width: 16, height: 16 }}
                  />
                  <span style={{ fontWeight: masterSide === 'primary' ? 700 : 500, color: '#1E3A8A' }}>
                    Bên trái ({primaryCustomer.company || primaryCustomer.fullName})
                  </span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input
                    type="radio"
                    name="masterSide"
                    checked={masterSide === 'secondary'}
                    onChange={() => setMasterSide('secondary')}
                    style={{ cursor: 'pointer', width: 16, height: 16 }}
                  />
                  <span style={{ fontWeight: masterSide === 'secondary' ? 700 : 500, color: '#1E3A8A' }}>
                    Bên phải ({secondaryCustomer.company || secondaryCustomer.fullName})
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* So sánh hai bên */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
            {/* Cột 1 */}
            <div
              style={{
                borderRadius: 12,
                border: `2px solid ${masterSide === 'primary' ? '#2563EB' : '#E2E8F0'}`,
                backgroundColor: masterSide === 'primary' ? '#F8FAFC' : '#FFFFFF',
                padding: 24,
                boxShadow: masterSide === 'primary' ? '0 4px 12px rgba(37, 99, 235, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.05)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '4px 10px',
                    borderRadius: 6,
                    backgroundColor: masterSide === 'primary' ? '#DBEAFE' : '#F1F5F9',
                    color: masterSide === 'primary' ? '#1D4ED8' : '#64748B',
                  }}
                >
                  {masterSide === 'primary' ? '★ HỒ SƠ CHÍNH (MASTER - GIỮ LẠI)' : 'HỒ SƠ PHỤ (SẼ XÓA MỀM)'}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Bên trái</span>
              </div>

              {primaryCustomer ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'block' }}>Tên Doanh Nghiệp:</span>
                    <strong style={{ fontSize: '1.15rem', color: '#0F172A' }}>
                      {primaryCustomer.company || primaryCustomer.fullName}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'block' }}>Mã số thuế (MST):</span>
                    <span
                      style={{
                        display: 'inline-block',
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        backgroundColor: '#F1F5F9',
                        padding: '2px 8px',
                        borderRadius: 4,
                        color: '#0F172A',
                      }}
                    >
                      {primaryCustomer.taxCode || '(Chưa có MST)'}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'block' }}>Người đại diện:</span>
                      <span style={{ fontWeight: 500 }}>{primaryCustomer.fullName || '—'}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'block' }}>Số điện thoại:</span>
                      <span style={{ fontWeight: 500 }}>{primaryCustomer.phone || '—'}</span>
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'block' }}>Email:</span>
                    <span style={{ fontWeight: 500 }}>{primaryCustomer.email || '—'}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'block' }}>Lĩnh vực / Ngành:</span>
                      <span>{primaryCustomer.industry || '—'}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'block' }}>Phân hạng Tier:</span>
                      <span style={{ fontWeight: 600, color: '#2563EB' }}>{primaryCustomer.tier || 'Startup'}</span>
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'block' }}>Tổng giá trị hợp đồng (ARR):</span>
                    <strong style={{ fontSize: '1.1rem', color: '#059669' }}>
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
                <div style={{ color: '#94A3B8', fontStyle: 'italic', padding: '40px 20px', textAlign: 'center' }}>
                  Vui lòng chọn hồ sơ thứ nhất ở bảng bên trên
                </div>
              )}
            </div>

            {/* Cột 2 */}
            <div
              style={{
                borderRadius: 12,
                border: `2px solid ${masterSide === 'secondary' ? '#2563EB' : '#E2E8F0'}`,
                backgroundColor: masterSide === 'secondary' ? '#F8FAFC' : '#FFFFFF',
                padding: 24,
                boxShadow: masterSide === 'secondary' ? '0 4px 12px rgba(37, 99, 235, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '4px 10px',
                    borderRadius: 6,
                    backgroundColor: masterSide === 'secondary' ? '#DBEAFE' : '#F1F5F9',
                    color: masterSide === 'secondary' ? '#1D4ED8' : '#64748B',
                  }}
                >
                  {masterSide === 'secondary' ? '★ HỒ SƠ CHÍNH (MASTER - GIỮ LẠI)' : 'HỒ SƠ PHỤ (SẼ XÓA MỀM)'}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Bên phải</span>
              </div>

              {secondaryCustomer ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'block' }}>Tên Doanh Nghiệp:</span>
                    <strong style={{ fontSize: '1.15rem', color: '#0F172A' }}>
                      {secondaryCustomer.company || secondaryCustomer.fullName}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'block' }}>Mã số thuế (MST):</span>
                    <span
                      style={{
                        display: 'inline-block',
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        backgroundColor: '#F1F5F9',
                        padding: '2px 8px',
                        borderRadius: 4,
                        color: '#0F172A',
                      }}
                    >
                      {secondaryCustomer.taxCode || '(Chưa có MST)'}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'block' }}>Người đại diện:</span>
                      <span style={{ fontWeight: 500 }}>{secondaryCustomer.fullName || '—'}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'block' }}>Số điện thoại:</span>
                      <span style={{ fontWeight: 500 }}>{secondaryCustomer.phone || '—'}</span>
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'block' }}>Email:</span>
                    <span style={{ fontWeight: 500 }}>{secondaryCustomer.email || '—'}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'block' }}>Lĩnh vực / Ngành:</span>
                      <span>{secondaryCustomer.industry || '—'}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'block' }}>Phân hạng Tier:</span>
                      <span style={{ fontWeight: 600, color: '#2563EB' }}>{secondaryCustomer.tier || 'Startup'}</span>
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'block' }}>Tổng giá trị hợp đồng (ARR):</span>
                    <strong style={{ fontSize: '1.1rem', color: '#059669' }}>
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
                <div style={{ color: '#94A3B8', fontStyle: 'italic', padding: '40px 20px', textAlign: 'center' }}>
                  Vui lòng chọn hồ sơ thứ hai ở bảng bên trên
                </div>
              )}
            </div>
          </div>

          {/* Hộp ghi chú quan trọng */}
          <div
            style={{
              padding: 16,
              backgroundColor: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: 10,
              fontSize: '0.875rem',
              color: '#92400E',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong style={{ display: 'block', marginBottom: 4 }}>Quy tắc bảo toàn dữ liệu khi hợp nhất:</strong>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
                <li>Tất cả Người liên hệ (Contacts) thuộc hồ sơ phụ sẽ được tự động chuyển giao sang hồ sơ chính.</li>
                <li>Tất cả Cơ hội bán hàng (Deals), Phiếu hỗ trợ (Tickets), và Lịch sử tương tác (Activities) được di dời toàn vẹn.</li>
                <li>Tổng doanh thu / ARR sẽ được tự động cộng dồn vào hồ sơ chính.</li>
                <li>Hồ sơ phụ sẽ được <strong>xóa mềm (soft-deleted)</strong> để giữ toàn vẹn quan hệ cơ sở dữ liệu và giải phóng MST.</li>
              </ul>
            </div>
          </div>

          {/* Lý do gộp */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              border: '1px solid #E2E8F0',
              padding: 24,
            }}
          >
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Lý do hợp nhất hồ sơ (lưu nhật ký Audit Log):
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: Hai công ty con cùng MST, nhân viên kinh doanh nhập trùng lặp..."
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: '0.9rem',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button
                type="button"
                onClick={() => navigate('/customers')}
                disabled={isSubmitting}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  border: '1px solid #CBD5E1',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleMerge}
                disabled={isSubmitting || !primaryCustomer || !secondaryCustomer}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 24px',
                  borderRadius: 8,
                  backgroundColor: !primaryCustomer || !secondaryCustomer ? '#94A3B8' : '#2563EB',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 600,
                  cursor: !primaryCustomer || !secondaryCustomer || isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Đang tiến hành hợp nhất...</span>
                  </>
                ) : (
                  <>
                    <GitMerge size={16} />
                    <span>Xác nhận gộp hồ sơ</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
