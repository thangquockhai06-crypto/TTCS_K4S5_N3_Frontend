import React from 'react';
import {
  Activity,
  AlertTriangle,
  Briefcase,
  GitMerge,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { IDuplicatePair } from '../../interfaces/duplicate-merge.interface';
import { Button } from '../common';
import { DuplicateMatchBadge } from './DuplicateMatchBadge';
import { formatCurrency } from '../../utils/formatters';
import styles from './DuplicateAlertCard.module.css';

export interface IDuplicateAlertCardProps {
  pair: IDuplicatePair;
  onCompareAndMerge: (pair: IDuplicatePair) => void;
  onDismiss: (pairId: string) => void;
}

export const DuplicateAlertCard: React.FC<IDuplicateAlertCardProps> = ({
  pair,
  onCompareAndMerge,
  onDismiss,
}) => {
  const p = pair.primaryRecord;
  const d = pair.duplicateRecord;
  const isDifferentOwner = p.ownerId !== d.ownerId;

  return (
    <article className={styles.alertCard} aria-label={`Cảnh báo trùng lặp ${p.companyName}`}>
      {/* Header with match type and conflict warning */}
      <div className={styles.alertCard__header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <DuplicateMatchBadge matchType={pair.matchType} confidence={pair.matchConfidence} />
          {isDifferentOwner && (
            <span className={styles.alertCard__conflictBadge}>
              <AlertTriangle size={13} /> 2 nhân viên cùng chào khách
            </span>
          )}
        </div>

        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
          Phát hiện: {new Date(pair.detectedAt).toLocaleDateString('vi-VN')}
        </span>
      </div>

      {/* Body: Record A vs Record B */}
      <div className={styles.alertCard__body}>
        {/* Record A */}
        <div className={`${styles.recordBox} ${styles['recordBox--primary']}`}>
          <div className={styles.recordHeader}>
            <span className={styles.recordTag}>Bản ghi A (Chính)</span>
            <span style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600 }}>
              {formatCurrency(p.dealValue || 0)}
            </span>
          </div>
          <div className={styles.recordName}>{p.companyName}</div>
          <div className={styles.recordMeta}>
            <span>MST: {p.taxCode || '(Chưa có)'}</span>
            <span>Website: {p.website || '(Chưa có)'}</span>
          </div>
          <div className={styles.ownerRow}>
            <UserCheck size={14} color="#2563eb" />
            <span>
              {p.ownerName} ({p.ownerTeam})
            </span>
          </div>
        </div>

        {/* VS circle */}
        <div className={styles.vsIcon}>VS</div>

        {/* Record B */}
        <div className={styles.recordBox}>
          <div className={styles.recordHeader}>
            <span className={styles.recordTag} style={{ color: '#ea580c' }}>
              Bản ghi B (Trùng)
            </span>
            <span style={{ fontSize: '0.75rem', color: '#ea580c', fontWeight: 600 }}>
              {formatCurrency(d.dealValue || 0)}
            </span>
          </div>
          <div className={styles.recordName}>{d.companyName}</div>
          <div className={styles.recordMeta}>
            <span>MST: {d.taxCode || '(Chưa có)'}</span>
            <span>Website: {d.website || '(Chưa có)'}</span>
          </div>
          <div className={styles.ownerRow}>
            <UserCheck size={14} color="#ea580c" />
            <span>
              {d.ownerName} ({d.ownerTeam})
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={styles.alertCard__footer}>
        <div className={styles.resourcesBadge}>
          <span>Tài nguyên gộp:</span>
          <span>
            <Users size={12} style={{ display: 'inline' }} /> {(p.contactCount || 0) + (d.contactCount || 0)} liên hệ ·{' '}
            <Briefcase size={12} style={{ display: 'inline' }} /> {(p.dealCount || 0) + (d.dealCount || 0)} cơ hội ·{' '}
            <Activity size={12} style={{ display: 'inline' }} /> {(p.activityCount || 0) + (d.activityCount || 0)} hoạt động
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onDismiss(pair.id)}
            title="Bỏ qua cảnh báo này nếu không phải trùng"
          >
            <X size={14} /> Bỏ qua
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<GitMerge size={14} />}
            onClick={() => onCompareAndMerge(pair)}
          >
            So sánh & Gộp
          </Button>
        </div>
      </div>
    </article>
  );
};
