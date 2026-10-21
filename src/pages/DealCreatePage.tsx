import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Building2,
  Calendar,
  Percent,
  Megaphone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Award,
} from 'lucide-react';
import { dealService } from '../services/dealService';
import { customerService } from '../services/customerService';
import { campaignService } from '../services/campaignService';
import { ICampaign, ICustomer } from '../interfaces';
import { showGlobalToast } from '../context/ToastContext';
import { formatNumberWithCommas, parseNumberFromCommas } from '../utils/formatters';
import styles from './DealCreatePage.module.css';

const STAGES = [
  { id: 'lead', name: 'Đầu mối mới', prob: 20 },
  { id: 'contacted', name: 'Đã liên hệ & Khảo sát', prob: 40 },
  { id: 'proposal', name: 'Gửi Đề xuất & Báo giá', prob: 60 },
  { id: 'negotiation', name: 'Đàm phán Hợp đồng', prob: 80 },
  { id: 'won', name: 'Chốt thành công', prob: 100 },
  { id: 'lost', name: 'Đã thất bại', prob: 0 },
];

export const DealCreatePage: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    customerId: '',
    value: 50000000,
    stage: 'lead',
    probability: 20,
    expectedCloseDate: '',
    campaignId: '',
    priority: 'Medium',
    notes: '',
  });

  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [campaigns, setCampaigns] = useState<ICampaign[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Load customers
    customerService
      .getCustomers({ limit: 100 })
      .then((res) => {
        if (isMounted) {
          const list = Array.isArray(res) ? res : (res as any)?.items || [];
          setCustomers(list);
          if (list.length > 0 && !formData.customerId) {
            setFormData((prev) => ({ ...prev, customerId: list[0].id }));
          }
        }
      })
      .catch((err) => console.warn('Could not load customers for deal:', err));

    // Load campaigns
    campaignService
      .getCampaigns()
      .then((res) => {
        if (isMounted) setCampaigns(Array.isArray(res) ? res : []);
      })
      .catch((err) => console.warn('Could not load campaigns for deal:', err));

    return () => {
      isMounted = false;
    };
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setServerError(null);

    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }

    if (field === 'stage') {
      const match = STAGES.find((s) => s.id === value);
      if (match) {
        setFormData((prev) => ({ ...prev, stage: value, probability: match.prob }));
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Tên cơ hội bán hàng không được để trống';
    }

    if (!formData.customerId) {
      newErrors.customerId = 'Vui lòng chọn khách hàng liên kết';
    }

    if (formData.value < 0) {
      newErrors.value = 'Giá trị Deal phải lớn hơn hoặc bằng 0';
    }

    if (
      !Number.isFinite(formData.probability) ||
      formData.probability < 0 ||
      formData.probability > 100
    ) {
      newErrors.probability = 'Xác suất thành công phải nằm trong khoảng từ 0 đến 100%.';
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
      await dealService.createDeal({
        title: formData.title.trim(),
        customerId: formData.customerId,
        value: Number(formData.value) || 0,
        stage: formData.stage,
        probability: Number(formData.probability),
        expectedCloseDate: formData.expectedCloseDate || undefined,
        campaignId: formData.campaignId || undefined,
      });

      showGlobalToast(`Cơ hội bán hàng "${formData.title}" đã được lưu thành công!`, 'success');
      navigate('/deals');
    } catch (err: any) {
      console.error('Lỗi khi tạo deal:', err);
      const detail = err.response?.data?.detail;
      let errMsg = 'Không thể tạo Cơ hội Bán hàng. Vui lòng kiểm tra lại thông tin.';
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
        onClick={() => navigate('/deals')}
        className={styles.backBtn}
        aria-label="Quay lại Danh sách Cơ hội"
      >
        <ArrowLeft size={16} />
        <span>Trở về Cơ hội Bán hàng</span>
      </button>

      <header className={styles.header}>
        <h1 className={styles.title}>Tạo Cơ hội Bán hàng mới</h1>
        <p className={styles.subtitle}>
          Khởi tạo thỏa thuận thương mại trong phễu bán hàng, liên kết khách hàng doanh nghiệp và dự báo doanh số.
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
          {/* Section 1: Thông tin cơ bản Deal */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <TrendingUp size={18} color="#2563eb" />
              <span>Thông tin Cơ hội Bán hàng</span>
            </h2>

            <div className={styles.grid2}>
              {/* Tên Deal */}
              <div className={styles.fieldGroupFull}>
                <label className={styles.label}>
                  <span>Tên cơ hội bán hàng</span>
                  <span className={styles.requiredStar}>*</span>
                </label>
                <div className={styles.inputWrapper}>
                  <TrendingUp size={16} className={styles.inputIcon} />
                  <input
                    type="text"
                    required
                    className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="VD: Triển khai Hệ thống CRM Doanh nghiệp Q4"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.title && <span className={styles.fieldError}>{errors.title}</span>}
              </div>

              {/* Quy mô giá trị */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <span>Quy mô trị giá (VNĐ)</span>
                  <span className={styles.requiredStar}>*</span>
                </label>
                <div className={styles.inputWrapper}>
                  <DollarSign size={16} className={styles.inputIcon} />
                  <input
                    type="text"
                    required
                    className={`${styles.input} ${errors.value ? styles.inputError : ''}`}
                    value={formatNumberWithCommas(formData.value)}
                    onChange={(e) => handleInputChange('value', parseNumberFromCommas(e.target.value))}
                    placeholder="VD: 50,000,000"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.value && <span className={styles.fieldError}>{errors.value}</span>}
              </div>

              {/* Hạn chốt dự kiến */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <span>Hạn chốt dự kiến (Expected Close Date)</span>
                </label>
                <div className={styles.inputWrapper}>
                  <Calendar size={16} className={styles.inputIcon} />
                  <input
                    type="date"
                    className={styles.input}
                    value={formData.expectedCloseDate}
                    onChange={(e) => handleInputChange('expectedCloseDate', e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            <div className={styles.grid2}>
              {/* Giai đoạn phễu */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <span>Giai đoạn Phễu bán hàng</span>
                </label>
                <div className={styles.inputWrapper}>
                  <Award size={16} className={styles.inputIcon} />
                  <select
                    className={styles.select}
                    value={formData.stage}
                    onChange={(e) => handleInputChange('stage', e.target.value)}
                    disabled={isSubmitting}
                  >
                    {STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.prob}%)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Xác suất thành công */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <span>Xác suất thành công (%)</span>
                </label>
                <div className={styles.inputWrapper}>
                  <Percent size={16} className={styles.inputIcon} />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className={styles.input}
                    value={formData.probability}
                    onChange={(e) => handleInputChange('probability', Number(e.target.value))}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.probability && (
                  <span className={styles.fieldError}>{errors.probability}</span>
                )}
              </div>
            </div>
          </section>

          {/* Section 2: Khách hàng & Chiến dịch */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Building2 size={18} color="#2563eb" />
              <span>Khách hàng & Chiến dịch liên quan</span>
            </h2>

            <div className={styles.grid2}>
              {/* Khách hàng */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <span>Khách hàng Doanh nghiệp</span>
                  <span className={styles.requiredStar}>*</span>
                </label>
                <div className={styles.inputWrapper}>
                  <Building2 size={16} className={styles.inputIcon} />
                  <select
                    className={`${styles.select} ${errors.customerId ? styles.inputError : ''}`}
                    value={formData.customerId}
                    onChange={(e) => handleInputChange('customerId', e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="">-- Chọn khách hàng --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company || c.fullName}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.customerId && <span className={styles.fieldError}>{errors.customerId}</span>}
              </div>

              {/* Chiến dịch Marketing */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <span>Chiến dịch Marketing</span>
                </label>
                <div className={styles.inputWrapper}>
                  <Megaphone size={16} className={styles.inputIcon} />
                  <select
                    className={styles.select}
                    value={formData.campaignId}
                    onChange={(e) => handleInputChange('campaignId', e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="">Không gắn chiến dịch</option>
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.code ? `(${c.code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Mức độ ưu tiên */}
            <div className={styles.grid2}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <span>Mức độ ưu tiên</span>
                </label>
                <select
                  className={`${styles.select} ${styles.selectNoIcon}`}
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="High">Cao (High)</option>
                  <option value="Medium">Trung bình (Medium)</option>
                  <option value="Low">Thấp (Low)</option>
                </select>
              </div>
            </div>

            {/* Ghi chú */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <span>Ghi chú cơ hội & Yêu cầu giải pháp</span>
              </label>
              <textarea
                className={styles.textarea}
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Thông tin thêm về nhu cầu khách hàng, thời điểm quyết định, điều kiện tiên quyết..."
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
              onClick={() => navigate('/deals')}
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
                  <span>Đang lưu Deal...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Lưu Cơ hội Bán hàng</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
