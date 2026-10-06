import React from 'react';
import {
  IDuplicatePair,
  IMergeCustomerDTO,
} from '../../interfaces/duplicate-merge.interface';
import { Modal } from '../common';
import { SideBySideCompareView } from './SideBySideCompareView';

export interface IMergeCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pair: IDuplicatePair | null;
  isTeamLeadOrAbove: boolean;
  currentUserName: string;
  currentUserRole: string;
  onConfirmMerge: (dto: IMergeCustomerDTO) => void;
}

export const MergeCustomerModal: React.FC<IMergeCustomerModalProps> = ({
  isOpen,
  onClose,
  pair,
  isTeamLeadOrAbove,
  currentUserName,
  currentUserRole,
  onConfirmMerge,
}) => {
  if (!pair) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="So sánh & Gộp Khách hàng Trùng lặp"
      subtitle={`Hợp nhất "${pair.primaryRecord.companyName}" và "${pair.duplicateRecord.companyName}" — Bảo toàn toàn bộ liên hệ, cơ hội và lịch sử hoạt động`}
    >
      <SideBySideCompareView
        pair={pair}
        isTeamLeadOrAbove={isTeamLeadOrAbove}
        currentUserName={currentUserName}
        currentUserRole={currentUserRole}
        onConfirmMerge={(dto) => {
          onConfirmMerge(dto);
          onClose();
        }}
        onCancel={onClose}
      />
    </Modal>
  );
};
