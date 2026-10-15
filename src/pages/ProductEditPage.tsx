import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  Barcode,
  Layers,
  DollarSign,
  FileText,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { sprint2Service } from '../services/sprint2Service';
import { useAuth } from '../hooks/useAuth';
import { IProduct } from '../interfaces';
import { showGlobalToast } from '../context/ToastContext';
import styles from './ProductCreatePage.module.css';

export const ProductEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isDirector =
    user?.role === 'Super Admin' ||
    user?.role === 'VP of Sales' ||
    (user as any)?.role === 'admin' ||
    (user as any)?.role === 'director' ||
    (user as any)?.role === 'manager';

  const [product, setProduct] = useState<IProduct | null>(null);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: 'Phần mềm CRM',
    unit: 'Gói / Năm',
    selling_price: 0,
    cost_price: 0,
    currency: 'VND',
    is_active: true,
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setIsLoading(true);

    sprint2Service
      .getProducts()
      .then((products) => {
        if (!isMounted) return;
        const match = products.find((p) => String(p.id) === String(id));
        if (match) {
          setProduct(match);
          setFormData({
            sku: match.sku || '',
            name: match.name || '',
            category: match.category || 'Phần mềm CRM',
            unit: match.unit || '',
            selling_price: match.selling_price || 0,
            cost_price: match.cost_price || 0,
            currency: match.currency || 'VND',
            is_active: match.is_active,
            description: match.description || '',
          });
        } else {
          showGlobalToast('Không tìm thấy thông tin sản phẩm.', 'error');
          navigate('/products');
        }
      })
      .catch((err) => {
        console.error('Lỗi khi tải thông tin sản phẩm:', err);
        showGlobalToast('Không thể tải chi tiết sản phẩm.', 'error');
        navigate('/products');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id, navigate]);

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
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.sku.trim()) {
      newErrors.sku = 'Mã SKU sản phẩm không được để trống';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Tên sản phẩm không được để trống';
    }

    if (!formData.unit.trim()) {
      newErrors.unit = 'Đơn vị tính không được để trống';
    }

    if (formData.selling_price < 0) {
      newErrors.selling_price = 'Giá bán niêm yết không được nhỏ hơn 0';
    }

    if (formData.cost_price && formData.cost_price < 0) {
      newErrors.cost_price = 'Giá vốn không được nhỏ hơn 0';
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
      await sprint2Service.updateProduct(id, {
        sku: formData.sku.trim().toUpperCase(),
        name: formData.name.trim(),
        category: formData.category,
        unit: formData.unit.trim(),
        selling_price: Number(formData.selling_price) || 0,
        cost_price: isDirector ? Number(formData.cost_price) || 0 : undefined,
        currency: formData.currency,
        is_active: formData.is_active,
        description: formData.description.trim() || undefined,
      });

      showGlobalToast(`Cập nhật sản phẩm "${formData.name}" thành công!`, 'success');
      navigate('/products');
    } catch (err: any) {
      console.error('Lỗi khi cập nhật sản phẩm:', err);
      const detail = err.response?.data?.detail;
      let errMsg = 'Không thể cập nhật Sản phẩm. Vui lòng kiểm tra lại thông tin.';
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
          <p>Đang tải dữ liệu sản phẩm...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <button
        type="button"
        onClick={() => navigate('/products')}
        className={styles.backBtn}
        aria-label="Quay lại Danh mục Sản phẩm"
      >
        <ArrowLeft size={16} />
        <span>Trở về Danh mục Sản phẩm & Dịch vụ</span>
      </button>

      <header className={styles.header}>
        <h1 className={styles.title}>Chỉnh sửa Sản phẩm / Dịch vụ</h1>
        <p className={styles.subtitle}>
          Cập nhật thông tin chi tiết, giá niêm yết và trạng thái kinh doanh của sản phẩm {product?.name} ({product?.sku}).
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
          {/* Section 1: Thông tin cơ bản Sản phẩm */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Package size={18} color="#2563eb" />
              <span>Thông tin Định danh Sản phẩm</span>
            </h2>

            <div className={styles.grid2}>
              {/* SKU */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <span>Mã SKU</span>
                  <span className={styles.requiredStar}>*</span>
                </label>
                <div className={styles.inputWrapper}>
                  <Barcode size={16} className={styles.inputIcon} />
                  <input
                    type="text"
                    required
                    className={`${styles.input} ${errors.sku ? styles.inputError : ''}`}
                    value={formData.sku}
                    onChange={(e) => handleInputChange('sku', e.target.value)}
                    placeholder="VD: CRM-ENT-2026"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.sku && <span className={styles.fieldError}>{errors.sku}</span>}
              </div>

              {/* Tên sản phẩm */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <span>Tên sản phẩm / Dịch vụ</span>
                  <span className={styles.requiredStar}>*</span>
                </label>
                <div className={styles.inputWrapper}>
                  <Package size={16} className={styles.inputIcon} />
                  <input
                    type="text"
                    required
                    className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="VD: Gói CRM Doanh nghiệp Enterprise"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.name && <span className={styles.fieldError}>{errors.name}</span>}
              </div>
            </div>

            <div className={styles.grid2}>
              {/* Nhóm sản phẩm */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <span>Nhóm / Danh mục sản phẩm</span>
                </label>
                <div className={styles.inputWrapper}>
                  <Layers size={16} className={styles.inputIcon} />
                  <select
                    className={styles.select}
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="Phần mềm CRM">Phần mềm CRM</option>
                    <option value="Dịch vụ Đào tạo & Onboarding">Dịch vụ Onboarding</option>
                    <option value="Gói Hạ tầng">Gói Hạ tầng</option>
                    <option value="Khác">Danh mục khác</option>
                  </select>
                </div>
              </div>

              {/* Đơn vị tính */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <span>Đơn vị tính (ĐVT)</span>
                  <span className={styles.requiredStar}>*</span>
                </label>
                <div className={styles.inputWrapper}>
                  <FileText size={16} className={styles.inputIcon} />
                  <input
                    type="text"
                    required
                    className={`${styles.input} ${errors.unit ? styles.inputError : ''}`}
                    value={formData.unit}
                    onChange={(e) => handleInputChange('unit', e.target.value)}
                    placeholder="VD: Gói / Tháng, License / User"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.unit && <span className={styles.fieldError}>{errors.unit}</span>}
              </div>
            </div>
          </section>

          {/* Section 2: Chính sách giá */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <DollarSign size={18} color="#2563eb" />
              <span>Chính sách Giá & Định mức Doanh thu</span>
            </h2>

            <div className={styles.grid2}>
              {/* Giá bán niêm yết */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <span>Giá bán niêm yết (VNĐ)</span>
                  <span className={styles.requiredStar}>*</span>
                </label>
                <div className={styles.inputWrapper}>
                  <DollarSign size={16} className={styles.inputIcon} />
                  <input
                    type="number"
                    min="0"
                    step="500000"
                    required
                    className={`${styles.input} ${errors.selling_price ? styles.inputError : ''}`}
                    value={formData.selling_price}
                    onChange={(e) => handleInputChange('selling_price', Number(e.target.value))}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.selling_price && (
                  <span className={styles.fieldError}>{errors.selling_price}</span>
                )}
              </div>

              {/* Giá vốn (Cost Price) */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <span>Giá vốn (Cost Price - Chỉ Giám đốc / Quản trị)</span>
                </label>
                <div className={styles.inputWrapper}>
                  <DollarSign size={16} className={styles.inputIcon} />
                  <input
                    type="number"
                    min="0"
                    step="500000"
                    className={`${styles.input} ${errors.cost_price ? styles.inputError : ''}`}
                    value={formData.cost_price}
                    onChange={(e) => handleInputChange('cost_price', Number(e.target.value))}
                    disabled={isSubmitting || !isDirector}
                  />
                </div>
                {!isDirector && (
                  <span className={styles.helperText}>
                    <ShieldAlert size={12} style={{ display: 'inline', marginRight: 4 }} />
                    Bạn không có quyền Giám đốc để xem/sửa giá vốn
                  </span>
                )}
              </div>
            </div>

            <div className={styles.grid2}>
              {/* Trạng thái kinh doanh */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <span>Trạng thái kinh doanh</span>
                </label>
                <select
                  className={`${styles.select} ${styles.selectNoIcon}`}
                  value={formData.is_active ? 'active' : 'inactive'}
                  onChange={(e) => handleInputChange('is_active', e.target.value === 'active')}
                  disabled={isSubmitting}
                >
                  <option value="active">Đang kinh doanh (Active)</option>
                  <option value="inactive">Tạm ngừng bán (Inactive)</option>
                </select>
              </div>
            </div>

            {/* Mô tả */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <span>Mô tả chi tiết sản phẩm / tính năng</span>
              </label>
              <textarea
                className={styles.textarea}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Mô tả phạm vi áp dụng, thông số kỹ thuật hoặc giới hạn tính năng..."
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
              onClick={() => navigate('/products')}
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
                  <span>Lưu thay đổi Sản phẩm</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
