import React from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import logoUrl from '../assets/logo.svg';
import styles from './LoginPage.module.css';

export const LoginPage: React.FC = () => {
  return (
    <div className={styles.authContainer}>
      <header className={styles.brandHeader}>
        <div className={styles.brandLogoRow}>
          <img src={logoUrl} alt="NexusCRM Logo" className={styles.logo} />
          <h1 className={styles.brandTitle}>NexusCRM</h1>
        </div>
        <p className={styles.brandSubtitle}>Đăng nhập bằng tài khoản NexusCRM</p>
      </header>

      <main className={styles.formWrapper}>
        <LoginForm />
      </main>

      <footer className={styles.authFooter}>
        <span>NexusCRM Enterprise © 2026 · Hệ thống thông tin nội bộ</span>
      </footer>
    </div>
  );
};
