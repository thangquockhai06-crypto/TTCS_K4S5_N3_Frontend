import React from 'react';
import { Building2, ChevronLeft, ChevronRight, Mail, Phone, UserRound } from 'lucide-react';
import {
  ILead,
  LEAD_SOURCE_OPTIONS,
  LEAD_STATUS_OPTIONS,
  LEAD_TEMPERATURE_OPTIONS,
} from '../types/Lead.types';
import { LeadSlaBadge } from './LeadSlaBadge';
import styles from '../styles/LeadManagement.module.css';

export interface ILeadListProps {
  leads: ILead[];
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  now: Date;
  onPageChange: (page: number) => void;
  onRetry: () => void;
}

function getOptionLabel(
  options: ReadonlyArray<{ value: string; label: string }>,
  value: string
): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

function formatCreatedAt(value: string): string {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return 'Ngày tạo chưa xác định';
  }
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(timestamp);
}

export const LeadList: React.FC<ILeadListProps> = ({
  leads,
  total,
  page,
  totalPages,
  isLoading,
  error,
  now,
  onPageChange,
  onRetry,
}) => {
  if (isLoading) {
    return (
      <section className={styles.statePanel} aria-live="polite" aria-busy="true">
        <span className={styles.spinner} aria-hidden="true" />
        <p>Đang tải danh sách Lead...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.statePanel} role="alert">
        <h2>Không thể tải danh sách</h2>
        <p>{error}</p>
        <button className={styles.button} type="button" onClick={onRetry}>
          Thử tải lại
        </button>
      </section>
    );
  }

  if (total === 0) {
    return (
      <section className={styles.statePanel} aria-live="polite">
        <h2>Không tìm thấy Lead phù hợp</h2>
        <p>Thử thay đổi điều kiện lọc hoặc xóa bộ lọc để xem toàn bộ danh sách.</p>
      </section>
    );
  }

  return (
    <section className={styles.leadList} aria-label="Danh sách Lead">
      <div className={styles.leadGrid}>
        {leads.map((lead) => (
          <article className={styles.leadCard} key={lead.id}>
            <div className={styles.leadCard__heading}>
              <div>
                <h3>{lead.fullName}</h3>
                <p className={styles.leadCard__company}>
                  <Building2 size={14} aria-hidden="true" />
                  {lead.company}
                </p>
              </div>
              <span
                className={`${styles.statusPill} ${styles[`statusPill--${lead.status}`]}`}
              >
                {getOptionLabel(LEAD_STATUS_OPTIONS, lead.status)}
              </span>
            </div>

            <div className={styles.leadCard__details}>
              <a href={`mailto:${lead.email}`}>
                <Mail size={14} aria-hidden="true" />
                {lead.email}
              </a>
              <a href={`tel:${lead.phone.replace(/\s+/g, '')}`}>
                <Phone size={14} aria-hidden="true" />
                {lead.phone}
              </a>
            </div>

            <div className={styles.leadCard__meta}>
              <span className={styles.metaTag}>
                Nguồn: {getOptionLabel(LEAD_SOURCE_OPTIONS, lead.source)}
              </span>
              <span className={`${styles.metaTag} ${styles[`metaTag--${lead.temperature}`]}`}>
                {getOptionLabel(LEAD_TEMPERATURE_OPTIONS, lead.temperature)}
              </span>
              <span className={styles.ownerLabel}>
                <UserRound size={14} aria-hidden="true" />
                {lead.owner.name}
              </span>
            </div>

            <div className={styles.leadCard__footer}>
              <span>Ngày tạo: {formatCreatedAt(lead.createdAt)}</span>
              <LeadSlaBadge lead={lead} now={now} />
            </div>
          </article>
        ))}
      </div>

      {totalPages > 1 && (
        <nav className={styles.pagination} aria-label="Phân trang danh sách Lead">
          <span>
            Trang {page} / {totalPages} · {total} Lead
          </span>
          <div className={styles.pagination__actions}>
            <button
              className={styles.iconButton}
              type="button"
              aria-label="Trang trước"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              className={styles.iconButton}
              type="button"
              aria-label="Trang sau"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </nav>
      )}
    </section>
  );
};
