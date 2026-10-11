import React, { useState } from 'react';
import {
  Code,
  Copy,
  Check,
  ExternalLink,
  Layers,
  FileCode,
  Info,
} from 'lucide-react';
import { Button } from '../common';
import { useLeadCapture } from '../../hooks/useLeadCapture';
import { useToast } from '../../context/ToastContext';
import styles from './EmbedCodeGenerator.module.css';

export const EmbedCodeGenerator: React.FC = () => {
  const { config, updateConfig, iframeCode, scriptCode } = useLeadCapture();
  const { showToast } = useToast();
  const [copied, setCopied] = useState<boolean>(false);

  const activeCode = config.embedType === 'iframe' ? iframeCode : scriptCode;

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(activeCode);
      setCopied(true);
      showToast('Đã sao chép mã nguồn vào clipboard thành công!', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      showToast('Không thể sao chép mã tự động. Vui lòng quét chọn mã để copy.', 'warning');
    }
  };

  const handleOpenPreview = (): void => {
    const previewUrl = `/embed/lead-form?formId=${encodeURIComponent(config.id)}&source=${encodeURIComponent(config.leadSource)}`;
    window.open(previewUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={styles.embedSection}>
      <div className={styles.embedHeader}>
        <div>
          <div className={styles.headerTitle}>
            <Code size={20} color="var(--color-primary, #2563EB)" />
            Cấu Hình &amp; Xuất Bản Mã Nhúng Website
          </div>
          <div className={styles.headerSubtitle}>
            Nhúng biểu mẫu thu thập khách hàng tiềm năng vào WordPress, Landing Page hoặc bất kỳ website nào
          </div>
        </div>

        <div className={styles.formatToggle}>
          <button
            type="button"
            className={`${styles.formatBtn} ${config.embedType === 'iframe' ? styles.active : ''}`}
            onClick={() => updateConfig({ embedType: 'iframe' })}
          >
            <Layers size={14} /> Mã Nhúng Iframe
          </button>
          <button
            type="button"
            className={`${styles.formatBtn} ${config.embedType === 'script' ? styles.active : ''}`}
            onClick={() => updateConfig({ embedType: 'script' })}
          >
            <FileCode size={14} /> Mã Nhúng Script Widget
          </button>
        </div>
      </div>

      {/* Code Display Box */}
      <div className={styles.codeBox}>
        <div className={styles.codeHeader}>
          <span className={styles.codeTypeLabel}>
            {config.embedType === 'iframe' ? 'HTML / IFRAME SNIPPET' : 'JAVASCRIPT WIDGET SDK'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<ExternalLink size={14} />}
              onClick={handleOpenPreview}
            >
              Mở Trang Độc Lập
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              leftIcon={copied ? <Check size={14} /> : <Copy size={14} />}
              onClick={handleCopy}
            >
              {copied ? 'Đã Sao Chép!' : 'Sao Chép Mã Nguồn'}
            </Button>
          </div>
        </div>

        <pre className={styles.codePre}>
          <code>{activeCode}</code>
        </pre>
      </div>

      {/* Tip Info */}
      <div className={styles.infoTip}>
        <Info size={17} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--color-primary, #2563EB)' }} />
        <div>
          <strong>Hướng dẫn dán mã:</strong> Dán đoạn mã trên vào vị trí bạn muốn hiển thị biểu mẫu trong mã nguồn HTML của trang web hoặc thẻ widget HTML tùy chỉnh của WordPress / Webflow. Biểu mẫu đã tích hợp sẵn cơ chế bảo mật tự động chặn Spam Bot (Honeypot Trap) và hạn chế gửi quá tần suất theo IP.
        </div>
      </div>
    </div>
  );
};
