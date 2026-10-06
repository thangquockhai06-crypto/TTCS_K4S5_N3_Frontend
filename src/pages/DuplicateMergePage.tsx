import React from 'react';
import { DuplicateMergeManager } from '../components/duplicate-merge/DuplicateMergeManager';
import styles from './DuplicateMergePage.module.css';

export const DuplicateMergePage: React.FC = () => {
  return (
    <main className={styles.pageContainer} aria-label="Trang Cảnh báo và Gộp Khách hàng Trùng lặp">
      <DuplicateMergeManager />
    </main>
  );
};
