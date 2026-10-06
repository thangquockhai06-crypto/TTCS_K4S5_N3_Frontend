import React from 'react';
import { ContactManager } from '../components/contacts/ContactManager';
import styles from './ContactManagementPage.module.css';

export const ContactManagementPage: React.FC = () => {
  return (
    <main className={styles.contactManagementPage} aria-label="Trang quản lý người liên hệ và vai trò quyết định mua">
      <ContactManager />
    </main>
  );
};
