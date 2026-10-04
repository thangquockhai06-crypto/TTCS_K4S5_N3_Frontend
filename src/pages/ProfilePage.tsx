import React, { useState } from 'react';
import { Check, AlertCircle, Save } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { AvatarUploader } from '../components/profile/AvatarUploader';
import { sprint2Service } from '../services/sprint2Service';

const VN_PHONE_REGEX = /^(03|05|07|08|09)\d{8}$/;

export const ProfilePage: React.FC = () => {
  const { user, updateUserProfile } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || 'Quản Trị Viên Hệ Thống');
  const [phone, setPhone] = useState(user?.phone || '0912345678');
  const [title, setTitle] = useState(user?.title || 'Giám đốc Điều hành');
  const [department, setDepartment] = useState(user?.department || 'Ban Quản trị & Vận hành Doanh thu');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');

  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // S2-02: Vietnamese phone validation
    const cleanedPhone = phone.trim().replace(/[\s-]/g, '');
    if (cleanedPhone && !VN_PHONE_REGEX.test(cleanedPhone)) {
      setPhoneError('Số điện thoại không đúng chuẩn di động Việt Nam (gồm 10 số, bắt đầu bằng 03, 05, 07, 08 hoặc 09).');
      return;
    }
    setPhoneError(null);

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      await sprint2Service.updateProfile({
        full_name: fullName,
        phone: cleanedPhone,
        title,
        department,
        avatar_url: avatarUrl,
      });

      // Update local auth context
      updateUserProfile({
        fullName,
        title,
        department,
        avatarUrl,
        phone: cleanedPhone,
      });

      setStatusMessage({ type: 'success', text: 'Cập nhật thông tin hồ sơ cá nhân thành công!' });
      window.setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message || 'Lỗi khi cập nhật hồ sơ.';
      setStatusMessage({ type: 'error', text: detail });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 16px' }}>
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
          Hồ sơ Cá nhân
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '4px' }}>
          Quản lý thông tin cá nhân, ảnh đại diện và thông tin liên hệ trong hệ thống CRM
        </p>
      </header>

      {statusMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '20px',
            backgroundColor: statusMessage.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${statusMessage.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            color: statusMessage.type === 'success' ? '#166534' : '#991b1b',
            fontSize: '0.875rem',
          }}
        >
          {statusMessage.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        }}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* S2-03: Avatar Uploader */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', marginBottom: '12px' }}>
              Ảnh đại diện cá nhân
            </label>
            <AvatarUploader
              currentAvatarUrl={avatarUrl || user?.avatarUrl}
              onAvatarChange={(newUrl) => setAvatarUrl(newUrl)}
              disabled={isSubmitting}
            />
          </div>

          <div style={{ height: '1px', backgroundColor: '#e2e8f0' }} />

          {/* Form fields */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            {/* Họ và tên */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Họ và tên <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Số điện thoại VN */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Số điện thoại liên hệ (Chuẩn VN) <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="tel"
                  required
                  placeholder="0912345678"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (phoneError) setPhoneError(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: phoneError ? '1px solid #dc2626' : '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              {phoneError && (
                <span style={{ display: 'block', color: '#dc2626', fontSize: '0.75rem', marginTop: '4px' }}>
                  {phoneError}
                </span>
              )}
            </div>

            {/* Email - Readonly (S2-02 requirement) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
                Địa chỉ Email <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>(Chỉ đọc - Bảo mật)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  disabled
                  readOnly
                  value={user?.email || 'admin@nexus.vn'}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#f1f5f9',
                    color: '#64748b',
                    fontSize: '0.875rem',
                    cursor: 'not-allowed',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Role - Readonly (S2-02 requirement) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
                Vai trò hệ thống <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>(Chỉ đọc - Do Admin gán)</span>
              </label>
              <input
                type="text"
                disabled
                readOnly
                value={user?.role || 'Admin'}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#f1f5f9',
                  color: '#64748b',
                  fontSize: '0.875rem',
                  cursor: 'not-allowed',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Chức danh */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Chức danh công việc
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Phòng ban */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Phòng ban / Đơn vị
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Footer submit */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 20px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              <Save size={16} />
              {isSubmitting ? 'Đang lưu...' : 'Lưu thông tin hồ sơ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
