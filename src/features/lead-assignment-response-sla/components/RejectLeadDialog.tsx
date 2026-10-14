import React, { FormEvent, useEffect, useState } from 'react';
import { Button } from '../../../components/common';

interface IRejectLeadDialogProps {
  isOpen: boolean;
  leadName: string;
  company: string;
  reason: string;
  isSubmitting: boolean;
  onClose: () => void;
  onReasonChange: (value: string) => void;
  onSubmit: () => Promise<void>;
  error: string | null;
}

export const RejectLeadDialog: React.FC<IRejectLeadDialogProps> = ({
  isOpen,
  leadName,
  company,
  reason,
  isSubmitting,
  onClose,
  onReasonChange,
  onSubmit,
  error,
}) => {
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setLocalError(null);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) {
      setLocalError('A rejection reason is required.');
      return;
    }
    setLocalError(null);
    await onSubmit();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-lead-title"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        background: 'rgba(15, 23, 42, 0.5)',
        padding: '16px',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          width: 'min(520px, 100%)',
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          padding: '24px',
        }}
      >
        <div style={{ marginBottom: '16px' }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            Reject lead
          </p>
          <h3 id="reject-lead-title" style={{ fontSize: '1.5rem', marginTop: '4px' }}>
            Reject assignment
          </h3>
        </div>

        <div style={{ display: 'grid', gap: '8px', marginBottom: '16px' }}>
          <div>
            <strong>{leadName}</strong>
          </div>
          <div style={{ color: 'var(--color-text-secondary)' }}>{company}</div>
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} noValidate>
          <label style={{ display: 'grid', gap: '8px', marginBottom: '12px' }}>
            <span>Mandatory rejection reason</span>
            <textarea
              rows={4}
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
              aria-invalid={Boolean(localError || error)}
              style={{
                width: '100%',
                resize: 'vertical',
                borderRadius: '12px',
                border: '1px solid var(--color-border)',
                padding: '12px 14px',
                background: 'var(--color-bg-app)',
                color: 'var(--color-text-primary)',
              }}
              placeholder="Explain why the lead is rejected and returned to the queue."
            />
          </label>

          {(localError || error) && (
            <p role="alert" style={{ color: 'var(--color-danger)', marginBottom: '12px' }}>
              {localError ?? error}
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="danger" type="submit" isLoading={isSubmitting}>
              Reject lead
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
