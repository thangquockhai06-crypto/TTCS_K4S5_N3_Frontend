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
  ArrowLeftRight,
  GitBranch,
  Check,
} from 'lucide-react';
import { IQuote } from '../../interfaces/quote.interface';
import { IDeal } from '../../interfaces/deal.interface';
import { useQuoteBuilder } from '../../hooks/useQuoteBuilder';
import { formatCurrency, formatVndCurrency } from '../../utils/formatters';
import { Button, Modal, LoadingSkeleton, Badge } from '../common';
import { QuoteDiffViewer } from './QuoteDiffViewer';
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
    versions,
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
    switchVersion,
    createNewVersion,
    setEffectiveVersion,
  } = useQuoteBuilder({ dealId, initialDeal });

  // Modals
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState<boolean>(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState<boolean>(false);
  const [isNewVersionModalOpen, setIsNewVersionModalOpen] = useState<boolean>(false);
  const [newVersionReason, setNewVersionReason] = useState<string>('');
  const [isCreatingNewVersion, setIsCreatingNewVersion] = useState<boolean>(false);


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

  const handleCreateNewVersionSubmit = async () => {
    if (!newVersionReason.trim()) return;
    setIsCreatingNewVersion(true);
    try {
      const created = await createNewVersion(newVersionReason.trim());
      if (created) {
        setIsNewVersionModalOpen(false);
        setNewVersionReason('');
      }
    } finally {
      setIsCreatingNewVersion(false);
    }
  };

  const handlePrint = () => {
    window.print();
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

                {/* S7-03: Dropdown chọn version báo giá */}
                <div className={styles.versionDropdownWrap}>
                  <span>Phiên bản:</span>
                  <select
                    className={styles.versionSelectHeader}
                    value={quote.id}
                    onChange={(e) => {
                      const selected = versions.find((v) => v.id === e.target.value);
                      if (selected) switchVersion(selected);
                    }}
                    title="Chọn phiên bản báo giá để xem hoặc soạn thảo"
                    aria-label="Dropdown chọn version báo giá"
                  >
                    {versions.map((ver) => (
                      <option key={ver.id} value={ver.id}>
                        v{ver.version} ({ver.versionLabel || `Bản v${ver.version}`}) —{' '}
                        {ver.status === 'draft'
                          ? 'Bản nháp'
                          : ver.status === 'sent'
                          ? 'Đã gửi'
                          : ver.status === 'approved'
                          ? 'Đã duyệt'
                          : 'Lưu trữ'}
                        {ver.isEffective ? ' ★ Đang hiệu lực' : ''}
                      </option>
                    ))}
                  </select>
                  {quote.isEffective && (
                    <span
                      className={styles.versionEffectiveBadge}
                      title="Chỉ một phiên bản ở trạng thái đang hiệu lực tại một thời điểm: Đây là phiên bản đang có hiệu lực pháp lý"
                    >
                      <Check size={12} /> Đang hiệu lực
                    </span>
                  )}
                </div>

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

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Nút Đặt làm hiệu lực nếu phiên bản này chưa là hiệu lực và đã gửi/duyệt */}
            {!quote.isEffective && (quote.status === 'approved' || quote.status === 'sent') && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                leftIcon={<CheckCircle2 size={15} />}
                onClick={() => setEffectiveVersion(quote.id)}
                title="Chỉ một phiên bản ở trạng thái đang hiệu lực tại một thời điểm: Bấm để đặt phiên bản này làm hiệu lực duy nhất"
              >
                Đặt làm hiệu lực
              </Button>
            )}

            {/* S7-03: Nút mở giao diện QuoteDiffViewer so sánh 2 phiên bản cạnh nhau */}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<ArrowLeftRight size={15} />}
              onClick={() => setIsDiffModalOpen(true)}
              title="Mở giao diện QuoteDiffViewer.tsx để so sánh 2 phiên bản cạnh nhau"
            >
              So sánh phiên bản ({versions.length})
            </Button>

            {/* S7-03: Nút Tạo phiên bản mới khi muốn sửa sau khi đã gửi */}
            <Button
              type="button"
              variant={isReadOnly ? 'primary' : 'secondary'}
              size="sm"
              leftIcon={<GitBranch size={15} />}
              onClick={() => {
                setNewVersionReason('');
                setIsNewVersionModalOpen(true);
              }}
              title="Mỗi lần sửa sau khi đã gửi sẽ tạo phiên bản mới, phiên bản cũ được giữ nguyên 100%"
            >
              + Tạo phiên bản mới (v{versions.length + 1})
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<Printer size={15} />}
              onClick={() => setIsPreviewModalOpen(true)}
              title="Xem trước định dạng in hoặc xuất PDF bản báo giá"
            >
              Xem trước / In báo giá
            </Button>
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

      {/* S7-03: Cảnh báo trạng thái khóa phiên bản cũ khi đã phát hành/gửi */}
      {isReadOnly && (
        <div className={styles.readOnlyNoticeBanner} role="status">
          <div className={styles.readOnlyNoticeText}>
            <ShieldAlert size={22} style={{ flexShrink: 0 }} />
            <span>
              Bạn đang xem lại <strong>Phiên bản v{quote.version}</strong> (Trạng thái:{' '}
              <strong>
                {quote.status === 'sent'
                  ? 'Đã phát hành gửi khách hàng'
                  : quote.status === 'approved'
                  ? 'Đã được duyệt'
                  : quote.status === 'accepted'
                  ? 'Đã được khách chấp nhận'
                  : 'Bản lưu trữ'}
              </strong>
              {quote.isEffective ? ' · Đang hiệu lực' : ''}). Phiên bản này được khóa để bảo toàn cam kết với khách hàng ở lần gửi trước.
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Button
              type="button"
              variant="primary"
              size="sm"
              leftIcon={<GitBranch size={15} />}
              onClick={() => {
                setNewVersionReason('');
                setIsNewVersionModalOpen(true);
              }}
              title="Mỗi lần sửa sau khi đã gửi sẽ tạo phiên bản mới, phiên bản cũ được giữ nguyên 100%"
            >
              Tạo phiên bản mới (v{versions.length + 1})
            </Button>
          </div>
        </div>
      )}


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

            {isReadOnly && (
              <Button
                type="button"
                variant="primary"
                size="md"
                leftIcon={<GitBranch size={16} />}
                onClick={() => {
                  setNewVersionReason('');
                  setIsNewVersionModalOpen(true);
                }}
                title="Mỗi lần sửa sau khi đã gửi sẽ tạo phiên bản mới, phiên bản cũ được giữ nguyên 100%"
              >
                + Tạo phiên bản mới (v{versions.length + 1})
              </Button>
            )}


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
          9. S7-03: Modal Giao Diện QuoteDiffViewer So Sánh 2 Phiên Bản Cạnh Nhau
          ==================================================================== */}
      <Modal
        isOpen={isDiffModalOpen}
        onClose={() => setIsDiffModalOpen(false)}
        title="Đối Chiếu &amp; So Sánh Phiên Bản Báo Giá (QuoteDiffViewer)"
        subtitle={`Mã báo giá: ${quote.quoteNumber} · Khách hàng: ${quote.customerCompany || quote.customerName}`}
        maxWidth="lg"
      >
        <QuoteDiffViewer
          dealId={quote.dealId}
          initialBaseVersionId={versions.length > 1 ? versions[versions.length - 2].id : versions[0]?.id}
          initialTargetVersionId={quote.id}
          onClose={() => setIsDiffModalOpen(false)}
          onSelectVersion={(v) => {
            switchVersion(v);
            setIsDiffModalOpen(false);
          }}
        />
      </Modal>

      {/* ====================================================================
          10. S7-03: Modal Tạo Phiên Bản Báo Giá Mới (Fork Revision)
          ==================================================================== */}
      <Modal
        isOpen={isNewVersionModalOpen}
        onClose={() => setIsNewVersionModalOpen(false)}
        title="Tạo Phiên Bản Báo Giá Mới"
        subtitle={`Kế thừa từ Phiên bản v${quote.version} (${quote.quoteNumber})`}
        maxWidth="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsNewVersionModalOpen(false)}
              title="Hủy bỏ không tạo phiên bản mới"
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="primary"
              leftIcon={<GitBranch size={15} />}
              disabled={!newVersionReason.trim() || isCreatingNewVersion}
              isLoading={isCreatingNewVersion}
              onClick={handleCreateNewVersionSubmit}
              title="Xác nhận tạo phiên bản mới; phiên bản cũ giữ nguyên 100%"
            >
              Tạo phiên bản v{versions.length + 1}
            </Button>
          </div>
        }
      >
        <div className={styles.newVersionModalForm}>
          <div className={styles.newVersionModalNote}>
            <strong>Quy tắc cam kết:</strong> Mỗi lần sửa sau khi đã gửi sẽ tạo phiên bản mới (v
            {versions.length + 1}) dạng bản nháp để bạn chỉnh sửa. Phiên bản cũ (v{quote.version})
            cùng toàn bộ dữ liệu giá và cam kết với khách hàng ở lần gửi trước sẽ được{' '}
            <strong>giữ nguyên 100%</strong>.
          </div>

          <div>
            <label
              htmlFor="new-version-reason"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 700,
                color: '#334155',
                marginBottom: 8,
              }}
            >
              Lý do sửa đổi / Tạo phiên bản mới <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <textarea
              id="new-version-reason"
              className={styles.newVersionTextarea}
              rows={4}
              value={newVersionReason}
              onChange={(e) => setNewVersionReason(e.target.value)}
              placeholder="Ví dụ: Khách hàng yêu cầu tăng số lượng user, giảm giá thêm 3% và đổi điều khoản thanh toán sang 30 ngày..."
              autoFocus
              title="Nhập lý do tạo phiên bản mới"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

