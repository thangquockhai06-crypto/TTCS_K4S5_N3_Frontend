import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

export interface IConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<IConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy bỏ',
  isDanger = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      maxWidth="sm"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <Button variant="secondary" onClick={onCancel} size="md">
            {cancelLabel}
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            size="md"
            style={isDanger ? { backgroundColor: '#DC2626', borderColor: '#DC2626' } : undefined}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <div style={{ color: '#475569', fontSize: '0.875rem', lineHeight: 1.5 }}>
        {message}
      </div>
    </Modal>
  );
};
