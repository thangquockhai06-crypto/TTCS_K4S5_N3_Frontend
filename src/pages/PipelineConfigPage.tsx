import React from 'react';
import { PipelineConfigView } from '../components/pipeline/PipelineConfigView';

export const PipelineConfigPage: React.FC = () => {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      <PipelineConfigView />
    </div>
  );
};
