import React from 'react';
import { CompanyAccountManager } from '../components/company-accounts/CompanyAccountManager';
import styles from './CompanyAccountsPage.module.css';

export const CompanyAccountsPage: React.FC = () => {
  return (
    <main className={styles.companyAccountsPage} aria-label="Trang quản lý hồ sơ khách hàng doanh nghiệp">
      <CompanyAccountManager />
    </main>
  );
};
