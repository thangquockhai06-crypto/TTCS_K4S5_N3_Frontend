import React from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { QuoteDiffViewer } from '../components/quote/QuoteDiffViewer';
import { IQuote } from '../interfaces/quote.interface';

export const QuoteComparePage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const dealIdFromQuery = searchParams.get('dealId');
  const baseVerId = searchParams.get('baseId') || undefined;
  const targetVerId = searchParams.get('targetId') || undefined;

  const resolvedDealId = id || dealIdFromQuery || 'deal-101';

  const handleSelectVersion = (version: IQuote) => {
    navigate(`/deals/${resolvedDealId}/quote-builder?quoteId=${version.id}`);
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '16px 20px 48px 20px' }}>
      <QuoteDiffViewer
        dealId={resolvedDealId}
        initialBaseVersionId={baseVerId}
        initialTargetVersionId={targetVerId}
        onClose={() => navigate(`/deals/${resolvedDealId}/quote-builder`)}
        onSelectVersion={handleSelectVersion}
      />
    </div>
  );
};
