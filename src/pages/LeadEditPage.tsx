import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Mail,
  MapPin,
  Phone,
  User,
  AlertCircle,
  Briefcase,
  Share2,
  Megaphone,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { leadService } from '../services/leadService';
import { campaignService } from '../services/campaignService';
import { ICampaign, ILead } from '../interfaces';
import { showGlobalToast } from '../context/ToastContext';
import styles from './LeadCreatePage.module.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\-\s()]{8,15}$/;

export const LeadEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [lead, setLead] = useState<ILead | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company_name: '',
    title: '',
    industry: 'Công nghệ',
    region: 'Miền Bắc',
    source: 'Website Form',
    campaign_id: '',
  });

  const [campaigns, setCampaigns] = useState<ICampaign[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Load Lead & Campaigns
  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      leadService.getLead(id),
      campaignService.getCampaigns().catch(() => []),
    ])
      .then(([leadData, campaignData]) => {
        if (!isMounted) return;
        setLead(leadData);
        setCampaigns(Array.isArray(campaignData) ? campaignData : []);

        setFormData({
          first_name: leadData.first_name || '',
          last_name: leadData.last_name || '',
          email: leadData.email || '',
          phone: leadData.phone || '',
          company_name: leadData.company_name || '',
          title: leadData.title || '',
          industry: leadData.industry || 'Công nghệ',
          region: leadData.region || 'Miền Bắc',
          source: leadData.source || 'Website Form',
          campaign_id: leadData.campaign_id || '',
        });
      })
      .catch((err) => {
        console.error('Lỗi khi tải chi tiết Lead:', err);
        showGlobalToast('Không thể tải thông tin Lead.', 'error');
        navigate('/leads');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setServerError(null);

    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Họ đệm không được để trống';
    }

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'Tên không được để trống';
    }

    if (formData.email.trim() && !EMAIL_REGEX.test(formData.email.trim())) {
      newErrors.email = 'Email không hợp lệ (ví dụ: an.nguyen@example.com)';
    }

    if (formData.phone.trim() && !PHONE_REGEX.test(formData.phone.trim())) {
      newErrors.phone = 'Số điện thoại không hợp lệ (8 - 15 chữ số)';
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
      await leadService.updateLead(id, {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        company_name: formData.company_name.trim() || undefined,
        title: formData.title.trim() || undefined,
        industry: formData.industry.trim() || undefined,
        region: formData.region,
        source: formData.source,
        campaign_id: formData.campaign_id || undefined,
      });

      const fullName = `${formData.last_name} ${formData.first_name}`.trim();
      showGlobalToast(`Cập nhật thông tin Lead "${fullName}" thành công!`, 'success');
      navigate('/leads');
    } catch (err: any) {
      console.error('Lỗi khi cập nhật Lead:', err);
      const detail = err.response?.data?.detail;
      let errMsg = 'Không thể cập nhật Lead. Vui lòng kiểm tra lại thông tin.';
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
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          <RefreshCw size={28} className="spin" style={{ margin: '0 auto 12px' }} />
          <p>Đang tải dữ liệu hồ sơ Lead...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <button
        type="button"
        onClick={() => navigate('/leads')}
        className={styles.backBtn}
        aria-label="Quay lại Quản lý Lead"
      >
        <ArrowLeft size={16} />
        <span>Trở về Quản lý Lead</span>
      </button>

      <header className={styles.header}>
        <h1 className={styles.title}>Chỉnh sửa Lead tiềm năng</h1>
        <p className={styles.subtitle}>
          Cập nhật thông tin chi tiết đầu mối liên hệ, doanh nghiệp và nguồn phát sinh của Lead #{lead?.id?.slice(0, 8)}.
        </p>
      </header>

      <div className={styles.card}>
        {serverError && (
          <div className={styles.errorBanner} role="alert">
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{serverError}</span>
          </div>
        )}

        <div className={styles.infoBanner}>
          <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            Trạng thái hiện tại: <strong>{lead?.status}</strong> | Điểm chấm tự động:{' '}
            <strong>{lead?.score} điểm ({lead?.score_grade})</strong> | Phụ trách:{' '}
            <strong>{lead?.owner_name || 'Chưa gán'}</strong>
          </span>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {/* Section 1: Thông tin cá nhân & Người liên hệ */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <User size={18} color="#2563eb" />
              <span>Thông tin cá nhân & Liên hệ</span>
            </h2>

            <div className={styles.grid2}>
              {/* Họ đệm */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <span>Họ đệm</span>
                  <span className={styles.requiredStar}>*</span>
                </label>
                <div className={styles.inputWrapper}>
                  <User size={16} className={styles.inputIcon} />
                  <input
                    type="text"
                    required
                    className={`${styles.input} ${errors.last_name ? styles.inputError : ''}`}
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    placeholder="VD: Nguyễn Văn"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.last_name && <span className={styles.fieldError}>{errors.last_name}</span>}
              </div>

              {/* Tên */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <span>Tên</span>
                  <span className={styles.requiredStar}>*</span>
                </label>
                <div className={styles.inputWrapper}>
                  <User size={16} className={styles.inputIcon} />
                  <input
                    type="text"
                    required
                    className={`${styles.input} ${errors.first_name ? styles.inputError : ''}`}
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    placeholder="VD: An"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.first_name && <span className={styles.fieldError}>{errors.first_name}</span>}
              </div>
            </div>

            <div className={styles.grid2}>
              {/* Email */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <span>Email</span>
                </label>
                <div className={styles.inputWrapper}>
                  <Mail size={16} className={styles.inputIcon} />
                  <input
                    type="email"
                    className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="VD: an.nguyen@example.com"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.email && <span className={styles.fieldError}>{errors.email}</span>}
              </div>

              {/* Số điện thoại */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <span>Số điện thoại</span>
                </label>
                <div className={styles.inputWrapper}>
                  <Phone size={16} className={styles.inputIcon} />
                  <input
                    type="tel"
                    className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="VD: 0987654321"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.phone && <span className={styles.fieldError}>{errors.phone}</span>}
              </div>
            </div>

            <div className={styles.grid2}>
              {/* Chức danh */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <span>Chức danh</span>
                </label>
                <div className={styles.inputWrapper}>
                  <Briefcase size={16} className={styles.inputIcon} />
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="VD: Giám đốc Kinh doanh"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Doanh nghiệp & Địa bàn */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Building2 size={18} color="#2563eb" />
              <span>Thông tin Doanh nghiệp & Vùng miền</span>
            </h2>

            <div className={styles.grid2}>
              {/* Công ty / Doanh nghiệp */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <span>Công ty / Doanh nghiệp</span>
                </label>
                <div className={styles.inputWrapper}>
                  <Building2 size={16} className={styles.inputIcon} />
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    placeholder="VD: Công ty Cổ phần Alpha"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Ngành nghề (Industry) */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <span>Ngành nghề (Industry)</span>
                </label>
                <div className={styles.inputWrapper}>
                  <Briefcase size={16} className={styles.inputIcon} />
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                    placeholder="VD: Công nghệ / Tài chính / Bán lẻ..."
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            <div className={styles.grid2}>
              {/* Khu vực (Region) */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <span>Khu vực (Region)</span>
                </label>
                <div className={styles.inputWrapper}>
                  <MapPin size={16} className={styles.inputIcon} />
                  <select
                    className={styles.select}
                    value={formData.region}
                    onChange={(e) => handleInputChange('region', e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="Miền Bắc">Miền Bắc</option>
                    <option value="Miền Trung">Miền Trung</option>
                    <option value="Miền Nam">Miền Nam</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Nguồn khách hàng & Chiến dịch */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Share2 size={18} color="#2563eb" />
              <span>Nguồn khách hàng & Chiến dịch Marketing</span>
            </h2>

            <div className={styles.grid2}>
              {/* Nguồn khách hàng */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <span>Nguồn khách hàng</span>
                </label>
                <div className={styles.inputWrapper}>
                  <Share2 size={16} className={styles.inputIcon} />
                  <select
                    className={styles.select}
                    value={formData.source}
                    onChange={(e) => handleInputChange('source', e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="Website Form">Website Form</option>
                    <option value="Facebook Ads">Facebook Ads</option>
                    <option value="Google Ads">Google Ads</option>
                    <option value="Giới thiệu">Giới thiệu (Referral)</option>
                    <option value="Hội thảo">Hội thảo (Event)</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
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
                    value={formData.campaign_id}
                    onChange={(e) => handleInputChange('campaign_id', e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="">Không liên kết chiến dịch</option>
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.code ? `(${c.code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.btnCancel}
              onClick={() => navigate('/leads')}
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
                  <span>Đang cập nhật...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Lưu thay đổi Lead</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
