import React from 'react';
import { ProductList } from '../components/products/ProductList';

export const ProductsPage: React.FC = () => {
  return (
    <div style={{ width: '100%', maxWidth: '1600px', margin: '0 auto', padding: '24px 20px', boxSizing: 'border-box' }}>
      <header style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text-primary, #0f172a)', margin: 0 }}>
          Danh mục Sản phẩm & Dịch vụ
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted, #64748b)', marginTop: '4px' }}>
          Quản lý sản phẩm, bảng giá niêm yết, bảo mật giá vốn (Cost Price) cho Giám đốc và kiểm soát ràng buộc báo giá
        </p>
      </header>

      <ProductList />
    </div>
  );
};
