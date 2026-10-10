import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  Save,
  RefreshCw,
} from 'lucide-react';
import {
  CustomerStatusType,
  CustomerTierType,
  ICustomer,
} from '../interfaces/customer.interface';
import { customerService } from '../services/customerService';
import { showGlobalToast } from '../context/ToastContext';
import styles from './CustomerCreatePage.module.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const CustomerEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const [company, setCompany] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Người đại diện');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('Công nghệ thông tin & Viễn thông');
  const [tier, setTier] = useState<CustomerTierType>('Enterprise');
  const [status, setStatus] = useState<CustomerStatusType>('New Lead');
  const [totalContractValue, setTotalContractValue] = useState<number>(50000000);
  const [location, setLocation] = useState('Hà Nội, Việt Nam');
  const [summary, setSummary] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) {
      setLoadError('Không tìm thấy mã khách hàng.');
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const cust: ICustomer = await customerService.getCustomerById(id);
        if (!cust) {
          setLoadError(`Không tìm thấy hồ sơ khách hàng với mã: "${id}".`);
          return;
        }

        setCompany(cust.company || cust.fullName || '');
        setTaxCode(cust.taxCode || '');
        setFullName(cust.fullName || '');
        setRole(cust.role || 'Người đại diện');
        setPhone(cust.phone || '');
        setEmail(cust.email || '');
        setWebsite(cust.website || '');
        setIndustry(cust.industry || 'Công nghệ thông tin & Viễn thông');
        setTier((cust.tier as CustomerTierType) || 'Enterprise');
        setStatus((cust.status as CustomerStatusType) || 'New Lead');
        setTotalContractValue(Number(cust.totalContractValue || cust.dealValue || 0));
        setLocation(cust.location || '');
        setSummary(cust.notesSummary || cust.summary || '');
      } catch (err: any) {
        const msg = err.response?.data?.detail || err.message || 'Lỗi khi tải thông tin khách hàng.';
        setLoadError(msg);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id]);

  const validateMST = (mst: string): string | undefined => {
    if (!mst.trim()) return undefined;
    const cleaned = mst.trim().replace(/\s+/g, '');
    const regex = /^(\d{10}|\d{10}-\d{3}|\d{13})$/;
    if (!regex.test(cleaned)) {
      return 'MST chuẩn gồm 10 chữ số (hoặc 13 chữ số có dấu gạch nối, VD: 0101234567 hoặc 0101234567-001).';
    }
    return undefined;
  };

  const handleTaxCodeChange = (val: string) => {
    setTaxCode(val);
    const err = validateMST(val);
    if (err) {
      setErrors((prev) => ({ ...prev, taxCode: err }));
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.taxCode;
        return next;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!company.trim()) {
      newErrors.company = 'Tên doanh nghiệp không được để trống';
    }

    if (!fullName.trim()) {
      newErrors.fullName = 'Tên người đại diện không được để trống';
    }

    if (!email.trim()) {
      newErrors.email = 'Email công việc không được để trống';
    } else if (!EMAIL_REGEX.test(email.trim())) {
      newErrors.email = 'Email sai định dạng (ví dụ: contact@doanhnghiep.vn)';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Số điện thoại không được để trống';
    }

    if (taxCode.trim()) {
      const mstError = validateMST(taxCode);
      if (mstError) {
        newErrors.taxCode = mstError;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !validateForm()) return;

    setIsSubmitting(true);
    setServerError(null);

    try {
      const updated = await customerService.updateCustomer(id, {
        company: company.trim(),
        taxCode: taxCode.trim() || undefined,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        industry,
        tier,
        location: location.trim(),
        website: website.trim() || undefined,
        status,
        totalContractValue: Number(totalContractValue || 0),
        notesSummary: summary.trim() || undefined,
      });

      const msg = `Cập nhật hồ sơ khách hàng "${updated.company || company}" thành công!`;
      showGlobalToast(msg, 'success');
      navigate('/customers');
    } catch (err: any) {
      console.error('Lỗi khi cập nhật hồ sơ khách hàng:', err);
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

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          <RefreshCw size={28} className="spin" style={{ marginBottom: 12 }} />
          <div>Đang tải hồ sơ khách hàng doanh nghiệp...</div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={styles.container}>
        <button
          type="button"
          onClick={() => navigate('/customers')}
          className={styles.backBtn}
        >
          <ArrowLeft size={16} />
          <span>Trở về danh sách khách hàng</span>
        </button>
        <div className={styles.errorBanner}>
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>{loadError}</span>
        </div>
      </div>
    );
  }

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
        <h1 className={styles.title}>Chỉnh sửa Hồ sơ Khách hàng Doanh nghiệp</h1>
        <p className={styles.subtitle}>
          Cập nhật thông tin pháp nhân, người đại diện và các điều khoản hợp tác.
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
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="VD: Tập Đoàn VinaCorp"
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
                    value={taxCode}
                    onChange={(e) => handleTaxCodeChange(e.target.value)}
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
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
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
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="VD: https://vinacorp.vn"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Trụ sở / Khu vực */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <span>Địa chỉ trụ sở / Khu vực</span>
              </label>
              <div className={styles.inputWrapper}>
                <MapPin size={16} className={styles.inputIcon} />
                <input
                  type="text"
                  className={styles.input}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="VD: Hà Nội, Việt Nam"
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
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="VD: Nguyễn Văn An"
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
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="VD: Giám đốc kinh doanh"
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
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="VD: an.nguyen@vinacorp.vn"
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
                  value={tier}
                  onChange={(e) => setTier(e.target.value as CustomerTierType)}
                  disabled={isSubmitting}
                >
                  <option value="Enterprise">Enterprise (Doanh nghiệp VIP/Chiến lược)</option>
                  <option value="Mid-Market">Mid-Market (Doanh nghiệp tầm trung)</option>
                  <option value="Growth">Growth (Doanh nghiệp tăng trưởng)</option>
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
                  value={status}
                  onChange={(e) => setStatus(e.target.value as CustomerStatusType)}
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
                    value={String(totalContractValue || 0)}
                    onChange={(e) => setTotalContractValue(Number(e.target.value))}
                    placeholder="VD: 150000000"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Ghi chú */}
          <section className={styles.section}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <span>Ghi chú / Tóm tắt hồ sơ</span>
              </label>
              <textarea
                className={styles.textarea}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Thông tin giới thiệu, bối cảnh nhu cầu của doanh nghiệp..."
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
                  <span>Đang lưu thay đổi...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Lưu thay đổi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
