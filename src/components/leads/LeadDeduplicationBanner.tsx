import React from 'react';
import { AlertTriangle, UserCheck, GitMerge } from 'lucide-react';
import { Button } from '../common';
import { IDuplicateCheckResult } from '../../interfaces/lead-deduplication.interface';

export interface ILeadDeduplicationBannerProps {
  checkResult: IDuplicateCheckResult;
  onLinkToCustomer?: () => void;
  onOpenMerge?: () => void;
}

export const LeadDeduplicationBanner: React.FC<ILeadDeduplicationBannerProps> = ({
  checkResult,
  onLinkToCustomer,
  onOpenMerge,
}) => {
  if (!checkResult.hasDuplicate || checkResult.matches.length === 0) {
    return null;
  }

  const primaryMatch = checkResult.matches[0];
  const isCustomer = primaryMatch.targetType === 'customer';

  const matchTypeText =
    primaryMatch.matchType === 'phone'
      ? 'Số điện thoại'
      : primaryMatch.matchType === 'email'
      ? 'Địa chỉ Email'
      : 'Tên công ty';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        padding: '12px 16px',
        borderRadius: '8px',
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        border: '1.5px solid rgba(239, 68, 68, 0.35)',
        marginBottom: '14px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <AlertTriangle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#DC2626' }}>
            Phát hiện thông tin trùng lặp trong hệ thống ({matchTypeText}: {primaryMatch.matchValue})
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
            {isCustomer ? (
              <>
                Thông tin này trùng khớp với Khách hàng hiện hữu{' '}
                <strong>&quot;{primaryMatch.matchedRecordName}&quot;</strong> ({primaryMatch.matchedRecordCompany}). Hãy gắn thẳng vào hồ sơ khách hàng để tránh 2 nhân viên cùng gọi điện một người!
              </>
            ) : (
              <>
                Thông tin này trùng khớp với Lead sẵn có{' '}
                <strong>&quot;{primaryMatch.matchedRecordName}&quot;</strong> ({primaryMatch.matchedRecordCompany}). Bạn có thể tiến hành gộp hai bản ghi để giữ nguyên toàn bộ lịch sử tương tác.
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        {isCustomer && onLinkToCustomer && (
          <Button
            type="button"
            variant="primary"
            size="sm"
            leftIcon={<UserCheck size={14} />}
            onClick={onLinkToCustomer}
          >
            Gắn Thẳng Vào Khách Hàng Này
          </Button>
        )}

        {!isCustomer && onOpenMerge && (
          <Button
            type="button"
            variant="primary"
            size="sm"
            leftIcon={<GitMerge size={14} />}
            onClick={onOpenMerge}
          >
            Gợi Ý Gộp Lead Trùng
          </Button>
        )}
      </div>
    </div>
  );
};
