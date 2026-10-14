import React from 'react';
import { CustomFieldBuilder } from '../components/custom-fields/CustomFieldBuilder';

export const CustomFieldsPage: React.FC = () => {
  return (
    <div style={{ width: '100%', minWidth: 0, maxWidth: '100%', margin: 0, padding: 0, boxSizing: 'border-box' }}>
      <CustomFieldBuilder />
    </div>
  );
};
