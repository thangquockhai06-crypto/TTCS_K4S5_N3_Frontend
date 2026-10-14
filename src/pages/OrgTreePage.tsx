import React from 'react';
import { OrgTreeView } from '../components/org/OrgTreeView';

export const OrgTreePage: React.FC = () => {
  return (
    <div style={{ width: '100%', minWidth: 0, maxWidth: '100%', margin: 0, padding: 0, boxSizing: 'border-box' }}>
      <OrgTreeView />
    </div>
  );
};
