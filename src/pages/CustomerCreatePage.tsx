import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  DollarSign,
  FileText,
  Globe,
  Mail,
  MapPin,
  Phone,
  User,
  AlertCircle,
  Briefcase,
  Plus,
  RefreshCw,
} from 'lucide-react';
import {
  CreateCustomerDTO,
  CustomerStatusType,
  CustomerTierType,
} from '../interfaces/customer.interface';
import { customerService } from '../services/customerService';
import { showGlobalToast } from '../context/ToastContext';
import styles from './CustomerCreatePage.module.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const CustomerCreatePage: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<CreateCustomerDTO>({
    company: '',
    taxCode: '',
    fullName: '',
    role: 'Người đại diện',
    companyDomain: '',
    email: '',
    phone: '',
    industry: 'Công nghệ thông tin & Viễn thông',
    tier: 'Enterprise' as CustomerTierType,
    location: 'Hà Nội, Việt Nam',
    website: '',
    status: 'New Lead' as CustomerStatusType,
    dealValue: 50000000,
    totalContractValue: 50000000,
    tags: ['Enterprise'],
    summary: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const validateMST = (mst: string): string | undefined => {
    if (!mst.trim()) return undefined;
    const cleaned = mst.trim().replace(/\s+/g, '');
    const regex = /^(\d{10}|\d{10}-\d{3}|\d{13})$/;
    if (!regex.test(cleaned)) {
      return 'MST chuẩn gồm 10 chữ số (hoặc 13 chữ số có dấu gạch nối, VD: 0101234567 hoặc 0101234567-001).';
    }
    return undefined;
  };

  const handleInputChange = (field: keyof CreateCustomerDTO, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setServerError(null);

    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }

    if (field === 'taxCode' && typeof value === 'string') {
      const err = validateMST(value);
      if (err) {
        setErrors((prev) => ({ ...prev, taxCode: err }));
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.company.trim()) {
      newErrors.company = 'Tên doanh nghiệp không được để trống';
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Tên người đại diện không được để trống';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email công việc không được để trống';
    } else if (!EMAIL_REGEX.test(formData.email.trim())) {
      newErrors.email = 'Email sai định dạng (ví dụ: contact@doanhnghiep.vn)';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Số điện thoại không được để trống';
    }

    if (formData.taxCode) {
      const mstError = validateMST(formData.taxCode);
      if (mstError) {
        newErrors.taxCode = mstError;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setServerError(null);

    try {
      const savedCustomer = await customerService.createCustomer({
        ...formData,
        company: formData.company.trim(),
        taxCode: formData.taxCode?.trim() || undefined,
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        location: formData.location.trim(),
        website: formData.website?.trim() || undefined,
        totalContractValue: Number(formData.totalContractValue || formData.dealValue || 0),
        summary: formData.summary?.trim() || undefined,
      });

      const msg = `Thêm mới Khách hàng Doanh nghiệp "${savedCustomer.company}" thành công!`;
      showGlobalToast(msg, 'success');
      navigate('/customers');
    } catch (err: any) {
      console.error('Lỗi khi tạo hồ sơ khách hàng:', err);
      const detail = err.response?.data?.detail;
      let errMsg = 'Lỗi máy chủ hoặc trùng lặp Mã số thuế (MST). Vui lòng kiểm tra lại.';
      if (typeof detail === 'string') {
        errMsg = detail;
      } else if (Array.isArray(detail)) {
        errMsg = detail.map((d: any) => d.msg).join(', ');
      }
      setServerError(errMsg);
      showGlobalToast(errMsg, 'error');
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
        <h1 className={styles.title}>Thêm mới Khách hàng Doanh nghiệp</h1>
        <p className={styles.subtitle}>
          Khởi tạo hồ sơ khách hàng B2B, quản lý thông tin pháp nhân và quy mô hợp đồng dự kiến.
        </p>
      </header>

      <div className={styles.card}>
        {serverError && (
          <div className={styles.errorBanner} role="alert">
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{serverError}</span>
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          {/* Section 1: Thông tin Doanh nghiệp & Pháp nhân */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Building2 size={18} color="#2563eb" />
              <span>Thông tin Doanh nghiệp & Pháp nhân</span>
            </h2>

            <div className={styles.grid2}>
              {/* Tên doanh nghiệp */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <span>Tên doanh nghiệp</span>
                  <span className={styles.requiredStar}>*</span>
                </label>
                <div className={styles.inputWrapper}>
                  <Building2 size={16} className={styles.inputIcon} />
                  <input
                    type="text"
                    required
                    className={`${styles.input} ${errors.company ? styles.inputError : ''}`}
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    placeholder="VD: Tập đoàn Vingroup, FPT Software..."
                    disabled={isSubmitting}
                  />
                </div>
                {errors.company && <span className={styles.fieldError}>{errors.company}</span>}
              </div>

              {/* Mã số thuế */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <span>Mã số thuế (MST)</span>
                </label>
                <div className={styles.inputWrapper}>
                  <FileText size={16} className={styles.inputIcon} />
                  <input
                    type="text"
                    className={`${styles.input} ${errors.taxCode ? styles.inputError : ''}`}
                    value={formData.taxCode || ''}
                    onChange={(e) => handleInputChange('taxCode', e.target.value)}
                    placeholder="VD: 0101234567 hoặc 0101234567-001"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.taxCode ? (
                  <span className={styles.fieldError}>{errors.taxCode}</span>
                ) : (
                  <span className={styles.helperText}>MST gồm 10 hoặc 13 chữ số theo chuẩn Bộ Tài chính</span>
                )}
              </div>
            </div>

            <div className={styles.grid2}>
              {/* Lĩnh vực / Ngành nghề */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <span>Lĩnh vực / Ngành nghề hoạt động</span>
                </label>
                <div className={styles.inputWrapper}>
                  <Briefcase size={16} className={styles.inputIcon} />
                  <select
                    className={styles.select}
                    value={formData.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="Công nghệ thông tin & Viễn thông">Công nghệ thông tin & Viễn thông</option>
                    <option value="Tài chính - Ngân hàng - Bảo hiểm">Tài chính - Ngân hàng - Bảo hiểm</option>
                    <option value="Sản xuất & Công nghiệp nặng">Sản xuất & Công nghiệp nặng</option>
                    <option value="Bán lẻ & Thương mại điện tử">Bán lẻ & Thương mại điện tử</option>
                    <option value="Bất động sản & Xây dựng">Bất động sản & Xây dựng</option>
                    <option value="Y tế & Chăm sóc sức khỏe">Y tế & Chăm sóc sức khỏe</option>
                    <option value="Giáo dục & Đào tạo">Giáo dục & Đào tạo</option>
                    <option value="Logistics & Chuỗi cung ứng">Logistics & Chuỗi cung ứng</option>
                    <option value="Khác">Lĩnh vực khác</option>
                  </select>
                </div>
              </div>

              {/* Website */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <span>Website doanh nghiệp</span>
                </label>
                <div className={styles.inputWrapper}>
                  <Globe size={16} className={styles.inputIcon} />
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.website || ''}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="VD: https://doanhnghiep.vn"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Trụ sở / Địa bàn */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <span>Địa chỉ trụ sở / Khu vực</span>
              </label>
              <div className={styles.inputWrapper}>
                <MapPin size={16} className={styles.inputIcon} />
                <input
                  type="text"
                  className={styles.input}
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="VD: Tòa nhà Keangnam, Mễ Trì, Nam Từ Liêm, Hà Nội"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </section>

          {/* Section 2: Người đại diện & Thông tin liên hệ */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <User size={18} color="#2563eb" />
              <span>Người đại diện & Thông tin liên hệ</span>
            </h2>

            <div className={styles.grid2}>
              {/* Người đại diện */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <span>Người đại diện / Liên hệ chính</span>
                  <span className={styles.requiredStar}>*</span>
                </label>
                <div className={styles.inputWrapper}>
                  <User size={16} className={styles.inputIcon} />
                  <input
                    type="text"
                    required
                    className={`${styles.input} ${errors.fullName ? styles.inputError : ''}`}
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="VD: Ông Nguyễn Văn A"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.fullName && <span className={styles.fieldError}>{errors.fullName}</span>}
              </div>

              {/* Chức danh */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <span>Chức danh / Vai trò</span>
                </label>
                <div className={styles.inputWrapper}>
                  <User size={16} className={styles.inputIcon} />
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.role || ''}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    placeholder="VD: Giám đốc kinh doanh / Đại diện pháp luật"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            <div className={styles.grid2}>
              {/* Số điện thoại */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <span>Số điện thoại liên hệ</span>
                  <span className={styles.requiredStar}>*</span>
                </label>
                <div className={styles.inputWrapper}>
                  <Phone size={16} className={styles.inputIcon} />
                  <input
                    type="tel"
                    required
                    className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="VD: 0912345678"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.phone && <span className={styles.fieldError}>{errors.phone}</span>}
              </div>

              {/* Email công việc */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <span>Email công việc</span>
                  <span className={styles.requiredStar}>*</span>
                </label>
                <div className={styles.inputWrapper}>
                  <Mail size={16} className={styles.inputIcon} />
                  <input
                    type="email"
                    required
                    className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="VD: contact@doanhnghiep.vn"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.email && <span className={styles.fieldError}>{errors.email}</span>}
              </div>
            </div>
          </section>

          {/* Section 3: Phân khúc & Giá trị hợp đồng */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <DollarSign size={18} color="#2563eb" />
              <span>Phân khúc khách hàng & Quy mô hợp đồng</span>
            </h2>

            <div className={styles.grid3}>
              {/* Phân khúc Tier */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <span>Phân khúc (Tier)</span>
                </label>
                <select
                  className={`${styles.select} ${styles.selectNoIcon}`}
                  value={formData.tier}
                  onChange={(e) => handleInputChange('tier', e.target.value as CustomerTierType)}
                  disabled={isSubmitting}
                >
                  <option value="Enterprise">Enterprise (VIP / Chiến lược)</option>
                  <option value="Mid-Market">Mid-Market (Tầm trung)</option>
                  <option value="Growth">Growth (Tăng trưởng)</option>
                  <option value="Startup">Startup (Khởi nghiệp / SME)</option>
                </select>
              </div>

              {/* Trạng thái hợp tác */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <span>Trạng thái hợp tác</span>
                </label>
                <select
                  className={`${styles.select} ${styles.selectNoIcon}`}
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value as CustomerStatusType)}
                  disabled={isSubmitting}
                >
                  <option value="New Lead">Tiềm năng mới (New Lead)</option>
                  <option value="Negotiation">Đang đàm phán (Negotiation)</option>
                  <option value="Active">Đang hợp tác (Active)</option>
                  <option value="At Risk">Cần chú ý (At Risk)</option>
                  <option value="Churned">Đã ngừng hợp tác (Churned)</option>
                </select>
              </div>

              {/* Quy mô hợp đồng */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <span>Quy mô hợp đồng (VNĐ)</span>
                </label>
                <div className={styles.inputWrapper}>
                  <DollarSign size={16} className={styles.inputIcon} />
                  <input
                    type="number"
                    min="0"
                    step="1000000"
                    className={styles.input}
                    value={String(formData.totalContractValue || formData.dealValue || 0)}
                    onChange={(e) => handleInputChange('totalContractValue', Number(e.target.value))}
                    placeholder="VD: 50000000"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Ghi chú & Nhu cầu */}
          <section className={styles.section}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <span>Ghi chú / Tóm tắt hồ sơ khách hàng</span>
              </label>
              <textarea
                className={styles.textarea}
                value={formData.summary || ''}
                onChange={(e) => handleInputChange('summary', e.target.value)}
                placeholder="Thông tin giới thiệu, bối cảnh nhu cầu của doanh nghiệp, lịch sử tiếp cận..."
                disabled={isSubmitting}
                rows={3}
              />
            </div>
          </section>

          {/* Actions */}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.btnCancel}
              onClick={() => navigate('/customers')}
              disabled={isSubmitting}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className={styles.btnSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={16} className="spin" />
                  <span>Đang lưu hồ sơ...</span>
                </>
              ) : (
                <>
                  <Plus size={16} />
                  <span>Tạo hồ sơ khách hàng</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
