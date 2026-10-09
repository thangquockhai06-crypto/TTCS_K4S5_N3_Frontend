import React, { useRef, useState } from 'react';
import { Camera, Trash2, AlertCircle, Check, RefreshCw } from 'lucide-react';
import { sprint2Service } from '../../services/sprint2Service';

interface IAvatarUploaderProps {
  currentAvatarUrl?: string;
  onAvatarChange: (newAvatarUrl: string) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

export const AvatarUploader: React.FC<IAvatarUploaderProps> = ({
  currentAvatarUrl,
  onAvatarChange,
  disabled,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(
    currentAvatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // S2-03: Max 2MB check
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(
        `Kích thước ảnh (${(file.size / 1024 / 1024).toFixed(2)}MB) vượt quá dung lượng tối đa 2MB.`
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Chỉ hỗ trợ tệp định dạng hình ảnh (PNG, JPG, WEBP).');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setErrorMessage(null);
    setSuccessNotice(false);
    setIsUploading(true);

    try {
      const res = await sprint2Service.uploadAvatar(file);
      if (res && res.avatar_url) {
        setPreviewUrl(res.avatar_url);
        onAvatarChange(res.avatar_url);
        setSuccessNotice(true);
        window.setTimeout(() => setSuccessNotice(false), 4000);
      } else {
        throw new Error('Máy chủ không trả về đường dẫn ảnh hợp lệ.');
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message || 'Lỗi khi tải ảnh đại diện lên máy chủ.';
      setErrorMessage(detail);
      setSuccessNotice(false);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    const defaultAvatar =
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces';
    setPreviewUrl(defaultAvatar);
    onAvatarChange(defaultAvatar);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            flexShrink: 0,
            backgroundColor: '#f1f5f9',
          }}
        >
          <img
            src={previewUrl}
            alt="Ảnh đại diện"
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
            accept="image/png,image/jpeg,image/webp"
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
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#334155',
                fontSize: '0.8rem',
                fontWeight: 500,
                cursor: (disabled || isUploading) ? 'not-allowed' : 'pointer',
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
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #fecaca',
                backgroundColor: '#fff1f2',
                color: '#e11d48',
                fontSize: '0.8rem',
                cursor: (disabled || isUploading) ? 'not-allowed' : 'pointer',
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

      {/* Validation error */}
      {errorMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#dc2626',
            fontSize: '0.8rem',
            backgroundColor: '#fef2f2',
            padding: '6px 10px',
            borderRadius: '4px',
            border: '1px solid #fecaca',
          }}
        >
          <AlertCircle size={14} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Success feedback */}
      {successNotice && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#15803d',
            fontSize: '0.8rem',
          }}
        >
          <Check size={14} />
          <span>Ảnh đại diện đã được tải lên và lưu thành công trên máy chủ!</span>
        </div>
      )}
    </div>
  );
};
