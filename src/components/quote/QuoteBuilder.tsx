import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  ShieldAlert,
  Plus,
  Trash2,
  Calendar,
  CreditCard,
  Truck,
  MessageSquare,
  Printer,
  Save,
  Send,
  RotateCcw,
  ArrowLeft,
  DollarSign,
  Package,
  Layers,
  CheckCircle2,
  AlertCircle,
  GitCompare,
  FileCheck2,
  Share2,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { IQuote, IQuoteCompareResult } from '../../interfaces/quote.interface';
import { IDeal } from '../../interfaces/deal.interface';
import { useQuoteBuilder } from '../../hooks/useQuoteBuilder';
import { quoteService } from '../../services/quoteService';
import {
  formatCurrency,
  formatVndCurrency,
  toLocalDateInputValue,
} from '../../utils/formatters';
import { Button, Modal, LoadingSkeleton, Badge } from '../common';
import { showGlobalToast } from '../../context/ToastContext';
import styles from './QuoteBuilder.module.css';

export interface IQuoteBuilderProps {
  dealId?: string;
  initialDeal?: IDeal | null;
  onSuccess?: (quote: IQuote) => void;
  className?: string;
}

export const QuoteBuilder: React.FC<IQuoteBuilderProps> = ({
  dealId,
  initialDeal,
  onSuccess,
  className = '',
}) => {
  const navigate = useNavigate();

  const {
    deal,
    quote,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    loadError,
    productCatalog,
    addLineItem,
    updateLineItem,
    removeLineItem,
    updateQuoteMeta,
    saveDraft,
    submitQuote,
    sendQuote,
    resetToInitial,
  } = useQuoteBuilder({ dealId, initialDeal });

  // Modals
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState<boolean>(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);

  // S7-03: Version Comparison State
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);
  const [compareData, setCompareData] = useState<IQuoteCompareResult | null>(null);
  const [dealQuotesList, setDealQuotesList] = useState<IQuote[]>([]);
  const [targetCompareQuoteId, setTargetCompareQuoteId] = useState<string>('');
  const [isComparing, setIsComparing] = useState<boolean>(false);

  // S7-04: Convert to Contract State
  const [isContractModalOpen, setIsContractModalOpen] = useState<boolean>(false);
  const [contractNumber, setContractNumber] = useState<string>('');
  const [signingDate, setSigningDate] = useState<string>('');
  const [effectiveDate, setEffectiveDate] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [contractPaymentTerms, setContractPaymentTerms] = useState<string>('');
  const [isConvertingContract, setIsConvertingContract] = useState<boolean>(false);

  // S7-06: Customer Portal Share State
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  if (isLoading) {
    return (
      <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <LoadingSkeleton height={80} />
        <LoadingSkeleton height={360} />
      </div>
    );
  }

  if (loadError || !quote) {
    return (
      <section
        role="alert"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 12,
          padding: 24,
          border: '1px solid #FECACA',
          borderRadius: 12,
          background: '#FEF2F2',
          color: '#991B1B',
        }}
      >
        <AlertCircle size={22} aria-hidden="true" />
        <h1 style={{ margin: 0, fontSize: '1.125rem' }}>Không thể mở trình soạn báo giá</h1>
        <p style={{ margin: 0 }}>{loadError || 'Không tìm thấy dữ liệu báo giá.'}</p>
        <Button type="button" variant="secondary" onClick={() => navigate('/deals')}>
          Quay lại danh sách cơ hội
        </Button>
      </section>
    );
  }

  const now = new Date();
  const minValidUntil = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
  const isReadOnly = quote.status !== 'draft';

  const handleSaveDraft = async () => {
    const saved = await saveDraft();
    if (saved && onSuccess) {
      onSuccess(saved);
    }
  };

  const handleSubmit = async () => {
    const submitted =
      quote.status === 'approved' ? await sendQuote() : await submitQuote();
    if (submitted && onSuccess) {
      onSuccess(submitted);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // S7-03: Compare versions
  const handleOpenCompare = async () => {
    if (!quote) return;
    setIsCompareModalOpen(true);
    setIsComparing(true);
    try {
      const allQuotes = await quoteService.getQuotesAsync({ dealId: quote.dealId });
      setDealQuotesList(allQuotes);
      const candidates = allQuotes.filter((q) => q.id !== quote.id);
      if (candidates.length > 0) {
        const targetId = candidates[0].id;
        setTargetCompareQuoteId(targetId);
        const res = await quoteService.compareVersionsAsync(quote.id, targetId);
        setCompareData(res);
      }
    } catch (err: unknown) {
      console.error(err);
      showGlobalToast('Không thể tải dữ liệu so sánh phiên bản.', 'error');
    } finally {
      setIsComparing(false);
    }
  };

  const handleSelectCompareTarget = async (targetId: string) => {
    if (!quote) return;
    setTargetCompareQuoteId(targetId);
    setIsComparing(true);
    try {
      const res = await quoteService.compareVersionsAsync(quote.id, targetId);
      setCompareData(res);
    } catch (err: unknown) {
      console.error(err);
      showGlobalToast('Lỗi khi so sánh phiên bản.', 'error');
    } finally {
      setIsComparing(false);
    }
  };

  // S7-04: Convert to Contract
  const handleOpenContractModal = () => {
    if (!quote) return;
    const today = toLocalDateInputValue();
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const expiryStr = toLocalDateInputValue(nextYear);

    setContractNumber(`HD-${new Date().getFullYear()}-${quote.quoteNumber.replace('BG-', '')}`);
    setSigningDate(today);
    setEffectiveDate(today);
    setExpiryDate(expiryStr);
    setContractPaymentTerms(quote.paymentTerms || 'Thanh toán 100% trong vòng 15 ngày');
    setIsContractModalOpen(true);
  };

  const handleConvertToContract = async () => {
    if (!quote) return;
    if (!contractNumber.trim() || !signingDate || !effectiveDate || !expiryDate) {
      showGlobalToast('Vui lòng nhập đầy đủ số hợp đồng và thời hạn hiệu lực.', 'warning');
      return;
    }
    setIsConvertingContract(true);
    try {
      const createdContract = await quoteService.convertQuoteToContractAsync(quote.id, {
        quotationId: quote.id,
        contractNumber: contractNumber.trim(),
        signingDate,
        effectiveDate,
        expiryDate,
        paymentTerms: contractPaymentTerms || quote.paymentTerms,
        deliveryTerms: quote.deliveryTerms,
        notes: quote.notes,
      });
      showGlobalToast(
        `Đã chuyển đổi thành công Hợp đồng ${createdContract.contractNumber}! Cơ hội bán hàng đã được cập nhật thành Thắng (Won).`,
        'success'
      );
      setIsContractModalOpen(false);
      navigate('/contracts');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi khi chuyển đổi thành hợp đồng.';
      showGlobalToast(msg, 'error');
    } finally {
      setIsConvertingContract(false);
    }
  };

  // S7-05: PDF Export
  const handleOpenPdf = () => {
    if (!quote) return;
    const url = quoteService.getPdfUrl(quote.id);
    window.open(url, '_blank');
  };

  // S7-06: Share Link
  const portalUrl = quote
    ? `${window.location.origin}/portal/quotes/${quote.accessToken || quote.id}`
    : '';

  const handleCopyLink = () => {
    if (!portalUrl) return;
    void navigator.clipboard.writeText(portalUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
    showGlobalToast('Đã sao chép liên kết xem báo giá cho Khách hàng!', 'success');
  };

  return (
    <div className={`${styles.container} ${className}`}>
      {/* ====================================================================
          1. Top Navigation & Header
          ==================================================================== */}
      <div className={styles.topNavRow}>
        <div className={styles.breadcrumbs}>
          <span
            className={styles.breadcrumbLink}
            onClick={() => navigate('/deals')}
            title="Quay lại danh sách cơ hội kinh doanh"
          >
            Cơ hội bán hàng
          </span>
          <span>/</span>
          <span
            className={styles.breadcrumbLink}
            onClick={() => deal && navigate(`/deals`)}
            title="Xem chi tiết cơ hội"
          >
            {quote.dealTitle || 'Chi tiết Cơ hội'}
          </span>
          <span>/</span>
          <strong style={{ color: '#0F172A' }}>Soạn thảo Báo giá</strong>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          leftIcon={<ArrowLeft size={15} />}
          onClick={() => navigate('/deals')}
          title="Quay lại màn hình quản lý cơ hội"
        >
          Quay lại Cơ hội
        </Button>
      </div>

      <header className={styles.headerCard}>
        <div className={styles.headerTitleRow}>
          <div className={styles.headerTitleWrap}>
            <div className={styles.headerIconBadge} title="Phân hệ Báo giá Thương mại">
              <FileText size={22} />
            </div>
            <div>
              <h1 className={styles.pageTitle}>
                Soạn Thảo Báo Giá Thương Mại
              </h1>
              <div className={styles.pageSubtitle}>
                <span>Mã báo giá:</span>
                <span className={styles.quoteNumberBadge}>{quote.quoteNumber}</span>
                <span>·</span>
                <span>Khởi tạo từ Cơ hội: <strong>{quote.dealTitle}</strong></span>
                <span>·</span>
                <Badge
                  tone={
                    quote.status === 'approved' ||
                    quote.status === 'sent' ||
                    quote.status === 'accepted'
                      ? 'success'
                      : quote.status === 'pending_approval'
                      ? 'warning'
                      : quote.status === 'rejected'
                      ? 'danger'
                      : 'neutral'
                  }
                  size="sm"
                >
                  {quote.status === 'draft'
                    ? 'Bản nháp'
                    : quote.status === 'pending_approval'
                    ? quote.approvalLevel === 'director'
                      ? 'Chờ Giám đốc duyệt'
                      : 'Chờ Trưởng nhóm duyệt'
                    : quote.status === 'approved'
                    ? 'Đã duyệt'
                    : quote.status === 'sent'
                    ? 'Đã phát hành'
                    : quote.status === 'accepted'
                    ? 'Đã chấp nhận'
                    : 'Bị từ chối'}
                </Badge>
                {hasUnsavedChanges && (
                  <span style={{ color: '#D97706', fontSize: '0.8125rem', fontWeight: 600 }}>
                    ● Có thay đổi chưa lưu
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<GitCompare size={15} />}
              onClick={() => void handleOpenCompare()}
              title="So sánh trực quan hai phiên bản của báo giá này"
            >
              So sánh phiên bản
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<Share2 size={15} />}
              onClick={() => setIsShareModalOpen(true)}
              title="Lấy đường dẫn riêng biệt cho khách hàng phê duyệt trực tuyến"
            >
              Liên kết Khách hàng
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<Printer size={15} />}
              onClick={handleOpenPdf}
              title="Xuất file PDF hoặc bản in theo mẫu doanh nghiệp cấu hình"
            >
              Xuất PDF Doanh nghiệp
            </Button>

            {quote.status === 'accepted' && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                leftIcon={<FileCheck2 size={15} />}
                onClick={handleOpenContractModal}
                title="Chuyển đổi báo giá đã chấp nhận sang hợp đồng chính thức"
              >
                Chuyển thành Hợp đồng
              </Button>
            )}
          </div>
        </div>

        {/* Thông tin khách hàng & bối cảnh cơ hội kế thừa */}
        <div className={styles.contextGrid}>
          <div className={styles.contextCol}>
            <div className={styles.contextRow}>
              <span className={styles.contextLabel}>
                <Package size={14} /> Cơ hội bán hàng:
              </span>
              <span className={styles.contextValue}>{quote.dealTitle}</span>
            </div>
            <div className={styles.contextRow}>
              <span className={styles.contextLabel}>
                <DollarSign size={14} /> Giá trị ước tính Deal:
              </span>
              <span className={styles.contextValue} style={{ color: '#2563EB' }}>
                {formatCurrency(deal?.value ?? 0)}
              </span>
            </div>
            <div className={styles.contextRow}>
              <span className={styles.contextLabel}>
                <Layers size={14} /> Giai đoạn phễu:
              </span>
              <span className={styles.contextValue}>{deal?.stage || 'Đàm phán báo giá'}</span>
            </div>
          </div>

          <div className={styles.contextCol}>
            <div className={styles.contextRow}>
              <span className={styles.contextLabel}>Khách hàng / Doanh nghiệp:</span>
              <span className={styles.contextValue}>{quote.customerCompany || quote.customerName}</span>
            </div>
            <div className={styles.contextRow}>
              <span className={styles.contextLabel}>Người phụ trách báo giá:</span>
              <span className={styles.contextValue}>{quote.createdBy}</span>
            </div>
            <div className={styles.contextRow}>
              <span className={styles.contextLabel}>Ngưỡng chiết khấu cần duyệt:</span>
              <span className={styles.contextValue} style={{ color: '#DC2626' }}>
                {quote.discountThresholdPercent}% / 20%
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ====================================================================
          2. Trạng thái phê duyệt và cảnh báo ngưỡng
          ==================================================================== */}
      {quote.requiresApproval && quote.approvalAlert ? (
        <section
          className={styles.redAlertBanner}
          role="alert"
          aria-live="assertive"
          aria-label="Trạng thái phê duyệt báo giá"
        >
          <div className={styles.redAlertIcon}>
            <ShieldAlert size={26} />
          </div>
          <div className={styles.redAlertContent}>
            <h3 className={styles.redAlertHeading}>
              {quote.status === 'pending_approval'
                ? 'BÁO GIÁ ĐANG CHỜ PHÊ DUYỆT'
                : quote.status === 'approved'
                  ? 'BÁO GIÁ ĐÃ ĐƯỢC DUYỆT'
                  : quote.status === 'sent' || quote.status === 'accepted'
                    ? 'BÁO GIÁ ĐÃ ĐƯỢC PHÁT HÀNH'
                    : quote.status === 'rejected'
                      ? 'BÁO GIÁ ĐÃ BỊ TỪ CHỐI'
                      : 'CẢNH BÁO: BÁO GIÁ CẦN PHÊ DUYỆT'}
              <span className={styles.redAlertBadge}>
                {quote.status === 'pending_approval'
                  ? quote.approvalLevel === 'director'
                    ? 'Chờ Giám đốc duyệt'
                    : 'Chờ Trưởng nhóm duyệt'
                  : quote.status === 'approved' || quote.status === 'sent' || quote.status === 'accepted'
                    ? 'Đã đủ điều kiện phát hành'
                    : quote.status === 'rejected'
                      ? 'Không thể phát hành'
                      : 'Yêu cầu duyệt cấp trên'}
              </span>
            </h3>
            <p className={styles.redAlertDesc}>
              {quote.status === 'pending_approval' ? (
                <>
                  {quote.approvalAlert.reason} Tổng chiết khấu hiện tại là{' '}
                  <strong>{quote.totalDiscountPercent}%</strong>. Báo giá chưa thể gửi cho khách hàng.
                </>
              ) : quote.status === 'approved' ||
                quote.status === 'sent' ||
                quote.status === 'accepted' ? (
                <>
                  Báo giá đã được phê duyệt với mức chiết khấu{' '}
                  <strong>{quote.totalDiscountPercent}%</strong>.
                  {quote.status === 'approved' && ' Có thể phát hành cho khách hàng.'}
                </>
              ) : quote.status === 'rejected' ? (
                <>Báo giá không được duyệt và không thể phát hành cho khách hàng.</>
              ) : (
                <>
                  {quote.approvalAlert.reason} Mức chiết khấu hiện tại là{' '}
                  <strong>{quote.totalDiscountPercent}%</strong>; báo giá cần được duyệt trước khi phát hành.
                </>
              )}
            </p>
            {quote.approvalAlert.ruleViolations.length > 0 && (
              <ul className={styles.redAlertList}>
                {quote.approvalAlert.ruleViolations.map((violation, idx) => (
                  <li key={idx}>{violation}</li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : (
        <div className={styles.greenApprovalNotice}>
          <CheckCircle2 size={18} color="#16A34A" />
          <span>
            {quote.status === 'approved' ? (
              <>Báo giá đã được tự động thông qua và chỉ còn chờ phát hành cho khách hàng.</>
            ) : quote.status === 'sent' || quote.status === 'accepted' ? (
              <>Báo giá đã được phát hành sau khi được duyệt.</>
            ) : (
              <>
                Mức chiết khấu hiện tại là <strong>{quote.totalDiscountPercent}%</strong>. Dưới{' '}
                {quote.discountThresholdPercent}% được tự động thông qua; từ {quote.discountThresholdPercent}% cần
                Trưởng nhóm duyệt, trên 20% hoặc thấp hơn giá sàn cần Giám đốc duyệt.
              </>
            )}
          </span>
        </div>
      )}

      {/* ====================================================================
          3. Bảng Dòng Sản Phẩm Kế Thừa Từ Cơ Hội (Editable Line Items Table)
          ==================================================================== */}
      <section className={styles.tableSectionCard} aria-label="Bảng danh sách sản phẩm báo giá">
        <div className={styles.tableSectionHeader}>
          <div className={styles.tableTitleWrap}>
            <h2 className={styles.tableSectionTitle}>Dòng Sản Phẩm &amp; Dịch Vụ Báo Giá</h2>
            <span className={styles.itemCountBadge}>{quote.items.length} hạng mục</span>
          </div>

          <div className={styles.tableActionsRight}>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<RotateCcw size={14} />}
              onClick={resetToInitial}
              disabled={isReadOnly}
              title="Khôi phục lại các dòng sản phẩm ban đầu được kế thừa từ Cơ hội (Deal)"
            >
              Khôi phục từ Deal
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<Layers size={14} />}
              onClick={() => setIsCatalogModalOpen(true)}
              disabled={isReadOnly}
              title="Chọn sản phẩm hoặc gói giải pháp có sẵn từ danh mục phần mềm & dịch vụ"
            >
              + Chọn từ Danh mục
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              leftIcon={<Plus size={15} />}
              onClick={() => addLineItem()}
              disabled={isReadOnly}
              title="Thêm một dòng sản phẩm hoặc dịch vụ tùy chỉnh mới"
            >
              + Thêm dòng sản phẩm
            </Button>
          </div>
        </div>

        <div className={styles.tableResponsive}>
          <table className={styles.quoteTable}>
            <thead>
              <tr>
                <th style={{ width: 44, textAlign: 'center' }}>STT</th>
                <th style={{ minWidth: 260 }}>Sản phẩm / Dịch vụ</th>
                <th style={{ width: 110 }}>ĐVT</th>
                <th style={{ width: 90 }}>Số lượng</th>
                <th style={{ width: 140 }}>Đơn giá (VNĐ)</th>
                <th style={{ width: 160 }}>Chiết khấu</th>
                <th style={{ width: 90 }}>VAT (%)</th>
                <th style={{ width: 160, textAlign: 'right' }}>Thành tiền (VNĐ)</th>
                <th style={{ width: 48, textAlign: 'center' }}>Xóa</th>
              </tr>
            </thead>
            <tbody>
              {quote.items.map((item, index) => (
                <tr key={item.id}>
                  <td style={{ textAlign: 'center', fontWeight: 600, color: '#64748B' }}>
                    {index + 1}
                  </td>

                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <input
                        type="text"
                        className={styles.tableInput}
                        value={item.productName}
                        disabled={isReadOnly}
                        onChange={(e) => updateLineItem(item.id, { productName: e.target.value })}
                        placeholder="Tên sản phẩm / giải pháp..."
                        title="Chỉnh sửa tên sản phẩm hoặc dịch vụ"
                      />
                      <input
                        type="text"
                        className={styles.tableInput}
                        style={{ height: 32, fontSize: '0.8125rem', fontWeight: 400, color: '#64748B' }}
                        value={item.description || ''}
                        disabled={isReadOnly}
                        onChange={(e) => updateLineItem(item.id, { description: e.target.value })}
                        placeholder="Mô tả phạm vi hoặc cam kết SLA..."
                        title="Mô tả chi tiết giải pháp"
                      />
                    </div>
                  </td>

                  <td>
                    <input
                      type="text"
                      className={styles.tableInput}
                      style={{ width: '100%' }}
                      value={item.unit}
                      disabled={isReadOnly}
                      onChange={(e) => updateLineItem(item.id, { unit: e.target.value })}
                      title="Đơn vị tính (Gói, User/Năm, License, Tháng...)"
                    />
                  </td>

                  <td>
                    <input
                      type="number"
                      min={1}
                      className={styles.tableInput}
                      style={{ width: '100%', textAlign: 'center' }}
                      value={item.quantity}
                      disabled={isReadOnly}
                      onChange={(e) => updateLineItem(item.id, { quantity: Number(e.target.value) })}
                      title="Số lượng sản phẩm hoặc người dùng"
                    />
                  </td>

                  <td>
                    <input
                      type="number"
                      step={100000}
                      className={styles.tableInput}
                      style={{ width: '100%', textAlign: 'right' }}
                      value={item.unitPrice}
                      disabled={isReadOnly}
                      onChange={(e) => updateLineItem(item.id, { unitPrice: Number(e.target.value) })}
                      title="Đơn giá niêm yết chưa trừ chiết khấu"
                    />
                  </td>

                  <td>
                    <div className={styles.discountInputWrap}>
                      <button
                        type="button"
                        className={styles.discountTypeToggle}
                        disabled={isReadOnly}
                        onClick={() =>
                          updateLineItem(item.id, {
                            discountType: item.discountType === 'percent' ? 'amount' : 'percent',
                            discountValue: 0,
                          })
                        }
                        title={`Bấm để chuyển đổi giữa chiết khấu theo % và số tiền VNĐ (Hiện tại: ${
                          item.discountType === 'percent' ? '%' : 'VNĐ'
                        })`}
                      >
                        {item.discountType === 'percent' ? '%' : 'VNĐ'}
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={item.discountType === 'percent' ? 100 : item.unitPrice * item.quantity}
                        className={styles.discountInputField}
                        value={item.discountValue}
                        disabled={isReadOnly}
                        onChange={(e) => updateLineItem(item.id, { discountValue: Number(e.target.value) })}
                        title="Nhập mức chiết khấu áp dụng cho dòng sản phẩm này"
                      />
                    </div>
                    {item.discountAmount > 0 && (
                      <span className={styles.discountResultTag}>
                        - {formatVndCurrency(item.discountAmount)}
                      </span>
                    )}
                  </td>

                  <td>
                    <select
                      className={styles.tableInput}
                      style={{ width: '100%', textAlign: 'center' }}
                      value={item.vatRate}
                      disabled={isReadOnly}
                      onChange={(e) => updateLineItem(item.id, { vatRate: Number(e.target.value) })}
                      title="Chọn thuế suất giá trị gia tăng VAT"
                    >
                      <option value={0}>0%</option>
                      <option value={8}>8%</option>
                      <option value={10}>10%</option>
                    </select>
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <span className={styles.lineTotalText}>
                      {formatVndCurrency(item.lineTotal)}
                    </span>
                  </td>

                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      className={styles.deleteItemBtn}
                      disabled={isReadOnly}
                      onClick={() => removeLineItem(item.id)}
                      title="Xóa dòng sản phẩm này khỏi báo giá"
                      aria-label="Xóa dòng"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ====================================================================
          4. Khai Báo Hiệu Lực, Điều Khoản Thanh Toán & Giao Hàng
          ==================================================================== */}
      <section className={styles.termsSectionCard} aria-label="Điều khoản thương mại">
        <h3 className={styles.termsTitle}>
          <CreditCard size={20} color="#2563EB" /> Khai Báo Điều Khoản Thương Mại &amp; Hiệu Lực
        </h3>

        <div className={styles.termsGrid}>
          <div className={styles.termsFieldGroup}>
            <label className={styles.termsLabel}>
              <Calendar size={15} /> Thời hạn hiệu lực báo giá:
            </label>
            <input
              type="date"
              className={styles.termsInput}
              value={quote.validUntil}
              disabled={isReadOnly}
              min={minValidUntil}
              onChange={(e) => updateQuoteMeta({ validUntil: e.target.value })}
              title="Chọn ngày hết hạn hiệu lực của bản báo giá này"
            />
          </div>

          <div className={styles.termsFieldGroup}>
            <label className={styles.termsLabel}>
              <CreditCard size={15} /> Điều khoản thanh toán:
            </label>
            <input
              type="text"
              className={styles.termsInput}
              value={quote.paymentTerms}
              disabled={isReadOnly}
              onChange={(e) => updateQuoteMeta({ paymentTerms: e.target.value })}
              placeholder="Ví dụ: Tạm ứng 50% khi ký hợp đồng, 50% sau khi nghiệm thu..."
              title="Nhập quy định các đợt thanh toán và tiến độ thanh toán"
            />
          </div>

          <div className={styles.termsFieldGroup}>
            <label className={styles.termsLabel}>
              <Truck size={15} /> Điều khoản giao hàng &amp; triển khai:
            </label>
            <input
              type="text"
              className={styles.termsInput}
              value={quote.deliveryTerms}
              disabled={isReadOnly}
              onChange={(e) => updateQuoteMeta({ deliveryTerms: e.target.value })}
              placeholder="Ví dụ: Bàn giao tài khoản Cloud trong vòng 24 giờ sau khi ký kết..."
              title="Nhập cam kết thời gian bàn giao và triển khai phần mềm"
            />
          </div>
        </div>

        <div className={styles.termsFieldGroup}>
          <label className={styles.termsLabel}>
            <MessageSquare size={15} /> Ghi chú bổ sung &amp; Cam kết bảo hành SLA:
          </label>
          <textarea
            className={styles.termsTextarea}
            value={quote.notes || ''}
            disabled={isReadOnly}
            onChange={(e) => updateQuoteMeta({ notes: e.target.value })}
            placeholder="Ghi chú chi tiết về hạ tầng máy chủ, cam kết SLA 99.9%, hỗ trợ kỹ thuật 24/7..."
            title="Nhập các điều khoản ghi chú bổ sung gửi cho khách hàng"
          />
        </div>
      </section>

      {/* ====================================================================
          5. Tổng Hợp Chi Phí & Thao Tác Báo Giá
          ==================================================================== */}
      <section className={styles.quoteClosingCard} aria-label="Tổng kết và thao tác báo giá">
        <section className={styles.summarySectionCard} aria-label="Tổng hợp tài chính báo giá">
          <div className={styles.summaryBox}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Tổng tiền hàng (Chưa giảm giá):</span>
              <span className={styles.summaryValue}>{formatVndCurrency(quote.subtotal)}</span>
            </div>

            <div className={`${styles.summaryRow} ${styles['summaryRow--discount']}`}>
              <span className={styles.summaryLabel}>
                Tổng chiết khấu ({quote.totalDiscountPercent}%):
              </span>
              <span className={styles.summaryValue}>
                - {formatVndCurrency(quote.totalDiscountAmount)}
              </span>
            </div>

            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Tổng tiền thuế GTGT (VAT):</span>
              <span className={styles.summaryValue}>{formatVndCurrency(quote.totalVatAmount)}</span>
            </div>

            <div className={styles.summaryDivider} />

            <div className={styles.grandTotalRow}>
              <span className={styles.grandTotalLabel}>TỔNG CỘNG THANH TOÁN:</span>
              <span className={styles.grandTotalValue}>{formatVndCurrency(quote.grandTotal)}</span>
            </div>
          </div>
        </section>

        {/* ====================================================================
            6. Thao Tác Báo Giá
            ==================================================================== */}
        <div className={styles.stickyActionBar}>
          <div className={styles.actionsLeft}>
            <Button
              type="button"
              variant="secondary"
              size="md"
              leftIcon={<ArrowLeft size={16} />}
              onClick={() => navigate('/deals')}
              title="Quay lại danh sách cơ hội bán hàng"
            >
              Quay lại Deal
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="md"
              leftIcon={<RotateCcw size={15} />}
              onClick={resetToInitial}
              disabled={isReadOnly}
              title="Khôi phục lại danh sách dòng sản phẩm ban đầu từ cơ hội"
            >
              Đặt lại từ Deal
            </Button>
          </div>

          <div className={styles.actionsRight}>
            <Button
              type="button"
              variant="secondary"
              size="md"
              leftIcon={<Printer size={16} />}
              onClick={() => setIsPreviewModalOpen(true)}
              title="Mở cửa sổ xem trước bản in / xuất file PDF gửi cho khách hàng"
            >
              Xem trước &amp; In
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="md"
              leftIcon={<Save size={16} />}
              onClick={handleSaveDraft}
              disabled={isSaving || isReadOnly}
              title="Lưu bản nháp vào hệ thống để tiếp tục chỉnh sửa bất kỳ lúc nào"
            >
              {isSaving ? 'Đang lưu...' : 'Lưu nháp báo giá'}
            </Button>

            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={
                isSaving ||
                quote.status === 'pending_approval' ||
                quote.status === 'rejected' ||
                quote.status === 'sent' ||
                quote.status === 'accepted'
              }
              leftIcon={
                quote.status === 'approved' || (!quote.requiresApproval && quote.status === 'draft')
                  ? <Send size={16} />
                  : <ShieldAlert size={16} />
              }
              onClick={handleSubmit}
              title={
                quote.status === 'approved'
                  ? 'Phát hành báo giá đã được duyệt cho khách hàng'
                  : quote.approvalLevel === 'director'
                    ? 'Gửi báo giá đến Giám đốc Kinh doanh để phê duyệt'
                    : quote.approvalLevel === 'team_leader'
                      ? 'Gửi báo giá đến Trưởng nhóm để phê duyệt'
                      : 'Kiểm tra và tự động duyệt báo giá theo ngưỡng'
              }
            >
              {quote.status === 'sent'
                ? 'Đã gửi khách hàng'
                : quote.status === 'pending_approval'
                  ? 'Đang chờ duyệt'
                  : quote.status === 'rejected'
                    ? 'Báo giá đã bị từ chối'
                    : quote.status === 'approved'
                      ? 'Gửi báo giá cho khách'
                      : quote.approvalLevel === 'director'
                        ? 'Gửi Giám đốc duyệt'
                        : quote.approvalLevel === 'team_leader'
                          ? 'Gửi Trưởng nhóm duyệt'
                          : 'Kiểm tra & duyệt báo giá'}
            </Button>
          </div>
        </div>
      </section>

      {/* ====================================================================
          7. Modal Chọn Sản Phẩm Từ Danh Mục (Product Catalog Modal)
          ==================================================================== */}
      <Modal
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        title="Danh Mục Sản Phẩm & Gói Giải Pháp Nexus CRM"
        subtitle="Chọn sản phẩm để thêm ngay vào bảng báo giá thương mại"
        maxWidth="lg"
      >
        <div className={styles.catalogGrid}>
          {productCatalog.map((product) => (
            <div
              key={product.id}
              className={styles.catalogItemCard}
              onClick={() => {
                addLineItem(product);
                setIsCatalogModalOpen(false);
              }}
              title={`Bấm để thêm "${product.name}" vào báo giá`}
            >
              <div className={styles.catalogItemHeader}>
                <span className={styles.catalogItemCode}>{product.code}</span>
                <span style={{ fontSize: '0.78rem', color: '#64748B' }}>{product.category}</span>
              </div>
              <h4 className={styles.catalogItemName}>{product.name}</h4>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: '#64748B', lineHeight: 1.4 }}>
                {product.description}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <span className={styles.catalogItemPrice}>{formatVndCurrency(product.unitPrice)}</span>
                <span style={{ fontSize: '0.8125rem', color: '#475569', fontWeight: 600 }}>/ {product.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* ====================================================================
          8. Modal Xem Trước Báo Giá / In (Print Preview Modal)
          ==================================================================== */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title="Bản Xem Trước Báo Giá Thương Mại"
        subtitle="Mẫu văn bản chính thức sẵn sàng in hoặc gửi file PDF cho khách hàng"
        maxWidth="lg"
      >
        <div className={styles.previewDocWrap}>
          {/* Header Báo giá */}
          <div className={styles.previewDocHeader}>
            <div>
              <h2 style={{ margin: 0, color: '#1E3A8A', fontSize: '1.4rem', fontWeight: 800 }}>
                CÔNG TY CỔ PHẦN CÔNG NGHỆ NEXUS CRM
              </h2>
              <p style={{ margin: '4px 0', fontSize: '0.875rem', color: '#64748B' }}>
                Địa chỉ: Tầng 18, Tòa nhà Keangnam Landmark 72, Phạm Hùng, Hà Nội
              </p>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748B' }}>
                Hotline: 1900 6868 · Email: contact@nexuscrm.vn · Website: nexuscrm.vn
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563EB' }}>
                {quote.quoteNumber}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#64748B', marginTop: 4 }}>
                Ngày lập: {new Date(quote.createdAt).toLocaleDateString('vi-VN')}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#DC2626', fontWeight: 600, marginTop: 2 }}>
                Hiệu lực đến: {new Date(quote.validUntil).toLocaleDateString('vi-VN')}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', margin: '14px 0' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', letterSpacing: '0.04em' }}>
              BẢNG BÁO GIÁ GIẢI PHÁP &amp; DỊCH VỤ
            </h1>
            <p style={{ margin: '4px 0', fontSize: '0.9375rem', color: '#64748B' }}>
              Kính gửi: <strong>{quote.customerCompany || quote.customerName}</strong>
            </p>
          </div>

          {/* Bảng sản phẩm trong bản in */}
          <table className={styles.previewDocTable}>
            <thead>
              <tr>
                <th style={{ width: 40, textAlign: 'center' }}>STT</th>
                <th>Tên Sản Phẩm / Dịch Vụ</th>
                <th style={{ width: 80 }}>ĐVT</th>
                <th style={{ width: 70, textAlign: 'center' }}>Số lượng</th>
                <th style={{ width: 120, textAlign: 'right' }}>Đơn giá</th>
                <th style={{ width: 100, textAlign: 'right' }}>Chiết khấu</th>
                <th style={{ width: 130, textAlign: 'right' }}>Thành tiền (VNĐ)</th>
              </tr>
            </thead>
            <tbody>
              {quote.items.map((item, idx) => (
                <tr key={item.id}>
                  <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                  <td>
                    <strong>{item.productName}</strong>
                    {item.description && (
                      <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{item.description}</div>
                    )}
                  </td>
                  <td>{item.unit}</td>
                  <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right' }}>{formatVndCurrency(item.unitPrice)}</td>
                  <td style={{ textAlign: 'right', color: '#DC2626' }}>
                    {item.discountAmount > 0 ? `- ${formatVndCurrency(item.discountAmount)}` : '—'}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>
                    {formatVndCurrency(item.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Tổng tiền bản in */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
            <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Tổng tiền hàng:</span>
                <strong>{formatVndCurrency(quote.subtotal)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#DC2626' }}>
                <span>Tổng chiết khấu ({quote.totalDiscountPercent}%):</span>
                <strong>- {formatVndCurrency(quote.totalDiscountAmount)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Thuế GTGT (VAT):</span>
                <strong>{formatVndCurrency(quote.totalVatAmount)}</strong>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '2px solid #0F172A',
                  paddingTop: 8,
                  fontSize: '1.05rem',
                  color: '#1D4ED8',
                  fontWeight: 800,
                }}
              >
                <span>TỔNG CỘNG:</span>
                <span>{formatVndCurrency(quote.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Điều khoản thương mại */}
          <div style={{ marginTop: 14, fontSize: '0.875rem', lineHeight: 1.6, color: '#334155' }}>
            <p style={{ margin: '4px 0' }}>
              <strong>1. Điều khoản thanh toán:</strong> {quote.paymentTerms}
            </p>
            <p style={{ margin: '4px 0' }}>
              <strong>2. Điều khoản giao hàng:</strong> {quote.deliveryTerms}
            </p>
            {quote.notes && (
              <p style={{ margin: '4px 0' }}>
                <strong>3. Ghi chú &amp; SLA:</strong> {quote.notes}
              </p>
            )}
          </div>

          {/* Chữ ký hai bên */}
          <div className={styles.previewSignatureRow}>
            <div className={styles.signatureBox}>
              <strong>ĐẠI DIỆN KHÁCH HÀNG</strong>
              <span>(Ký, ghi rõ họ tên &amp; đóng dấu)</span>
            </div>
            <div className={styles.signatureBox}>
              <strong>ĐẠI DIỆN NEXUS CRM</strong>
              <span>(Người lập: {quote.createdBy})</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
          <Button type="button" variant="secondary" onClick={() => setIsPreviewModalOpen(false)}>
            Đóng
          </Button>
          <Button
            type="button"
            variant="primary"
            leftIcon={<Printer size={16} />}
            onClick={handlePrint}
            title="In trực tiếp hoặc lưu dưới dạng file PDF"
          >
            In báo giá / Xuất PDF
          </Button>
        </div>
      </Modal>

      {/* ====================================================================
          9. Modal So Sánh Trực Quan Giữa Các Phiên Bản
          ==================================================================== */}
      <Modal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        title="So Sánh Phiên Bản Báo Giá"
        subtitle={`Phiên bản hiện tại: v${quote.version} (${quote.quoteNumber})`}
        maxWidth="lg"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Target Version Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#F8FAFC', padding: '12px 16px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#475569' }}>
              Chọn phiên bản để so sánh cùng:
            </span>
            <select
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.875rem', fontWeight: 600 }}
              value={targetCompareQuoteId}
              onChange={(e) => void handleSelectCompareTarget(e.target.value)}
            >
              {dealQuotesList
                .filter((q) => q.id !== quote.id)
                .map((q) => (
                  <option key={q.id} value={q.id}>
                    Phiên bản v{q.version} - {q.quoteNumber} ({formatVndCurrency(q.grandTotal)} - {q.status})
                  </option>
                ))}
            </select>
          </div>

          {isComparing ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <LoadingSkeleton height={120} />
            </div>
          ) : !compareData ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>
              <GitCompare size={36} color="#94A3B8" style={{ margin: '0 auto 8px' }} />
              <p>Chưa có phiên bản khác của báo giá này để thực hiện so sánh.</p>
            </div>
          ) : (
            <>
              {/* Summary Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                <div style={{ background: '#EFF6FF', padding: 14, borderRadius: 8, border: '1px solid #BFDBFE' }}>
                  <div style={{ fontSize: '0.75rem', color: '#1E40AF', textTransform: 'uppercase', fontWeight: 700 }}>
                    Chênh lệch tổng giá trị:
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: compareData.priceDifference > 0 ? '#DC2626' : compareData.priceDifference < 0 ? '#16A34A' : '#1E293B', marginTop: 4 }}>
                    {compareData.priceDifference > 0 ? `+ ${formatVndCurrency(compareData.priceDifference)}` : compareData.priceDifference < 0 ? `- ${formatVndCurrency(Math.abs(compareData.priceDifference))}` : '0 đ (Không đổi)'}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#475569', textTransform: 'uppercase', fontWeight: 700 }}>
                    Biến động chiết khấu:
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
                    {compareData.discountDifference > 0 ? `+${compareData.discountDifference.toFixed(1)}%` : `${compareData.discountDifference.toFixed(1)}%`}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#475569', textTransform: 'uppercase', fontWeight: 700 }}>
                    Thay đổi dòng sản phẩm:
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: compareData.itemsModified ? '#D97706' : '#16A34A', marginTop: 6 }}>
                    {compareData.itemsModified ? '● Có chỉnh sửa' : '○ Giữ nguyên'}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#475569', textTransform: 'uppercase', fontWeight: 700 }}>
                    Điều khoản thương mại:
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: compareData.termsModified ? '#D97706' : '#16A34A', marginTop: 6 }}>
                    {compareData.termsModified ? '● Đã sửa đổi' : '○ Không đổi'}
                  </div>
                </div>
              </div>

              {/* Side-by-side Table Comparison */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Version A */}
                <div style={{ border: '1.5px solid #2563EB', borderRadius: 8, padding: 16, background: '#FFFFFF' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid #E2E8F0', paddingBottom: 8 }}>
                    <h4 style={{ margin: 0, color: '#2563EB' }}>
                      Phiên bản A (v{compareData.versionA.version}) {compareData.versionA.id === quote.id ? '· [Hiện tại]' : ''}
                    </h4>
                    <Badge tone={compareData.versionA.isEffective ? 'success' : 'neutral'} size="sm">
                      {compareData.versionA.isEffective ? 'Đang hiệu lực' : 'Lưu trữ'}
                    </Badge>
                  </div>
                  <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div>Mã số: <strong>{compareData.versionA.quoteNumber}</strong></div>
                    <div>Tổng thanh toán: <strong style={{ color: '#2563EB', fontSize: '1rem' }}>{formatVndCurrency(compareData.versionA.grandTotal)}</strong></div>
                    <div>Mức chiết khấu: <strong>{compareData.versionA.totalDiscountPercent}%</strong> (-{formatVndCurrency(compareData.versionA.totalDiscountAmount)})</div>
                    <div>Số lượng dòng sản phẩm: <strong>{compareData.versionA.items.length}</strong></div>
                    <div>Điều khoản thanh toán: <em>{compareData.versionA.paymentTerms || '—'}</em></div>
                  </div>
                </div>

                {/* Version B */}
                <div style={{ border: '1.5px solid #CBD5E1', borderRadius: 8, padding: 16, background: '#FFFFFF' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid #E2E8F0', paddingBottom: 8 }}>
                    <h4 style={{ margin: 0, color: '#475569' }}>
                      Phiên bản B (v{compareData.versionB.version}) {compareData.versionB.id === quote.id ? '· [Hiện tại]' : ''}
                    </h4>
                    <Badge tone={compareData.versionB.isEffective ? 'success' : 'neutral'} size="sm">
                      {compareData.versionB.isEffective ? 'Đang hiệu lực' : 'Lưu trữ'}
                    </Badge>
                  </div>
                  <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div>Mã số: <strong>{compareData.versionB.quoteNumber}</strong></div>
                    <div>Tổng thanh toán: <strong style={{ color: '#0F172A', fontSize: '1rem' }}>{formatVndCurrency(compareData.versionB.grandTotal)}</strong></div>
                    <div>Mức chiết khấu: <strong>{compareData.versionB.totalDiscountPercent}%</strong> (-{formatVndCurrency(compareData.versionB.totalDiscountAmount)})</div>
                    <div>Số lượng dòng sản phẩm: <strong>{compareData.versionB.items.length}</strong></div>
                    <div>Điều khoản thanh toán: <em>{compareData.versionB.paymentTerms || '—'}</em></div>
                  </div>
                </div>
              </div>
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
            <Button type="button" variant="secondary" onClick={() => setIsCompareModalOpen(false)}>
              Đóng So Sánh
            </Button>
          </div>
        </div>
      </Modal>

      {/* ====================================================================
          10. Modal Chuyển Đổi Sang Hợp Đồng
          ==================================================================== */}
      <Modal
        isOpen={isContractModalOpen}
        onClose={() => setIsContractModalOpen(false)}
        title="Chuyển Báo Giá Sang Hợp Đồng"
        subtitle="Kế thừa toàn bộ dòng hàng và giá thỏa thuận, tự động đánh dấu Cơ hội thành Thắng (Won)"
        maxWidth="lg"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '12px 16px', borderRadius: 8, fontSize: '0.875rem', color: '#1E40AF' }}>
            Báo giá <strong>{quote.quoteNumber}</strong> với tổng giá trị <strong>{formatVndCurrency(quote.grandTotal)}</strong> ({quote.items.length} dòng sản phẩm) sẽ được kế thừa nguyên trạng vào Hợp đồng.
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6 }}>
              Số hợp đồng (Duy nhất toàn hệ thống): <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <input
              type="text"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.9375rem', boxSizing: 'border-box' }}
              value={contractNumber}
              onChange={(e) => setContractNumber(e.target.value)}
              placeholder="VD: HD-2026-089"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8125rem', marginBottom: 4 }}>
                Ngày ký: <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="date"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1' }}
                value={signingDate}
                onChange={(e) => setSigningDate(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8125rem', marginBottom: 4 }}>
                Ngày bắt đầu hiệu lực: <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="date"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1' }}
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8125rem', marginBottom: 4 }}>
                Ngày hết hạn: <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="date"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1' }}
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6 }}>
              Điều khoản thanh toán hợp đồng:
            </label>
            <input
              type="text"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.875rem', boxSizing: 'border-box' }}
              value={contractPaymentTerms}
              onChange={(e) => setContractPaymentTerms(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
            <Button type="button" variant="secondary" onClick={() => setIsContractModalOpen(false)} disabled={isConvertingContract}>
              Hủy
            </Button>
            <Button
              type="button"
              variant="primary"
              leftIcon={<FileCheck2 size={16} />}
              onClick={() => void handleConvertToContract()}
              disabled={isConvertingContract}
            >
              {isConvertingContract ? 'Đang tạo Hợp đồng...' : 'Xác Nhận Tạo Hợp Đồng & Đóng Thắng (Won)'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ====================================================================
          11. Modal Chia Sẻ Liên Kết Cho Khách Hàng
          ==================================================================== */}
      <Modal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title="Liên Kết Duyệt Báo Giá Trực Tuyến"
        subtitle="Khách hàng có thể truy cập để xem chi tiết và Chấp thuận hoặc Từ chối trực tiếp"
        maxWidth="md"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#475569' }}>
            Đường dẫn truy cập an toàn độc quyền dành cho khách hàng <strong>{quote.customerCompany || quote.customerName}</strong>:
          </p>

          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              readOnly
              style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#F8FAFC', fontSize: '0.875rem' }}
              value={portalUrl}
            />
            <Button
              type="button"
              variant={isCopied ? 'secondary' : 'primary'}
              leftIcon={isCopied ? <Check size={16} color="#16A34A" /> : <Copy size={16} />}
              onClick={handleCopyLink}
            >
              {isCopied ? 'Đã sao chép' : 'Sao chép'}
            </Button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <Button
              type="button"
              variant="secondary"
              leftIcon={<ExternalLink size={15} />}
              onClick={() => window.open(portalUrl, '_blank')}
            >
              Mở Trang Cổng Khách Hàng
            </Button>
            <Button type="button" variant="primary" onClick={() => setIsShareModalOpen(false)}>
              Xong
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
