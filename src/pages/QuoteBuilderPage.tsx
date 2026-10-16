import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { QuoteBuilder } from '../components/quote/QuoteBuilder';

export const QuoteBuilderPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const dealIdFromQuery = searchParams.get('dealId');

  const resolvedDealId = id || dealIdFromQuery || 'deal-101';

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '16px 20px 48px 20px' }}>
      <QuoteBuilder dealId={resolvedDealId} />
    </div>
  );
};
