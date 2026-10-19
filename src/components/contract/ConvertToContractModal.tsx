import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Calendar,
  CreditCard,
  Truck,
  Building,
  User,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Trophy,
  ShieldCheck,
  Package,
} from 'lucide-react';
import { IQuote } from '../../interfaces/quote.interface';
import { IContract, ICreateContractFromQuoteDTO } from '../../interfaces/contract.interface';
import { contractService } from '../../services/contractService';
import { formatVndCurrency } from '../../utils/formatters';
import { showGlobalToast } from '../../context/ToastContext';
import { Button, Modal, Badge } from '../common';
import { useAuth } from '../../hooks/useAuth';
import { useAuthorization } from '../../hooks/useAuthorization';
import styles from './ConvertToContractModal.module.css';

export interface IConvertToContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: IQuote;
  onSuccess?: (contract: IContract) => void;
}

export const ConvertToContractModal: React.FC<IConvertToContractModalProps> = ({
  isOpen,
  onClose,
  quote,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { role } = useAuthorization();

  // State form fields
  const [contractNumber, setContractNumber] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [signingDate, setSigningDate] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [paymentTerms, setPaymentTerms] = useState<string>('');
  const [deliveryTerms, setDeliveryTerms] = useState<string>('');
  const [signatoryPartyA, setSignatoryPartyA] = useState<string>('');
  const [signatoryPartyB, setSignatoryPartyB] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Khởi tạo giá trị kế thừa từ báo giá khi modal mở ra
  useEffect(() => {
    if (isOpen && quote) {
      const today = new Date();
      const todayString = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0'),
      ].join('-');

      // Ngày hết hạn mặc định: 1 năm sau ngày ký
      const nextYear = new Date(today);
      nextYear.setFullYear(today.getFullYear() + 1);
      const nextYearString = [
        nextYear.getFullYear(),
        String(nextYear.getMonth() + 1).padStart(2, '0'),
        String(nextYear.getDate()).padStart(2, '0'),
      ].join('-');

      const defaultNumber = contractService.generateContractNumber(quote.quoteNumber);
      setContractNumber(defaultNumber);
      setTitle(`Hợp đồng kinh tế cung cấp giải pháp Nexus CRM cho ${quote.customerCompany || quote.customerName}`);
      setSigningDate(todayString);
      setStartDate(todayString);
      setEndDate(nextYearString);
      setPaymentTerms(quote.paymentTerms || 'Thanh toán 100% trong vòng 15 ngày kể từ ngày ký hợp đồng và nhận hóa đơn VAT.');
      setDeliveryTerms(quote.deliveryTerms || 'Bàn giao tài khoản và kích hoạt hệ thống trong vòng 24 giờ sau khi ký.');
      setSignatoryPartyA(quote.customerName || 'Đại diện Khách hàng');
      setSignatoryPartyB(user?.fullName || 'Đại diện Công ty Cổ phần Công nghệ Nexus CRM');
      setNotes(quote.notes || '');
      setFormErrors({});
    }
  }, [isOpen, quote, user]);

  // Kiểm tra tính duy nhất của số hợp đồng trong thời gian thực (S7-04: Số hợp đồng là duy nhất)
  const isNumberUnique = contractNumber.trim()
    ? contractService.isContractNumberUnique(contractNumber.trim())
    : false;

  // Sinh số hợp đồng mới ngẫu nhiên
  const handleRegenerateNumber = () => {
    const fresh = contractService.generateContractNumber(quote.quoteNumber);
    setContractNumber(fresh);
    setFormErrors((prev) => ({ ...prev, contractNumber: '' }));
  };

  // Xác thực form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!contractNumber.trim()) {
      errors.contractNumber = 'Vui lòng nhập số hợp đồng.';
    } else if (!isNumberUnique) {
      errors.contractNumber = 'Số hợp đồng này đã tồn tại trong hệ thống. Quy định: Số hợp đồng là duy nhất.';
    }

    if (!title.trim()) {
      errors.title = 'Vui lòng nhập tiêu đề hợp đồng.';
    }

    if (!signingDate) {
      errors.signingDate = 'Vui lòng chọn ngày ký hợp đồng.';
    }

    if (!startDate) {
      errors.startDate = 'Vui lòng chọn ngày hiệu lực hợp đồng.';
    }

    if (!endDate) {
      errors.endDate = 'Vui lòng chọn ngày hết hạn hợp đồng.';
    } else if (startDate && endDate < startDate) {
      errors.endDate = 'Ngày hết hạn không được trước ngày hiệu lực.';
    }
    if (signingDate && endDate && signingDate > endDate) {
      errors.signingDate = 'Ngày ký không được sau ngày hết hạn hợp đồng.';
    }

    if (!paymentTerms.trim()) {
      errors.paymentTerms = 'Vui lòng nhập điều khoản thanh toán.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Xử lý tạo hợp đồng & đóng thắng deal
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showGlobalToast('Vui lòng kiểm tra lại các thông tin bắt buộc còn thiếu hoặc sai định dạng.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: ICreateContractFromQuoteDTO = {
        quoteId: quote.id,
        contractNumber: contractNumber.trim().toUpperCase(),
        title: title.trim(),
        signingDate,
        startDate,
        endDate,
        paymentTerms: paymentTerms.trim(),
        deliveryTerms: deliveryTerms.trim(),
        notes: notes.trim(),
        signatoryPartyA: signatoryPartyA.trim(),
        signatoryPartyB: signatoryPartyB.trim(),
      };

      const result = await contractService.createContractFromQuote(
        quote,
        payload,
        user?.fullName || 'Kế toán viên',
        role || 'Kế toán'
      );

      showGlobalToast(
        result.backendDealUpdated
          ? `Đã lập Hợp đồng "${result.contract.contractNumber}" thành công! Cơ hội "${quote.dealTitle}" đã được đồng bộ sang [Đóng thắng - Won] với giá trị ${formatVndCurrency(result.contract.grandTotal)}.`
          : `Hợp đồng "${result.contract.contractNumber}" đã được lưu và đồng bộ trong CRM trên thiết bị này. Chưa thể đồng bộ cơ hội lên máy chủ; hãy kiểm tra kết nối rồi cập nhật lại cơ hội "${quote.dealTitle}".`,
        result.backendDealUpdated ? 'success' : 'warning',
        undefined,
        7000
      );

      if (onSuccess) {
        onSuccess(result.contract);
      }
      onClose();
    } catch (err: unknown) {
      console.error('Lỗi khi chuyển Báo giá thành Hợp đồng:', err);
      showGlobalToast(
        err instanceof Error ? err.message : 'Không thể lập hợp đồng từ báo giá này.',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chuyển Báo Giá Thành Hợp Đồng Kinh Tế"
      subtitle={`Kế thừa từ Báo giá: ${quote.quoteNumber} (v${quote.version}) · Cơ hội: ${quote.dealTitle}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className={styles.modalContainer}>
        {/* ====================================================================
            1. Banner Hướng Dẫn Nghiệp Vụ Kế Toán (Persona Banner)
            ==================================================================== */}
        <section className={styles.accountantBanner} aria-label="Hướng dẫn kế thừa hợp đồng">
          <div className={styles.accountantBannerIcon} aria-hidden="true">
            <FileCheck2 size={22} />
          </div>
          <div className={styles.accountantBannerContent}>
            <h3 className={styles.accountantBannerTitle}>
              Phân hệ Kế toán &amp; Quản trị Hợp đồng thương mại
            </h3>
            <p className={styles.accountantBannerDesc}>
              Toàn bộ dòng sản phẩm, đơn giá và chiết khấu đã chốt sẽ được{' '}
              <strong>tự động kế thừa nguyên vẹn vào hợp đồng mà không phải gõ lại</strong>. Khi tạo
              hợp đồng thành công, cơ hội kinh doanh sẽ tự động chuyển sang trạng thái{' '}
              <strong>[Đóng thắng - Won]</strong> với giá trị đúng bằng giá trị hợp đồng{' '}
              <strong>({formatVndCurrency(quote.grandTotal)})</strong>.
            </p>
          </div>
        </section>

        {/* ====================================================================
            2. Hai Cột: Nhập Thông Tin HĐ & Xem Chi Tiết Kế Thừa Báo Giá
            ==================================================================== */}
        <div className={styles.formGrid}>
          {/* CỘT TRÁI: Khai báo Hợp đồng, Thời hạn, Điều khoản */}
          <div className={styles.formCol}>
            {/* Box 1: Thông tin số HĐ & Tiêu đề */}
            <div className={styles.sectionBox}>
              <h4 className={styles.sectionTitle}>
                <Building size={16} color="#2563EB" />
                Thông Tin Hợp Đồng &amp; Định Danh
              </h4>

              {/* Số Hợp đồng - Quy định duy nhất */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="contract-number-input">
                  Số Hợp đồng <span className={styles.requiredStar}>*</span> (Duy nhất)
                </label>
                <div className={styles.contractNumberRow}>
                  <input
                    id="contract-number-input"
                    type="text"
                    value={contractNumber}
                    onChange={(e) => setContractNumber(e.target.value.toUpperCase())}
                    className={`${styles.textInput} ${formErrors.contractNumber ? styles['textInput--error'] : ''}`}
                    placeholder="VD: HD-2026-089"
                    required
                    title="Số hợp đồng phải là duy nhất trong toàn hệ thống"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    leftIcon={<RotateCcw size={13} />}
                    onClick={handleRegenerateNumber}
                    title="Tự động sinh số hợp đồng mới không trùng lặp"
                  >
                    Gợi ý số mới
                  </Button>
                </div>
                {contractNumber.trim() && isNumberUnique && (
                  <span className={styles.uniqueCheckSuccess}>
                    <CheckCircle2 size={13} /> Số hợp đồng khả dụng &amp; duy nhất trong hệ thống
                  </span>
                )}
                {contractNumber.trim() && !isNumberUnique && (
                  <span className={styles.uniqueCheckError}>
                    <AlertCircle size={13} /> Số hợp đồng này đã tồn tại. Vui lòng chọn số khác.
                  </span>
                )}
                {formErrors.contractNumber && (
                  <span className={styles.uniqueCheckError}>{formErrors.contractNumber}</span>
                )}
              </div>

              {/* Tiêu đề Hợp đồng */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="contract-title-input">
                  Tiêu đề Hợp đồng <span className={styles.requiredStar}>*</span>
                </label>
                <input
                  id="contract-title-input"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`${styles.textInput} ${formErrors.title ? styles['textInput--error'] : ''}`}
                  placeholder="Tiêu đề hợp đồng..."
                  required
                  title="Nhập tiêu đề hoặc tên hợp đồng kinh tế"
                />
                {formErrors.title && (
                  <span className={styles.uniqueCheckError}>{formErrors.title}</span>
                )}
              </div>
            </div>

            {/* Box 2: Thời hạn & Ngày ký */}
            <div className={styles.sectionBox}>
              <h4 className={styles.sectionTitle}>
                <Calendar size={16} color="#2563EB" />
                Thời Hạn &amp; Hiệu Lực Hợp Đồng
              </h4>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="contract-signing-date">
                  Ngày ký hợp đồng <span className={styles.requiredStar}>*</span>
                </label>
                <input
                  id="contract-signing-date"
                  type="date"
                  value={signingDate}
                  onChange={(e) => setSigningDate(e.target.value)}
                  className={`${styles.textInput} ${formErrors.signingDate ? styles['textInput--error'] : ''}`}
                  required
                  title="Chọn ngày chính thức ký kết hợp đồng"
                />
                {formErrors.signingDate && (
                  <span className={styles.uniqueCheckError}>{formErrors.signingDate}</span>
                )}
              </div>

              <div className={styles.dateRow}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="contract-start-date">
                    Ngày hiệu lực <span className={styles.requiredStar}>*</span>
                  </label>
                  <input
                    id="contract-start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={`${styles.textInput} ${formErrors.startDate ? styles['textInput--error'] : ''}`}
                    required
                    title="Chọn ngày hợp đồng bắt đầu có hiệu lực pháp lý"
                  />
                  {formErrors.startDate && (
                    <span className={styles.uniqueCheckError}>{formErrors.startDate}</span>
                  )}
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="contract-end-date">
                    Ngày hết hạn <span className={styles.requiredStar}>*</span>
                  </label>
                  <input
                    id="contract-end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`${styles.textInput} ${formErrors.endDate ? styles['textInput--error'] : ''}`}
                    required
                    title="Chọn ngày hợp đồng hết hạn hiệu lực"
                  />
                  {formErrors.endDate && (
                    <span className={styles.uniqueCheckError}>{formErrors.endDate}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Box 3: Điều khoản & Đại diện ký */}
            <div className={styles.sectionBox}>
              <h4 className={styles.sectionTitle}>
                <CreditCard size={16} color="#2563EB" />
                Điều Khoản Thanh Toán &amp; Bàn Giao
              </h4>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="contract-payment-terms">
                  Điều khoản thanh toán <span className={styles.requiredStar}>*</span>
                </label>
                <textarea
                  id="contract-payment-terms"
                  rows={3}
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className={`${styles.textareaInput} ${formErrors.paymentTerms ? styles['textInput--error'] : ''}`}
                  required
                  placeholder="Khai báo tiến độ và điều kiện thanh toán..."
                  title="Điều khoản thanh toán kế thừa từ báo giá đã chốt"
                />
                {formErrors.paymentTerms && (
                  <span className={styles.uniqueCheckError}>{formErrors.paymentTerms}</span>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="contract-delivery-terms">
                  Điều khoản giao hàng &amp; triển khai
                </label>
                <input
                  id="contract-delivery-terms"
                  type="text"
                  value={deliveryTerms}
                  onChange={(e) => setDeliveryTerms(e.target.value)}
                  className={styles.textInput}
                  placeholder="Tiến độ bàn giao phần mềm & dịch vụ..."
                  title="Điều khoản giao hàng kế thừa từ báo giá"
                />
              </div>

              <div className={styles.dateRow}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="contract-sign-a">
                    Đại diện ký Bên A (Khách hàng)
                  </label>
                  <input
                    id="contract-sign-a"
                    type="text"
                    value={signatoryPartyA}
                    onChange={(e) => setSignatoryPartyA(e.target.value)}
                    className={styles.textInput}
                    placeholder="Họ tên người đại diện khách hàng..."
                    title="Người đại diện khách hàng ký hợp đồng"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="contract-sign-b">
                    Đại diện ký Bên B (Công ty)
                  </label>
                  <input
                    id="contract-sign-b"
                    type="text"
                    value={signatoryPartyB}
                    onChange={(e) => setSignatoryPartyB(e.target.value)}
                    className={styles.textInput}
                    placeholder="Họ tên người đại diện công ty..."
                    title="Người đại diện công ty ký hợp đồng"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: Số liệu Báo giá đã chốt kế thừa 100% (Không phải gõ lại) */}
          <div className={styles.formCol}>
            <div className={styles.inheritedItemsBox}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 className={styles.sectionTitle} style={{ borderBottom: 'none', paddingBottom: 0 }}>
                  <Package size={16} color="#2563EB" />
                  Số Liệu Kế Thừa Từ Báo Giá Đã Chốt
                </h4>
                <Badge tone="success" size="sm">
                  Không cần gõ lại
                </Badge>
              </div>

              {/* Thông tin khách hàng */}
              <div className={styles.customerInfoCard}>
                <span className={styles.customerName}>
                  {quote.customerCompany || quote.customerName}
                </span>
                <div className={styles.customerTaxRow}>
                  <span>Mã số thuế: <strong>{quote.customerTaxCode || 'Chưa cập nhật'}</strong></span>
                  <span>·</span>
                  <span>Người liên hệ: <strong>{quote.customerName}</strong></span>
                </div>
                {quote.customerAddress && (
                  <div style={{ color: '#64748B' }}>Địa chỉ: {quote.customerAddress}</div>
                )}
              </div>

              {/* Bảng dòng sản phẩm kế thừa */}
              <div className={styles.itemsTableScroll}>
                <table className={styles.itemsTable}>
                  <thead>
                    <tr>
                      <th style={{ width: 28, textAlign: 'center' }}>#</th>
                      <th>Sản phẩm / Dịch vụ</th>
                      <th style={{ width: 45, textAlign: 'center' }}>SL</th>
                      <th style={{ width: 85, textAlign: 'right' }}>Đơn giá</th>
                      <th style={{ width: 95, textAlign: 'right' }}>Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.items.map((item, idx) => (
                      <tr key={item.id}>
                        <td style={{ textAlign: 'center', color: '#94A3B8' }}>{idx + 1}</td>
                        <td>
                          <strong>{item.productName}</strong>
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                            {item.quantity} {item.unit}
                            {item.discountAmount > 0 ? ` · CK ${formatVndCurrency(item.discountAmount)}` : ''}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                        <td style={{ textAlign: 'right' }}>{formatVndCurrency(item.unitPrice)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>
                          {formatVndCurrency(item.lineTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tóm tắt tài chính khớp chính xác báo giá */}
              <div className={styles.financeSummaryBox}>
                <div className={styles.financeRow}>
                  <span>Tổng tiền hàng trước thuế:</span>
                  <strong>{formatVndCurrency(quote.subtotal)}</strong>
                </div>
                <div className={styles.financeRow} style={{ color: '#D97706' }}>
                  <span>Chiết khấu ({quote.totalDiscountPercent}%):</span>
                  <strong>- {formatVndCurrency(quote.totalDiscountAmount)}</strong>
                </div>
                <div className={styles.financeRow}>
                  <span>Tiền thuế GTGT (VAT):</span>
                  <strong>{formatVndCurrency(quote.totalVatAmount)}</strong>
                </div>
                <div className={styles.grandTotalRow}>
                  <span>TỔNG GIÁ TRỊ HỢP ĐỒNG:</span>
                  <span>{formatVndCurrency(quote.grandTotal)}</span>
                </div>
              </div>

              {/* Hộp cam kết chuyển sang Đóng thắng (Won) */}
              <div className={styles.wonNoticeBox}>
                <Trophy size={20} color="#059669" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <strong>Tự động Đóng thắng Cơ hội (Deal Won):</strong>
                  <div>
                    Khi bạn xác nhận tạo hợp đồng này, cơ hội bán hàng{' '}
                    <strong>"{quote.dealTitle}"</strong> sẽ tự động được chuyển sang giai đoạn{' '}
                    <strong>[Đóng thắng - Won]</strong> với doanh thu ghi nhận chính xác bằng{' '}
                    <strong>{formatVndCurrency(quote.grandTotal)}</strong>.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================================
            3. Modal Footer Actions
            ==================================================================== */}
        <div className={styles.modalFooter}>
          <div className={styles.footerLeftHint}>
            <ShieldCheck size={16} color="#059669" />
            <span>Dữ liệu hợp đồng được bảo toàn và mã hóa lưu trữ theo chuẩn kế toán.</span>
          </div>

          <div className={styles.footerRightActions}>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
              title="Đóng hộp thoại mà không lưu hợp đồng"
            >
              Hủy bỏ
            </Button>

            <Button
              type="submit"
              variant="primary"
              leftIcon={<FileCheck2 size={16} />}
              isLoading={isSubmitting}
              disabled={isSubmitting || !isNumberUnique || Boolean(quote.contractId || quote.contractNumber)}
              title="Xác nhận lập hợp đồng kinh tế và tự động đóng thắng cơ hội bán hàng (S7-04)"
            >
              Xác nhận Lập Hợp đồng &amp; Đóng thắng Deal
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
