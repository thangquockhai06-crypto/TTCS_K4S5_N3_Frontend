import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Megaphone,
  Tag,
  Share2,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { campaignService } from '../services/campaignService';
import { showGlobalToast } from '../context/ToastContext';
import {
  formatNumberWithCommas,
  parseNumberFromCommas,
  toLocalDateInputValue,
} from '../utils/formatters';
import styles from './CampaignCreatePage.module.css';

export const CampaignCreatePage: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'Email',
    status: 'ACTIVE',
    budget: 20000000,
    expected_revenue: 100000000,
    start_date: toLocalDateInputValue(),
    end_date: '',
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setServerError(null);

    const isCampaignDateField = field === 'start_date' || field === 'end_date';
    if (errors[field] || (isCampaignDateField && errors.end_date)) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        if (isCampaignDateField) delete next.end_date;
        return next;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tên chiến dịch không được để trống';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Mã định danh không được để trống';
    }

    if (formData.budget < 0) {
      newErrors.budget = 'Ngân sách không được nhỏ hơn 0';
    }

    if (formData.expected_revenue < 0) {
      newErrors.expected_revenue = 'Doanh thu kỳ vọng không được nhỏ hơn 0';
    }

    if (
      formData.start_date &&
      formData.end_date &&
      formData.end_date < formData.start_date
    ) {
      newErrors.end_date = 'Ngày kết thúc không được trước ngày bắt đầu';
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
      await campaignService.createCampaign({
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        type: formData.type,
        status: formData.status,
        budget: Number(formData.budget) || 0,
        expected_revenue: Number(formData.expected_revenue) || 0,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        description: formData.description.trim() || undefined,
      });

      showGlobalToast(`Chiến dịch "${formData.name}" đã được tạo thành công!`, 'success');
      navigate('/campaigns');
    } catch (err: any) {
      console.error('Lỗi khi tạo chiến dịch:', err);
      const detail = err.response?.data?.detail;
      let errMsg = 'Không thể tạo Chiến dịch Tiếp thị. Vui lòng kiểm tra lại thông tin.';
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
        onClick={() => navigate('/campaigns')}
        className={styles.backBtn}
        aria-label="Quay lại Danh sách Chiến dịch"
      >
        <ArrowLeft size={16} />
        <span>Trở về Chiến dịch Tiếp thị</span>
      </button>

      <header className={styles.header}>
        <h1 className={styles.title}>Thêm mới Chiến dịch Tiếp thị</h1>
        <p className={styles.subtitle}>
          Khởi tạo chiến dịch tiếp thị mới (Marketing Campaign), thiết lập ngân sách và kênh truyền thông để đo lường ROI và chuyển đổi Lead.
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
          {/* Section 1: Thông tin cơ bản Chiến dịch */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Megaphone size={18} color="#2563eb" />
              <span>Thông tin Định danh Chiến dịch</span>
            </h2>

            <div className={styles.grid2}>
              {/* Tên chiến dịch */}
              <div className={styles.fieldGroupFull}>
                <label className={styles.label}>
                  <span>Tên chiến dịch</span>
                  <span className={styles.requiredStar}>*</span>
                </label>
                <div className={styles.inputWrapper}>
                  <Megaphone size={16} className={styles.inputIcon} />
                  <input
                    type="text"
                    required
                    className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="VD: Chiến dịch Ra mắt Phiên bản Mùa Thu"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.name && <span className={styles.fieldError}>{errors.name}</span>}
              </div>

              {/* Mã code */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <span>Mã định danh (Code)</span>
                  <span className={styles.requiredStar}>*</span>
                </label>
                <div className={styles.inputWrapper}>
                  <Tag size={16} className={styles.inputIcon} />
                  <input
                    type="text"
                    required
                    className={`${styles.input} ${errors.code ? styles.inputError : ''}`}
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value)}
                    placeholder="VD: CMP-AUTUMN-2026"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.code && <span className={styles.fieldError}>{errors.code}</span>}
              </div>

              {/* Kênh / Loại hình */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <span>Kênh / Loại hình</span>
                </label>
                <div className={styles.inputWrapper}>
                  <Share2 size={16} className={styles.inputIcon} />
                  <select
                    className={styles.select}
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="Email">Tiếp thị Email</option>
                    <option value="Social">Mạng xã hội</option>
                    <option value="Search Ads">Quảng cáo Google</option>
                    <option value="Event">Hội thảo & Sự kiện</option>
                    <option value="Webinar">Hội thảo trực tuyến</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Trạng thái */}
            <div className={styles.grid2}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <span>Trạng thái hoạt động</span>
                </label>
                <select
                  className={`${styles.select} ${styles.selectNoIcon}`}
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="ACTIVE">Đang chạy</option>
                  <option value="PLANNING">Đang lập kế hoạch</option>
                  <option value="COMPLETED">Đã kết thúc</option>
                  <option value="PAUSED">Tạm dừng</option>
                </select>
              </div>
            </div>
          </section>

          {/* Section 2: Ngân sách & Doanh thu kỳ vọng */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <DollarSign size={18} color="#2563eb" />
              <span>Ngân sách & Mục tiêu Tài chính</span>
            </h2>

            <div className={styles.grid2}>
              {/* Ngân sách */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <span>Ngân sách dự kiến (VNĐ)</span>
                </label>
                <div className={styles.inputWrapper}>
                  <DollarSign size={16} className={styles.inputIcon} />
                  <input
                    type="text"
                    className={`${styles.input} ${errors.budget ? styles.inputError : ''}`}
                    value={formatNumberWithCommas(formData.budget)}
                    onChange={(e) => handleInputChange('budget', parseNumberFromCommas(e.target.value))}
                    placeholder="VD: 50,000,000"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.budget && <span className={styles.fieldError}>{errors.budget}</span>}
              </div>

              {/* Doanh thu kỳ vọng */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <span>Doanh thu kỳ vọng (VNĐ)</span>
                </label>
                <div className={styles.inputWrapper}>
                  <DollarSign size={16} className={styles.inputIcon} />
                  <input
                    type="text"
                    className={`${styles.input} ${errors.expected_revenue ? styles.inputError : ''}`}
                    value={formatNumberWithCommas(formData.expected_revenue)}
                    onChange={(e) => handleInputChange('expected_revenue', parseNumberFromCommas(e.target.value))}
                    placeholder="VD: 300,000,000"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.expected_revenue && (
                  <span className={styles.fieldError}>{errors.expected_revenue}</span>
                )}
              </div>
            </div>

            <div className={styles.grid2}>
              {/* Ngày bắt đầu */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <span>Ngày bắt đầu</span>
                </label>
                <div className={styles.inputWrapper}>
                  <Calendar size={16} className={styles.inputIcon} />
                  <input
                    type="date"
                    className={styles.input}
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Ngày kết thúc */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <span>Ngày kết thúc</span>
                </label>
                <div className={styles.inputWrapper}>
                  <Calendar size={16} className={styles.inputIcon} />
                  <input
                    type="date"
                    className={`${styles.input} ${errors.end_date ? styles.inputError : ''}`}
                    value={formData.end_date}
                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.end_date && (
                  <span className={styles.fieldError}>{errors.end_date}</span>
                )}
              </div>
            </div>

            {/* Mô tả */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <span>Mục tiêu & Mô tả chiến dịch</span>
              </label>
              <textarea
                className={styles.textarea}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Mô tả mục tiêu chuyển đổi, nhóm đối tượng khách hàng mục tiêu..."
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
              onClick={() => navigate('/campaigns')}
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
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Lưu Chiến dịch Tiếp thị</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
