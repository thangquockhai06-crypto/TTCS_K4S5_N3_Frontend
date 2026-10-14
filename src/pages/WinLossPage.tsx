import React from 'react';
import { WinLossConfig } from '../components/win-loss/WinLossConfig';

export const WinLossPage: React.FC = () => {
  return (
    <div style={{ width: '100%', minWidth: 0, maxWidth: '100%', margin: 0, padding: 0, boxSizing: 'border-box' }}>
      <WinLossConfig />
    </div>
  );
};
