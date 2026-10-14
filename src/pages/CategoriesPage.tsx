import React from 'react';
import { CategoryManager } from '../components/categories/CategoryManager';

export const CategoriesPage: React.FC = () => {
  return (
    <div style={{ width: '100%', minWidth: 0, maxWidth: '100%', margin: 0, padding: 0, boxSizing: 'border-box' }}>
      <CategoryManager />
    </div>
  );
};
