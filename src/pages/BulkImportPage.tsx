import React from 'react';
import { BulkImportManager } from '../components/bulk-import';
import styles from './BulkImportPage.module.css';

export const BulkImportPage: React.FC = () => (
  <main className={styles.bulkImportPage}>
    <BulkImportManager />
  </main>
);
