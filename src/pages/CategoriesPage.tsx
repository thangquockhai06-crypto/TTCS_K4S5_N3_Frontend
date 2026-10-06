import React from 'react';
import { CategoryManager } from '../components/categories/CategoryManager';

export const CategoriesPage: React.FC = () => {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      <CategoryManager />
    </div>
  );
};
