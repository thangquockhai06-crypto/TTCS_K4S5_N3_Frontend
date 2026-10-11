import React, { useState } from 'react';
import { GitMerge, ShieldCheck, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button, Badge } from '../common';
import { IDuplicateLeadPair } from '../../interfaces/lead-deduplication.interface';
import { useLeadDeduplication } from '../../hooks/useLeadDeduplication';
import { LeadMergeModal } from './LeadMergeModal';
import styles from './LeadDeduplicationView.module.css';

export const LeadDeduplicationView: React.FC = () => {
  const { duplicatePairs, mergeLeads } = useLeadDeduplication();
  const [activePairToMerge, setActivePairToMerge] = useState<IDuplicateLeadPair | null>(null);

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <div className={styles.mainTitle}>
            <GitMerge size={20} color="var(--color-primary)" />
            Quản Lý &amp; Phát Hiện Lead Trùng Lặp
          </div>
          <div className={styles.subTitle}>
            Tự động rà soát trùng lặp theo Email, Số điện thoại và Tên công ty để ngăn ngừa tình trạng hai nhân viên cùng tiếp cận một khách hàng.
          </div>
        </div>

        <div>
          <Badge tone={duplicatePairs.length > 0 ? 'warning' : 'success'}>
            {duplicatePairs.length > 0
              ? `Phát hiện ${duplicatePairs.length} cặp trùng lặp`
              : 'Dữ liệu sạch — Không có trùng lặp'}
          </Badge>
        </div>
      </div>

      {duplicatePairs.length > 0 && (
        <div className={styles.summaryAlert}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} />
            <span>
              Hệ thống tìm thấy <strong>{duplicatePairs.length}</strong> trường hợp có thông tin liên hệ tương đồng. Vui lòng kiểm tra và tiến hành gộp bản ghi để bảo toàn trọn vẹn lịch sử.
            </span>
          </div>
        </div>
      )}

      {duplicatePairs.length === 0 ? (
        <div className={styles.emptyBox}>
          <CheckCircle2 size={36} color="#16A34A" />
          <strong style={{ fontSize: '1rem', color: 'var(--color-text-main)' }}>
            Toàn bộ danh sách Lead đã được làm sạch hoàn hảo
          </strong>
          <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', maxWidth: '460px' }}>
            Không tìm thấy bản ghi nào trùng lặp số điện thoại, email hoặc tên công ty. Cơ chế cảnh báo realtime sẽ tự động kích hoạt khi có lead mới được nhập vào.
          </span>
        </div>
      ) : (
        <div className={styles.pairsList}>
          {duplicatePairs.map((pair, idx) => (
            <div key={`${pair.leadA.id}-${pair.leadB.id}-${idx}`} className={styles.pairCard}>
              {/* Lead A */}
              <div className={styles.leadBlock}>
                <div className={styles.leadName}>{pair.leadA.fullName}</div>
                <div className={styles.leadCompany}>{pair.leadA.company || 'Doanh nghiệp chưa phân loại'}</div>
                <div className={styles.leadContact}>
                  <span>✉ {pair.leadA.email}</span>
                  <span>✆ {pair.leadA.phone}</span>
                </div>
                <div style={{ marginTop: '4px' }}>
                  <Badge tone="neutral">Nguồn: {pair.leadA.leadSource}</Badge>
                </div>
              </div>

              {/* Match tag */}
              <div className={styles.matchBadgeCol}>
                <span className={styles.matchTag}>
                  {pair.matchDetail}
                </span>
                <ArrowRight size={16} color="var(--color-text-muted)" />
              </div>

              {/* Lead B */}
              <div className={styles.leadBlock}>
                <div className={styles.leadName}>{pair.leadB.fullName}</div>
                <div className={styles.leadCompany}>{pair.leadB.company || 'Doanh nghiệp chưa phân loại'}</div>
                <div className={styles.leadContact}>
                  <span>✉ {pair.leadB.email}</span>
                  <span>✆ {pair.leadB.phone}</span>
                </div>
                <div style={{ marginTop: '4px' }}>
                  <Badge tone="neutral">Nguồn: {pair.leadB.leadSource}</Badge>
                </div>
              </div>

              {/* Action */}
              <div>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  leftIcon={<GitMerge size={14} />}
                  onClick={() => setActivePairToMerge(pair)}
                >
                  Gộp 2 Bản Ghi
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Merge Modal */}
      {activePairToMerge && (
        <LeadMergeModal
          isOpen={activePairToMerge !== null}
          onClose={() => setActivePairToMerge(null)}
          pair={activePairToMerge}
          onConfirmMerge={(dto) => mergeLeads(dto)}
        />
      )}
    </div>
  );
};
