import React from 'react';
import { WinLossConfig } from '../components/win-loss/WinLossConfig';

export const WinLossPage: React.FC = () => {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      <WinLossConfig />
    </div>
  );
};
