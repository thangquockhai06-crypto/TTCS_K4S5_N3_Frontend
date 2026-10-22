import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Printer,
  Calendar,
  X,
  ExternalLink,
} from 'lucide-react';
import { IContract, IContractRenewalDTO } from '../interfaces/contract.interface';
import { contractService } from '../services/contractService';
import { formatVndCurrency } from '../utils/formatters';
import { Button, Modal, Badge, LoadingSkeleton, SearchBar } from '../components/common';
import { showGlobalToast } from '../context/ToastContext';
import styles from './ContractsPage.module.css';

type ContractFilterTab = 'all' | 'active' | 'expiring_soon' | 'expired' | 'renewed';

export const ContractsPage: React.FC = () => {
  const [contracts, setContracts] = useState<IContract[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<ContractFilterTab>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [alertDaysThreshold, setAlertDaysThreshold] = useState<number>(30);

  // Renewal Modal
  const [selectedContract, setSelectedContract] = useState<IContract | null>(null);
  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState<boolean>(false);
  const [renewalTitle, setRenewalTitle] = useState<string>('');
  const [renewalValue, setRenewalValue] = useState<number>(0);
  const [renewalCloseDate, setRenewalCloseDate] = useState<string>('');
  const [renewalProbability, setRenewalProbability] = useState<number>(85);
  const [isSubmittingRenewal, setIsSubmittingRenewal] = useState<boolean>(false);

  // Print & PDF Modal
  const [selectedPrintContract, setSelectedPrintContract] = useState<IContract | null>(null);

  const loadContracts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await contractService.getContracts();
      setContracts(data);
    } catch (err: unknown) {
      console.error('Lỗi tải hợp đồng:', err);
      showGlobalToast('Không thể tải danh sách hợp đồng.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadContracts();
  }, [loadContracts]);

  // Statistics
  const stats = useMemo(() => {
    const total = contracts.length;
    const active = contracts.filter((c) => c.status === 'active').length;
    const expiringSoon = contracts.filter((c) => {
      const remaining = c.remainingDays !== undefined ? c.remainingDays : 999;
      return remaining >= 0 && remaining <= alertDaysThreshold && c.status !== 'renewed';
    }).length;
    const renewed = contracts.filter((c) => c.status === 'renewed').length;
    return { total, active, expiringSoon, renewed };
  }, [contracts, alertDaysThreshold]);

  // Filtering
  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      // Tab filter
      if (activeTab === 'active' && c.status !== 'active') return false;
      if (activeTab === 'expiring_soon') {
        const remaining = c.remainingDays !== undefined ? c.remainingDays : 999;
        if (remaining < 0 || remaining > alertDaysThreshold || c.status === 'renewed') return false;
      }
      if (activeTab === 'expired' && c.status !== 'expired' && (c.remainingDays ?? 1) >= 0) {
        return false;
      }
      if (activeTab === 'renewed' && c.status !== 'renewed') return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const numMatch = c.contractNumber.toLowerCase().includes(q);
        const custMatch = (c.customerName || '').toLowerCase().includes(q);
        const compMatch = (c.customerCompany || '').toLowerCase().includes(q);
        const quoteMatch = (c.quotationNumber || '').toLowerCase().includes(q);
        if (!numMatch && !custMatch && !compMatch && !quoteMatch) return false;
      }

      return true;
    });
  }, [contracts, activeTab, searchQuery, alertDaysThreshold]);

  const openRenewalModal = (contract: IContract) => {
    setSelectedContract(contract);
    setRenewalTitle(`Tái ký Hợp đồng ${contract.contractNumber} - ${contract.customerCompany || contract.customerName}`);
    setRenewalValue(contract.totalValue);
    setRenewalCloseDate(contract.expiryDate);
    setRenewalProbability(85);
    setIsRenewalModalOpen(true);
  };

  const handleCreateRenewal = async () => {
    if (!selectedContract) return;
    if (!renewalTitle.trim() || !renewalCloseDate) {
      showGlobalToast('Vui lòng điền tiêu đề cơ hội và ngày dự kiến đóng.', 'warning');
      return;
    }

    setIsSubmittingRenewal(true);
    try {
      const payload: IContractRenewalDTO = {
        title: renewalTitle.trim(),
        expectedValue: renewalValue,
        expectedCloseDate: renewalCloseDate,
        renewalProbability: Number(renewalProbability),
      };
      await contractService.renewContract(selectedContract.id, payload);
      showGlobalToast(`Đã tạo cơ hội tái ký cho hợp đồng "${selectedContract.contractNumber}" thành công!`, 'success');
      setIsRenewalModalOpen(false);
      void loadContracts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tạo cơ hội tái ký.';
      showGlobalToast(msg, 'error');
    } finally {
      setIsSubmittingRenewal(false);
    }
  };

  const handleOpenPdf = (contract: IContract) => {
    setSelectedPrintContract(contract);
  };

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerTitleWrap}>
          <div className={styles.headerIconBadge}>
            <FileText size={24} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Quản Lý Hợp Đồng &amp; Tái Ký</h1>
            <p className={styles.pageSubtitle}>
              Theo dõi thời hạn hiệu lực, đếm ngược số ngày còn lại và chủ động tạo cơ hội tái ký trước khi hết hạn
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', color: '#475569' }}>
            <Calendar size={16} /> Ngưỡng cảnh báo sắp hết hạn:
            <select
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid #CBD5E1',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
              value={alertDaysThreshold}
              onChange={(e) => setAlertDaysThreshold(Number(e.target.value))}
            >
              <option value={15}>15 ngày</option>
              <option value={30}>30 ngày</option>
              <option value={45}>45 ngày</option>
              <option value={60}>60 ngày</option>
              <option value={90}>90 ngày</option>
            </select>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<RotateCw size={14} />}
            onClick={() => void loadContracts()}
          >
            Làm mới
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#EFF6FF', color: '#2563EB' }}>
            <FileText size={20} />
          </div>
          <div>
            <div className={styles.statNumber}>{stats.total}</div>
            <div className={styles.statLabel}>Tổng số hợp đồng</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#F0FDF4', color: '#16A34A' }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className={styles.statNumber}>{stats.active}</div>
            <div className={styles.statLabel}>Đang có hiệu lực</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
            <Clock size={20} />
          </div>
          <div>
            <div className={styles.statNumber} style={{ color: stats.expiringSoon > 0 ? '#D97706' : undefined }}>
              {stats.expiringSoon}
            </div>
            <div className={styles.statLabel}>Sắp hết hạn (&le; {alertDaysThreshold} ngày)</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#F3E8FF', color: '#9333EA' }}>
            <RotateCw size={20} />
          </div>
          <div>
            <div className={styles.statNumber}>{stats.renewed}</div>
            <div className={styles.statLabel}>Đã xúc tiến tái ký</div>
          </div>
        </div>
      </div>

      {/* Contracts Table Section */}
      <div className={styles.cardContainer}>
        {/* Filter Bar */}
        <div className={styles.filterBar}>
          <div className={styles.tabList}>
            <button
              type="button"
              className={`${styles.tabButton} ${activeTab === 'all' ? styles.tabButtonActive : ''}`}
              onClick={() => setActiveTab('all')}
            >
              Tất cả ({contracts.length})
            </button>
            <button
              type="button"
              className={`${styles.tabButton} ${activeTab === 'active' ? styles.tabButtonActive : ''}`}
              onClick={() => setActiveTab('active')}
            >
              Hiệu lực ({stats.active})
            </button>
            <button
              type="button"
              className={`${styles.tabButton} ${activeTab === 'expiring_soon' ? styles.tabButtonActive : ''}`}
              onClick={() => setActiveTab('expiring_soon')}
            >
              Sắp hết hạn ({stats.expiringSoon})
            </button>
            <button
              type="button"
              className={`${styles.tabButton} ${activeTab === 'renewed' ? styles.tabButtonActive : ''}`}
              onClick={() => setActiveTab('renewed')}
            >
              Đã tái ký ({stats.renewed})
            </button>
          </div>

          <div style={{ width: 280 }}>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Tìm theo số HĐ, khách hàng..."
            />
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableWrap}>
          {isLoading ? (
            <div style={{ padding: 24 }}>
              <LoadingSkeleton height={50} />
              <div style={{ marginTop: 12 }}>
                <LoadingSkeleton height={150} />
              </div>
            </div>
          ) : filteredContracts.length === 0 ? (
            <div className={styles.emptyState}>
              <FileText size={40} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
              <p style={{ margin: 0, fontWeight: 600 }}>Không tìm thấy hợp đồng nào phù hợp.</p>
              <p style={{ margin: '4px 0 0', fontSize: '0.8125rem' }}>
                Hợp đồng được tạo tự động khi chuyển đổi báo giá được chấp nhận ở phân hệ Báo giá.
              </p>
            </div>
          ) : (
            <table className={styles.contractsTable}>
              <thead>
                <tr>
                  <th>Số Hợp đồng</th>
                  <th>Khách hàng &amp; Doanh nghiệp</th>
                  <th>Báo giá liên kết</th>
                  <th style={{ textAlign: 'right' }}>Giá trị HĐ (VNĐ)</th>
                  <th>Ngày ký</th>
                  <th>Ngày hiệu lực</th>
                  <th>Ngày hết hạn</th>
                  <th>Thời hạn còn lại</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredContracts.map((c) => {
                  const remaining = c.remainingDays !== undefined ? c.remainingDays : 0;
                  const isExpiring = remaining >= 0 && remaining <= alertDaysThreshold;
                  const isExpired = remaining < 0;

                  return (
                    <tr key={c.id}>
                      <td>
                        <span className={styles.contractNumberLink} onClick={() => handleOpenPdf(c)}>
                          {c.contractNumber}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0F172A' }}>
                          {c.customerCompany || c.customerName}
                        </div>
                        {c.customerCompany && (
                          <div style={{ fontSize: '0.8125rem', color: '#64748B' }}>
                            Liên hệ: {c.customerName}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8125rem', color: '#475569' }}>
                          {c.quotationNumber || '—'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#1E293B' }}>
                        {formatVndCurrency(c.totalValue)}
                      </td>
                      <td>{c.signingDate}</td>
                      <td>{c.effectiveDate}</td>
                      <td style={{ fontWeight: 600, color: isExpiring ? '#D97706' : isExpired ? '#DC2626' : undefined }}>
                        {c.expiryDate}
                      </td>
                      <td>
                        {c.status === 'renewed' ? (
                          <span className={`${styles.remainingBadge} ${styles.remainingSuccess}`}>
                            Đã tái ký
                          </span>
                        ) : isExpired ? (
                          <span className={`${styles.remainingBadge} ${styles.remainingDanger}`}>
                            Đã hết hạn ({Math.abs(remaining)} ngày)
                          </span>
                        ) : isExpiring ? (
                          <span className={`${styles.remainingBadge} ${styles.remainingWarning}`}>
                            <AlertTriangle size={13} /> Còn {remaining} ngày
                          </span>
                        ) : (
                          <span className={`${styles.remainingBadge} ${styles.remainingSuccess}`}>
                            Còn {remaining} ngày
                          </span>
                        )}
                      </td>
                      <td>
                        <Badge
                          tone={
                            c.status === 'active'
                              ? 'success'
                              : c.status === 'renewed'
                              ? 'neutral'
                              : c.status === 'expired'
                              ? 'danger'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {c.status === 'active'
                            ? 'Hiệu lực'
                            : c.status === 'renewed'
                            ? 'Đã tái ký'
                            : c.status === 'expired'
                            ? 'Hết hạn'
                            : 'Sắp hết hạn'}
                        </Badge>
                      </td>
                      <td>
                        <div className={styles.actionsCell}>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            leftIcon={<Printer size={13} />}
                            onClick={() => handleOpenPdf(c)}
                            title="Xem mẫu in & Xuất PDF Hợp đồng (S7-05)"
                          >
                            PDF
                          </Button>
                          {c.status !== 'renewed' && (
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              leftIcon={<RotateCw size={13} />}
                              onClick={() => openRenewalModal(c)}
                              title="Tạo cơ hội bán hàng tái ký từ hợp đồng này"
                            >
                              Tái ký
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Renewal Opportunity Modal (S7-07) */}
      <Modal
        isOpen={isRenewalModalOpen}
        onClose={() => setIsRenewalModalOpen(false)}
        title="Tạo Cơ Hội Tái Ký Hợp Đồng"
        subtitle={`Khởi tạo quy trình tái ký cho Hợp đồng ${selectedContract?.contractNumber}`}
        maxWidth="md"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6 }}>
              Tiêu đề Cơ hội Tái ký: <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <input
              type="text"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: '0.9375rem',
                boxSizing: 'border-box',
              }}
              value={renewalTitle}
              onChange={(e) => setRenewalTitle(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6 }}>
                Giá trị dự kiến (VNĐ):
              </label>
              <input
                type="number"
                min={0}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid #CBD5E1',
                  fontSize: '0.9375rem',
                  boxSizing: 'border-box',
                }}
                value={renewalValue}
                onChange={(e) => setRenewalValue(Number(e.target.value))}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6 }}>
                Xác suất tái ký (%):
              </label>
              <input
                type="number"
                min={1}
                max={100}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid #CBD5E1',
                  fontSize: '0.9375rem',
                  boxSizing: 'border-box',
                }}
                value={renewalProbability}
                onChange={(e) => setRenewalProbability(Number(e.target.value))}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6 }}>
              Ngày mục tiêu chốt tái ký: <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <input
              type="date"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: '0.9375rem',
                boxSizing: 'border-box',
              }}
              value={renewalCloseDate}
              onChange={(e) => setRenewalCloseDate(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsRenewalModalOpen(false)}
              disabled={isSubmittingRenewal}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleCreateRenewal}
              disabled={isSubmittingRenewal}
            >
              {isSubmittingRenewal ? 'Đang tạo...' : 'Tạo Cơ Hội Tái Ký'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Contract Print & PDF Preview Modal (S7-05 & S7-07) */}
      {selectedPrintContract && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleWrap}>
                <Printer size={20} color="#2563eb" />
                <h3 className={styles.modalTitle}>
                  Hợp Đồng Kinh Tế — {selectedPrintContract.contractNumber}
                </h3>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setSelectedPrintContract(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.printPreviewPaper} id="printable-contract-area">
                {/* Quốc hiệu */}
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, letterSpacing: '0.05em' }}>
                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, marginTop: 2 }}>
                    Độc lập - Tự do - Hạnh phúc
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>---o0o---</div>
                </div>

                {/* Header Doanh nghiệp */}
                <div className={styles.corporateHeader}>
                  <div>
                    <div className={styles.corporateBrand}>CÔNG TY CỔ PHẦN CÔNG NGHỆ NEXUS VIỆT NAM</div>
                    <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: 4 }}>
                      Địa chỉ: Tòa nhà Nexus Tower, 180 Đường Cầu Giấy, Quận Cầu Giấy, Hà Nội
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                      Hotline: 1900 6868 · Email: contact@nexuscrm.vn · MST: 0108889999
                    </div>
                  </div>
                  <div className={styles.corporateMeta}>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1e3a8a' }}>
                      SỐ HĐ: {selectedPrintContract.contractNumber}
                    </div>
                    <div style={{ color: '#64748b', marginTop: 2 }}>
                      Ngày ký: {selectedPrintContract.signingDate || '—'}
                    </div>
                    <div style={{ color: '#059669', fontWeight: 600, marginTop: 2 }}>
                      Hiệu lực: {selectedPrintContract.effectiveDate || '—'} đến {selectedPrintContract.expiryDate || '—'}
                    </div>
                  </div>
                </div>

                {/* Tiêu đề Hợp đồng */}
                <div style={{ textAlign: 'center', margin: '20px 0 16px' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase' }}>
                    {selectedPrintContract.title || 'HỢP ĐỒNG KINH TẾ'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
                    (V/v: Cung cấp giải pháp phần mềm Quản lý Bán hàng & Dịch vụ Cloud NexusCRM)
                  </div>
                </div>

                {/* Thông tin 2 bên */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div style={{ padding: 14, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.82rem' }}>
                    <div style={{ fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', marginBottom: 6 }}>
                      BÊN A (BÊN KHÁCH HÀNG / SỬ DỤNG DỊCH VỤ):
                    </div>
                    <div><strong>Đơn vị:</strong> {selectedPrintContract.customerCompany || selectedPrintContract.customerName || '—'}</div>
                    <div style={{ marginTop: 2 }}><strong>Người đại diện:</strong> {selectedPrintContract.customerName || 'Đại diện Khách hàng'}</div>
                    <div style={{ marginTop: 2 }}><strong>Mã số thuế:</strong> {selectedPrintContract.customerTaxCode || 'Chưa cập nhật'}</div>
                    <div style={{ marginTop: 2 }}><strong>Điều khoản thanh toán:</strong> {selectedPrintContract.paymentTerms || 'Theo thỏa thuận hai bên.'}</div>
                  </div>

                  <div style={{ padding: 14, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.82rem' }}>
                    <div style={{ fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', marginBottom: 6 }}>
                      BÊN B (BÊN CUNG CẤP DỊCH VỤ):
                    </div>
                    <div><strong>Đơn vị:</strong> CÔNG TY CỔ PHẦN CÔNG NGHỆ NEXUS VIỆT NAM</div>
                    <div style={{ marginTop: 2 }}><strong>Người đại diện:</strong> {selectedPrintContract.ownerName || 'Tổng Giám Đốc'}</div>
                    <div style={{ marginTop: 2 }}><strong>Mã số thuế:</strong> 0108889999</div>
                    <div style={{ marginTop: 2 }}><strong>Địa chỉ:</strong> Tòa nhà Nexus Tower, Cầu Giấy, Hà Nội</div>
                  </div>
                </div>

                {/* Bảng Dòng Sản Phẩm */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', marginBottom: 16 }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                      <th style={{ padding: '8px 10px', textAlign: 'center', width: 36 }}>STT</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>Sản phẩm / Dịch vụ</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center', width: 55 }}>ĐVT</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center', width: 50 }}>SL</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', width: 110 }}>Đơn giá (VNĐ)</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', width: 100 }}>Chiết khấu</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', width: 120 }}>Thành tiền (VNĐ)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedPrintContract.items || []).map((item, idx) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px 10px', textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 600 }}>{item.productName}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>{item.unit}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600 }}>{item.quantity}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right' }}>{formatVndCurrency(item.unitPrice)}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: item.discountAmount > 0 ? '#d97706' : '#64748b' }}>
                          {item.discountAmount > 0 ? `- ${formatVndCurrency(item.discountAmount)}` : '—'}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>
                          {formatVndCurrency(item.lineTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Tổng cộng & Bằng chữ */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                  <div style={{ width: 360, display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.88rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        paddingTop: 8,
                        borderTop: '2px solid #0f172a',
                        fontWeight: 800,
                        fontSize: '1rem',
                        color: '#0f172a',
                      }}
                    >
                      <span>TỔNG GIÁ TRỊ HỢP ĐỒNG:</span>
                      <span style={{ color: '#2563eb' }}>{formatVndCurrency(selectedPrintContract.totalValue)}</span>
                    </div>
                  </div>
                </div>

                {selectedPrintContract.totalInWords && (
                  <div
                    style={{
                      padding: '10px 14px',
                      background: '#f8fafc',
                      borderRadius: 6,
                      fontSize: '0.84rem',
                      fontStyle: 'italic',
                      marginBottom: 20,
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <strong>Số tiền viết bằng chữ:</strong> {selectedPrintContract.totalInWords}
                  </div>
                )}

                {/* Điều khoản & Cam kết */}
                <div style={{ fontSize: '0.8rem', color: '#334155', borderTop: '1px dashed #cbd5e1', paddingTop: 12, marginBottom: 28, lineHeight: 1.6 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>ĐIỀU KHOẢN VÀ CAM KẾT CHUNG:</div>
                  <div>1. <strong>Tiến độ bàn giao:</strong> {selectedPrintContract.deliveryTerms || 'Bàn giao tài khoản quản trị và kích hoạt hệ thống trong vòng 24 giờ sau khi ký hợp đồng.'}</div>
                  <div>2. <strong>Quy chuẩn dịch vụ & Bảo mật:</strong> Bên B cam kết bảo mật tuyệt đối toàn bộ cơ sở dữ liệu khách hàng, duy trì hạ tầng Cloud ổn định với chỉ số cam kết SLA &ge; 99.9%.</div>
                  <div>3. <strong>Hỗ trợ kỹ thuật:</strong> Đội ngũ kỹ sư hỗ trợ 24/7 trong suốt thời hạn hiệu lực của hợp đồng.</div>
                </div>

                {/* Chữ ký 2 bên */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', textAlign: 'center', marginTop: 24 }}>
                  <div>
                    <div style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.84rem' }}>
                      ĐẠI DIỆN BÊN A
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>(Ký, ghi rõ họ tên và đóng dấu)</div>
                    <div style={{ height: 75 }} />
                    <div style={{ fontWeight: 600 }}>{selectedPrintContract.customerName || 'Đại diện Khách hàng'}</div>
                  </div>

                  <div>
                    <div style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.84rem' }}>
                      ĐẠI DIỆN BÊN B
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>(Ký, ghi rõ họ tên và đóng dấu)</div>
                    <div style={{ height: 75 }} />
                    <div style={{ fontWeight: 600 }}>{selectedPrintContract.ownerName || 'CÔNG TY CP CÔNG NGHỆ NEXUS'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSelectedPrintContract(null)}
              >
                Đóng
              </Button>
              <Button
                type="button"
                variant="secondary"
                leftIcon={<ExternalLink size={15} />}
                onClick={() => contractService.openPrintWindow(selectedPrintContract)}
                title="Mở tài liệu in trên tab mới riêng biệt"
              >
                Mở Tab Riêng
              </Button>
              <Button
                type="button"
                variant="primary"
                leftIcon={<Printer size={16} />}
                onClick={() => window.print()}
              >
                In Hợp Đồng / Xuất PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
