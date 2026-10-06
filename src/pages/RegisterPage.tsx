import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Layers, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { RegisterForm } from '../components/auth/RegisterForm';
import logoUrl from '../assets/logo.svg';
import styles from './LoginPage.module.css';

export const RegisterPage: React.FC = () => {
  return (
    <div className={styles.loginSplitLayout}>
      {/* Cột trái: Giới thiệu lợi ích khi đăng ký Workspace */}
      <section className={styles.showcasePanel} aria-label="Quyền lợi đăng ký NexusCRM">
        <div className={styles.showcasePanel__meshGlow} aria-hidden="true" />

        <header className={styles.showcasePanel__brand}>
          <img src={logoUrl} alt="NexusCRM" className={styles.showcasePanel__logo} />
          <div>
            <span className={styles.showcasePanel__brandName}>NexusCRM</span>
            <span className={styles.showcasePanel__edition}>KHỞI TẠO DOANH NGHIỆP · 2026</span>
          </div>
        </header>

        <div className={styles.showcasePanel__hero}>
          <motion.h2
            className={styles.showcasePanel__headline}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            Thiết lập không gian quản trị khách hàng chỉ trong 30 giây.
          </motion.h2>
          <p className={styles.showcasePanel__subheadline}>
            Trải nghiệm trọn bộ công cụ quản lý danh bạ khách hàng B2B, bảng kéo thả cơ hội bán
            hàng Kanban và báo cáo doanh thu thời gian thực.
          </p>

          <motion.div
            className={styles.previewIllustration}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
          >
            <div className={styles.previewCard}>
              <div className={styles.previewCard__header}>
                <span className={styles.previewCard__tag}>
                  <Sparkles size={14} /> Đặc quyền Gói Doanh nghiệp (Enterprise)
                </span>
                <span className={styles.previewCard__badge}>Kích hoạt ngay</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                <div className={styles.previewMiniPill}>
                  <CheckCircle2 size={16} className={styles.previewMiniPill__iconSuccess} />
                  <div>
                    <strong>Quản lý 360° Hồ sơ Khách hàng & Hợp đồng</strong>
                    <span>Tích hợp dòng thời gian hoạt động, ghi chú và tài liệu đính kèm</span>
                  </div>
                </div>

                <div className={styles.previewMiniPill}>
                  <Zap size={16} className={styles.previewMiniPill__iconPrimary} />
                  <div>
                    <strong>Phễu Cơ hội Kanban Kéo Thả Trực Quan</strong>
                    <span>Tự động tính toán doanh thu định kỳ (ARR) và xác suất chốt đơn</span>
                  </div>
                </div>

                <div className={styles.previewMiniPill}>
                  <ShieldCheck size={16} className={styles.previewMiniPill__iconSuccess} />
                  <div>
                    <strong>Bảo mật Phiên JWT & Tự động Refresh Token</strong>
                    <span>Lưu trữ tài khoản an toàn và đồng bộ tức thì trên trình duyệt</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <footer className={styles.showcasePanel__footer}>
          <div className={styles.showcasePanel__trustItem}>
            <Layers size={15} />
            <span>Tiêu chuẩn An toàn Thông tin SOC2 Type II & ISO 27001</span>
          </div>
          <span>Hỗ trợ Kỹ thuật 24/7</span>
        </footer>
      </section>

      {/* Cột phải: Form Đăng ký */}
      <main className={styles.formPanel}>
        <RegisterForm />
      </main>
    </div>
  );
};
