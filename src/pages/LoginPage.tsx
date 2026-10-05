import React from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import logoUrl from '../assets/logo.svg';
import styles from './LoginPage.module.css';

export const LoginPage: React.FC = () => {
  return (
    <div className={styles.authPageContainer}>
      <div className={styles.authCard}>
        <header className={styles.authHeader}>
          <img src={logoUrl} alt="NexusCRM" className={styles.authLogo} />
          <div>
            <h1 className={styles.authBrandTitle}>NexusCRM</h1>
            <p className={styles.authBrandSubtitle}>Hệ thống Quản trị Quan hệ Khách hàng Doanh nghiệp</p>
          </div>
        </header>

        <main>
          <LoginForm />
        </main>

        <footer className={styles.authFooter}>
          <span>NexusCRM Enterprise © 2026 · Hệ thống thông tin nội bộ</span>
        </footer>
      </div>
    </div>
  );
};
