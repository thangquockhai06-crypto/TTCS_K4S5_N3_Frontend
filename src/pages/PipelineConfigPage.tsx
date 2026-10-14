import React from 'react';
import { PipelineConfigView } from '../components/pipeline/PipelineConfigView';

export const PipelineConfigPage: React.FC = () => {
  return (
    <div style={{ width: '100%', minWidth: 0, maxWidth: '100%', margin: 0, padding: 0, boxSizing: 'border-box' }}>
      <PipelineConfigView />
    </div>
  );
};
