import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Printer,
  Calendar,
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

  const handleOpenPdf = (contractId: string) => {
    const pdfUrl = contractService.getPdfUrl(contractId);
    window.open(pdfUrl, '_blank');
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
                        <span className={styles.contractNumberLink} onClick={() => handleOpenPdf(c.id)}>
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
                            onClick={() => handleOpenPdf(c.id)}
                            title="Xuất bản in PDF Hợp đồng"
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
    </div>
  );
};
