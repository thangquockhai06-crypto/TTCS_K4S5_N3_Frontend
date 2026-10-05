import React from 'react';
import { RegisterForm } from '../components/auth/RegisterForm';
import logoUrl from '../assets/logo.svg';
import styles from './LoginPage.module.css';

export const RegisterPage: React.FC = () => {
  return (
    <div className={styles.authContainer}>
      <header className={styles.brandHeader}>
        <div className={styles.brandLogoRow}>
          <img src={logoUrl} alt="NexusCRM Logo" className={styles.logo} />
          <h1 className={styles.brandTitle}>NexusCRM</h1>
        </div>
        <p className={styles.brandSubtitle}>Đăng ký tài khoản NexusCRM</p>
        <span className={styles.brandDomain}>nexuscrm.vn</span>
      </header>

      <main className={styles.formWrapper}>
        <RegisterForm />
      </main>

      <footer className={styles.authFooter}>
        <span>NexusCRM Enterprise © 2026 · Hệ thống thông tin nội bộ</span>
      </footer>
    </div>
  );
};
