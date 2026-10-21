import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  Building,
  User,
  Phone,
  Mail,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { IQuote } from '../interfaces/quote.interface';
import { quoteService } from '../services/quoteService';
import { formatVndCurrency, toLocalDateInputValue } from '../utils/formatters';
import { Button, Modal, LoadingSkeleton } from '../components/common';
import { showGlobalToast } from '../context/ToastContext';
import styles from './CustomerQuotePortalPage.module.css';

export const CustomerQuotePortalPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [quote, setQuote] = useState<IQuote | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Response Modals
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState<boolean>(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);
  const [signerName, setSignerName] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (!token) {
      setLoadError('Đường dẫn truy cập báo giá không hợp lệ.');
      setIsLoading(false);
      return;
    }

    const fetchQuote = async () => {
      try {
        setIsLoading(true);
        const data = await quoteService.getPublicQuoteAsync(token);
        setQuote(data);
        if (data.customerName) {
          setSignerName(data.customerName);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Không tìm thấy thông tin báo giá.';
        setLoadError(msg);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchQuote();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    if (!signerName.trim()) {
      showGlobalToast('Vui lòng nhập họ và tên người đại diện ký duyệt.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await quoteService.respondPublicQuoteAsync(
        token,
        'accepted',
        comment.trim(),
        signerName.trim()
      );
      setQuote(updated);
      setIsAcceptModalOpen(false);
      showGlobalToast('Cảm ơn Quý khách! Báo giá đã được chấp thuận thành công.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra khi xác nhận báo giá.';
      showGlobalToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!token) return;
    if (!comment.trim()) {
      showGlobalToast('Vui lòng nêu rõ lý do từ chối báo giá.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await quoteService.respondPublicQuoteAsync(
        token,
        'rejected',
        comment.trim(),
        signerName.trim()
      );
      setQuote(updated);
      setIsRejectModalOpen(false);
      showGlobalToast('Quý khách đã từ chối báo giá. Chúng tôi sẽ liên hệ lại sớm nhất.', 'info');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra khi từ chối báo giá.';
      showGlobalToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.portalContainer}>
        <div className={styles.portalContent}>
          <LoadingSkeleton height={100} />
          <div style={{ marginTop: 24 }}>
            <LoadingSkeleton height={400} />
          </div>
        </div>
      </div>
    );
  }

  if (loadError || !quote) {
    return (
      <div className={styles.portalContainer}>
        <div className={styles.portalContent} style={{ textAlign: 'center', marginTop: 80 }}>
          <AlertTriangle size={54} color="#DC2626" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ color: '#991B1B' }}>Không thể truy cập báo giá</h2>
          <p style={{ color: '#64748B' }}>{loadError || 'Báo giá này không tồn tại hoặc liên kết đã bị thu hồi.'}</p>
        </div>
      </div>
    );
  }

  const isExpired = Boolean(
    quote.status !== 'accepted' &&
      quote.validUntil &&
      quote.validUntil < toLocalDateInputValue()
  );
  const canRespond =
    (quote.status === 'sent' || quote.status === 'approved') && !isExpired;

  return (
    <div className={styles.portalContainer}>
      {/* Top Navbar */}
      <header className={styles.portalTopNav}>
        <div className={styles.brandWrap}>
          <div className={styles.brandLogo}>N</div>
          <span className={styles.brandTitle}>NexusCRM Client Portal</span>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          leftIcon={<Printer size={16} />}
          onClick={() => window.print()}
        >
          In Báo Giá
        </Button>
      </header>

      {/* Main Content */}
      <main className={styles.portalContent}>
        {/* Status Banners */}
        {quote.status === 'accepted' && (
          <div className={styles.acceptedBanner}>
            <CheckCircle2 size={24} />
            <div>
              <strong>Báo giá này đã được chấp thuận!</strong>
              <p style={{ margin: '2px 0 0', fontSize: '0.875rem' }}>
                Bộ phận kinh doanh NexusCRM đã nhận được thông tin và đang tiến hành chuẩn bị hợp đồng triển khai.
              </p>
            </div>
          </div>
        )}

        {quote.status === 'rejected' && !isExpired && (
          <div className={styles.rejectedBanner}>
            <XCircle size={24} color="#DC2626" />
            <div>
              <strong>Báo giá đã bị từ chối</strong>
              <p style={{ margin: '2px 0 0', fontSize: '0.875rem' }}>
                Quý khách đã gửi phản hồi từ chối bản báo giá này.
              </p>
            </div>
          </div>
        )}

        {isExpired && (
          <div className={styles.expiredBanner}>
            <Clock size={24} />
            <div>
              <strong>Báo giá đã hết thời hạn hiệu lực!</strong>
              <p style={{ margin: '2px 0 0', fontSize: '0.875rem' }}>
                Thời hạn hiệu lực của bản báo giá này đã kết thúc vào ngày {quote.validUntil}. Vui lòng liên hệ chuyên viên để nhận báo giá mới.
              </p>
            </div>
          </div>
        )}

        {/* Quote Card */}
        <div className={styles.quoteCard}>
          <div className={styles.cardHeader}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileText size={22} color="#2563EB" />
                <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0F172A' }}>
                  BÁO GIÁ THƯƠNG MẠI
                </h1>
              </div>
              <div style={{ color: '#64748B', fontSize: '0.875rem', marginTop: 4 }}>
                Mã số: <strong style={{ color: '#1E293B' }}>{quote.quoteNumber}</strong> · Phiên bản: <strong>v{quote.version}</strong>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.875rem', color: '#64748B' }}>
                Ngày phát hành: <strong>{quote.createdAt ? quote.createdAt.slice(0, 10) : ''}</strong>
              </div>
              <div style={{ fontSize: '0.875rem', color: '#DC2626', fontWeight: 600, marginTop: 4 }}>
                Hiệu lực đến: <strong>{quote.validUntil || 'Theo thỏa thuận'}</strong>
              </div>
            </div>
          </div>

          <div className={styles.cardBody}>
            {/* Meta Grid */}
            <div className={styles.metaGrid}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#475569', textTransform: 'uppercase', marginBottom: 8 }}>
                  Kính gửi Khách hàng:
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>
                  {quote.customerCompany || quote.customerName}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <User size={14} /> Người liên hệ: {quote.customerName}
                </div>
                {quote.customerPhone && (
                  <div style={{ fontSize: '0.875rem', color: '#475569', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <Phone size={14} /> {quote.customerPhone}
                  </div>
                )}
                {quote.customerEmail && (
                  <div style={{ fontSize: '0.875rem', color: '#475569', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <Mail size={14} /> {quote.customerEmail}
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#475569', textTransform: 'uppercase', marginBottom: 8 }}>
                  Đơn vị cung cấp giải pháp:
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>
                  CÔNG TY CỔ PHẦN CÔNG NGHỆ NEXUS CRM
                </div>
                <div style={{ fontSize: '0.875rem', color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Building size={14} /> Tòa nhà Nexus Tower, Cầu Giấy, Hà Nội
                </div>
                <div style={{ fontSize: '0.875rem', color: '#475569', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <User size={14} /> Chuyên viên tư vấn: {quote.createdBy || 'Nexus Account Executive'}
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className={styles.tableWrap}>
              <table className={styles.portalTable}>
                <thead>
                  <tr>
                    <th style={{ width: 40, textAlign: 'center' }}>STT</th>
                    <th>Sản phẩm / Dịch vụ</th>
                    <th style={{ width: 80, textAlign: 'center' }}>ĐVT</th>
                    <th style={{ width: 70, textAlign: 'center' }}>Số lượng</th>
                    <th style={{ width: 130, textAlign: 'right' }}>Đơn giá</th>
                    <th style={{ width: 110, textAlign: 'right' }}>Chiết khấu</th>
                    <th style={{ width: 140, textAlign: 'right' }}>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.items.map((item, idx) => (
                    <tr key={item.id}>
                      <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                      <td>
                        <strong>{item.productName}</strong>
                        {item.description && (
                          <div style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: 2 }}>
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>{item.unit}</td>
                      <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right' }}>{formatVndCurrency(item.unitPrice)}</td>
                      <td style={{ textAlign: 'right', color: item.discountAmount > 0 ? '#DC2626' : undefined }}>
                        {item.discountAmount > 0 ? `- ${formatVndCurrency(item.discountAmount)}` : '0 đ'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>
                        {formatVndCurrency(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className={styles.totalsGrid}>
              <div className={styles.totalsBox}>
                <div className={styles.totalsRow}>
                  <span style={{ color: '#64748B' }}>Tổng tiền hàng:</span>
                  <strong>{formatVndCurrency(quote.subtotal)}</strong>
                </div>
                <div className={styles.totalsRow} style={{ color: '#DC2626' }}>
                  <span>Chiết khấu ({quote.totalDiscountPercent}%):</span>
                  <strong>- {formatVndCurrency(quote.totalDiscountAmount)}</strong>
                </div>
                <div className={styles.totalsRow}>
                  <span style={{ color: '#64748B' }}>Thuế GTGT (VAT):</span>
                  <strong>{formatVndCurrency(quote.totalVatAmount)}</strong>
                </div>
                <div className={styles.grandTotalRow}>
                  <span>TỔNG THANH TOÁN:</span>
                  <span>{formatVndCurrency(quote.grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* In Words */}
            {quote.totalInWords && (
              <div className={styles.wordsBox}>
                <strong>Số tiền viết bằng chữ:</strong> {quote.totalInWords}
              </div>
            )}

            {/* Terms and conditions */}
            <div className={styles.termsBox}>
              <h4 style={{ margin: '0 0 10px', fontSize: '0.9375rem', color: '#0F172A' }}>
                ĐIỀU KHOẢN THƯƠNG MẠI &amp; BẢO HÀNH
              </h4>
              <p style={{ margin: '4px 0' }}>
                <strong>Điều khoản thanh toán:</strong> {quote.paymentTerms || 'Theo thỏa thuận hai bên.'}
              </p>
              <p style={{ margin: '4px 0' }}>
                <strong>Điều khoản giao hàng:</strong> {quote.deliveryTerms || 'Theo quy chuẩn dịch vụ SaaS NexusCRM.'}
              </p>
              {quote.notes && (
                <p style={{ margin: '4px 0' }}>
                  <strong>Ghi chú cam kết:</strong> {quote.notes}
                </p>
              )}
            </div>

            {/* Action Bar for Customer */}
            {canRespond && (
              <div className={styles.actionsBar}>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  leftIcon={<XCircle size={18} />}
                  onClick={() => setIsRejectModalOpen(true)}
                >
                  Từ chối Báo giá
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  leftIcon={<CheckCircle2 size={18} />}
                  onClick={() => setIsAcceptModalOpen(true)}
                >
                  Chấp nhận Báo giá
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal Chấp Nhận */}
      <Modal
        isOpen={isAcceptModalOpen}
        onClose={() => setIsAcceptModalOpen(false)}
        title="Xác Nhận Chấp Nhận Báo Giá"
        subtitle="Quý khách vui lòng xác nhận thông tin đại diện để NexusCRM hoàn thiện hợp đồng"
        maxWidth="md"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6 }}>
              Họ và tên người ký duyệt / Đại diện doanh nghiệp: <span style={{ color: '#DC2626' }}>*</span>
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
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="VD: Nguyễn Văn A - Giám đốc điều hành"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6 }}>
              Ý kiến phản hồi bổ sung (nếu có):
            </label>
            <textarea
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: '0.875rem',
                minHeight: 80,
                boxSizing: 'border-box',
              }}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ghi chú về thời gian ký hợp đồng hoặc triển khai..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAcceptModalOpen(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleAccept}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang gửi...' : 'Xác nhận Chấp thuận'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Từ Chối */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Từ Chối Báo Giá"
        subtitle="Quý khách vui lòng cho chúng tôi biết lý do để cải thiện dịch vụ"
        maxWidth="md"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6 }}>
              Lý do từ chối: <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <textarea
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: '0.875rem',
                minHeight: 90,
                boxSizing: 'border-box',
              }}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ví dụ: Đơn giá chưa phù hợp ngân sách, cần điều chỉnh danh mục sản phẩm..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsRejectModalOpen(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleReject}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang gửi...' : 'Gửi phản hồi Từ chối'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
