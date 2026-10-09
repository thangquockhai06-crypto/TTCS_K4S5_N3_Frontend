import React, { useRef, useState, useEffect } from 'react';
import { Camera, Trash2, RefreshCw } from 'lucide-react';
import { sprint2Service } from '../../services/sprint2Service';
import { resolveAvatarUrl } from '../common/Avatar';
import { useToast } from '../../context/ToastContext';

interface IAvatarUploaderProps {
  currentAvatarUrl?: string;
  onAvatarChange: (newAvatarUrl: string) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces';

export const AvatarUploader: React.FC<IAvatarUploaderProps> = ({
  currentAvatarUrl,
  onAvatarChange,
  disabled,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showSuccess, showError } = useToast();

  const [previewUrl, setPreviewUrl] = useState<string>(() => {
    return resolveAvatarUrl(currentAvatarUrl) || DEFAULT_AVATAR;
  });
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);

  useEffect(() => {
    if (currentAvatarUrl) {
      setPreviewUrl(resolveAvatarUrl(currentAvatarUrl) || DEFAULT_AVATAR);
      setImageError(false);
    }
  }, [currentAvatarUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // S2-03: Max 2MB check
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const msg = `Kích thước ảnh (${(file.size / 1024 / 1024).toFixed(2)}MB) vượt quá dung lượng tối đa cho phép là 2MB.`;
      showError(msg, 'Ảnh không hợp lệ');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (!file.type.startsWith('image/')) {
      const msg = 'Chỉ hỗ trợ tệp định dạng hình ảnh (PNG, JPG, WEBP).';
      showError(msg, 'Định dạng không hỗ trợ');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Instant local preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setImageError(false);
    setIsUploading(true);

    try {
      const res = await sprint2Service.uploadAvatar(file);
      if (res && res.avatar_url) {
        const finalUrl = res.avatar_url.startsWith('http')
          ? res.avatar_url
          : `http://localhost:8000${res.avatar_url}`;

        setPreviewUrl(finalUrl);
        onAvatarChange(finalUrl);
        showSuccess('Ảnh đại diện đã được tải lên và lưu thành công trên máy chủ!');
      } else {
        throw new Error('Máy chủ không trả về đường dẫn ảnh hợp lệ.');
      }
    } catch (err: any) {
      const detail =
        err.response?.data?.detail || err.message || 'Lỗi khi tải ảnh đại diện lên máy chủ.';
      showError(detail, 'Tải ảnh thất bại');
      // Revert to original on error
      setPreviewUrl(resolveAvatarUrl(currentAvatarUrl) || DEFAULT_AVATAR);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    setPreviewUrl(DEFAULT_AVATAR);
    setImageError(false);
    onAvatarChange(DEFAULT_AVATAR);
    showSuccess('Đã gỡ ảnh đại diện và trở về ảnh mặc định.');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const displaySrc = imageError ? DEFAULT_AVATAR : previewUrl;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* 1:1 Aspect Ratio Preview Frame */}
        <div
          style={{
            position: 'relative',
            width: '96px',
            height: '96px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '2px solid #cbd5e1',
            boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
            flexShrink: 0,
            backgroundColor: '#f1f5f9',
          }}
        >
          <img
            src={displaySrc}
            alt="Ảnh đại diện"
            onError={() => setImageError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              aspectRatio: '1 / 1',
              display: 'block',
            }}
          />
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/jpg"
            style={{ display: 'none' }}
            onChange={handleFileChange}
            disabled={disabled}
          />

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              disabled={disabled || isUploading}
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#1e293b',
                fontSize: '0.825rem',
                fontWeight: 500,
                cursor: disabled || isUploading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {isUploading ? (
                <>
                  <RefreshCw size={14} className="spin" />
                  Đang tải lên...
                </>
              ) : (
                <>
                  <Camera size={14} />
                  Tải ảnh mới
                </>
              )}
            </button>

            <button
              type="button"
              disabled={disabled || isUploading}
              onClick={handleRemove}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '7px 12px',
                borderRadius: '6px',
                border: '1px solid #fecaca',
                backgroundColor: '#fff1f2',
                color: '#e11d48',
                fontSize: '0.825rem',
                fontWeight: 500,
                cursor: disabled || isUploading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Trash2 size={13} />
              Gỡ ảnh
            </button>
          </div>

          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Định dạng PNG, JPG hoặc WEBP. Tối đa 2MB. Tỉ lệ khung hình vuông 1:1.
          </span>
        </div>
      </div>
    </div>
  );
};
