import React from 'react';
import { CampaignTrackerView } from '../components/leads/CampaignTrackerView';

export const CampaignsPage: React.FC = () => {
  return (
    <div style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
      <CampaignTrackerView />
    </div>
  );
};
