import React from 'react';
import { RegisterForm } from '../components/auth/RegisterForm';
import logoUrl from '../assets/logo.svg';
import styles from './LoginPage.module.css';

export const RegisterPage: React.FC = () => {
  return (
    <div className={styles.authPageContainer}>
      <div className={styles.authCard}>
        <header className={styles.authHeader}>
          <img src={logoUrl} alt="NexusCRM" className={styles.authLogo} />
          <div>
            <h1 className={styles.authBrandTitle}>NexusCRM</h1>
            <p className={styles.authBrandSubtitle}>Khởi tạo tài khoản doanh nghiệp mới</p>
          </div>
        </header>

        <main>
          <RegisterForm />
        </main>

        <footer className={styles.authFooter}>
          <span>NexusCRM Enterprise © 2026 · Hệ thống thông tin nội bộ</span>
        </footer>
      </div>
    </div>
  );
};
