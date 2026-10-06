import React from 'react';
import { OrgTreeView } from '../components/org/OrgTreeView';

export const OrgTreePage: React.FC = () => {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      <OrgTreeView />
    </div>
  );
};
