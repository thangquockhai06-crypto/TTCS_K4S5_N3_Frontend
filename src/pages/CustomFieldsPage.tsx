import React from 'react';
import { CustomFieldBuilder } from '../components/custom-fields/CustomFieldBuilder';

export const CustomFieldsPage: React.FC = () => {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      <CustomFieldBuilder />
    </div>
  );
};
