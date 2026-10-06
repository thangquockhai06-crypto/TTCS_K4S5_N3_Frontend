import React from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import logoUrl from '../assets/logo.svg';
import styles from './LoginPage.module.css';

export const LoginPage: React.FC = () => {
  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <header className={styles.loginHeader}>
          <img src={logoUrl} alt="NexusCRM Logo" className={styles.logo} />
          <div>
            <h1 className={styles.brandTitle}>NexusCRM</h1>
            <p className={styles.brandSubtitle}>Hệ thống Quản trị Quan hệ Khách hàng Doanh nghiệp</p>
          </div>
        </header>

        <main className={styles.formWrapper}>
          <LoginForm />
        </main>

        <footer className={styles.loginFooter}>
          <span>NexusCRM Enterprise © 2026 · Hệ thống thông tin nội bộ</span>
        </footer>
      </div>
    </div>
  );
};
