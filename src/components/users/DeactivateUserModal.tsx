import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Check,
  CheckCircle2,
  ChevronDown,
  Lock,
  ShieldOff,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { Avatar, Badge, Button } from '../common';
import type {
  DeactivateUserRequestDTO,
  IDeactivateUserModalProps,
  IManagedUser,
} from '../../interfaces';
import { formatCompactCurrency } from '../../utils/formatters';
import styles from './DeactivateUserModal.module.css';

const QUICK_REASONS: ReadonlyArray<string> = [
  'Nhân sự nghỉ việc / Chấm dứt hợp đồng lao động',
  'Luân chuyển sang bộ phận khác trong tập đoàn',
  'Tạm khóa khẩn cấp để kiểm toán bảo mật phiên',
  'Tái cơ cấu nhánh Nhóm Kinh doanh (Sales Team)',
];

export const DeactivateUserModal: React.FC<IDeactivateUserModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  activeUsers,
  userCustomers,
  userDeals,
  onConfirmDeactivate,
}) => {
  const [selectedNewOwnerId, setSelectedNewOwnerId] = useState<string>('');
  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);
  const [reason, setReason] = useState<string>(QUICK_REASONS[0]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const eligibleActiveOwners = useMemo<ReadonlyArray<IManagedUser>>(() => {
    if (!targetUser) return [];
    return activeUsers.filter(
      (candidate) => candidate.status === 'Active' && candidate.id !== targetUser.id
    );
  }, [activeUsers, targetUser]);

  const selectedNewOwner = useMemo<IManagedUser | undefined>(() => {
    return eligibleActiveOwners.find((u) => u.id === selectedNewOwnerId);
  }, [eligibleActiveOwners, selectedNewOwnerId]);

  const totalDealsValue = useMemo<number>(() => {
    return userDeals.reduce((sum, deal) => sum + deal.value, 0);
  }, [userDeals]);

  useEffect(() => {
    if (isOpen) {
      setSelectedNewOwnerId('');
      setIsPickerOpen(false);
      setReason(QUICK_REASONS[0]);
      setValidationError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, targetUser?.id]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, isSubmitting, onClose]);

  const handleChooseOwner = (ownerId: string): void => {
    setSelectedNewOwnerId(ownerId);
    setIsPickerOpen(false);
    if (ownerId) {
      setValidationError(null);
    }
  };

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    handleChooseOwner(event.target.value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!targetUser || isSubmitting) return;

    if (!selectedNewOwnerId.trim()) {
      setIsPickerOpen(true);
      setValidationError(
        'Bắt buộc chọn người tiếp nhận từ danh sách nhân sự đang hoạt động trước khi khóa tài khoản.'
      );
      return;
    }

    setValidationError(null);
    setIsSubmitting(true);

    const requestDto: DeactivateUserRequestDTO = {
      targetUserId: targetUser.id,
      newOwnerUserId: selectedNewOwnerId,
      reason: reason.trim() || QUICK_REASONS[0],
      revokeActiveSessions: true,
    };

    try {
      await onConfirmDeactivate(requestDto);
      onClose();
    } catch {
      setValidationError('Không thể hoàn tất bàn giao dữ liệu. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && targetUser && (
        <div
          className={styles.deactivateModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="deactivate-user-modal-title"
        >
          <motion.div
            className={styles.deactivateModal__backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!isSubmitting) onClose();
            }}
          />

          <motion.section
            className={styles.deactivateModal__dialog}
            initial={{ opacity: 0, scale: 0.96, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <header className={styles.deactivateModal__header}>
              <div className={styles.deactivateModal__headerTitleWrap}>
                <div className={styles.deactivateModal__dangerIcon} aria-hidden="true">
                  <Lock size={20} />
                </div>
                <div>
                  <h2 id="deactivate-user-modal-title" className={styles.deactivateModal__title}>
                    Khóa tài khoản &amp; Bàn giao Chủ sở hữu
                  </h2>
                  <p className={styles.deactivateModal__subtitle}>
                    Thu hồi toàn bộ phiên đăng nhập đang mở và chuyển giao khách hàng, cơ hội sang
                    nhân sự tiếp nhận.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className={styles.deactivateModal__closeBtn}
                onClick={onClose}
                disabled={isSubmitting}
                aria-label="Đóng hộp thoại khóa tài khoản"
              >
                <X size={18} />
              </button>
            </header>

            <form onSubmit={(e) => void handleSubmit(e)}>
              <div className={styles.deactivateModal__body}>
                {/* Security Warning Banner */}
                <div className={styles.deactivateModal__alertBanner} role="alert">
                  <AlertTriangle size={18} className={styles.deactivateModal__alertIcon} />
                  <div>
                    <strong>Chính sách bảo toàn dữ liệu &amp; thu hồi phiên:</strong> Tài khoản bị
                    khóa sẽ <strong>không thể đăng nhập</strong> và bị{' '}
                    <strong>thu hồi ngay lập tức {targetUser.activeSessions} phiên đang mở</strong>.
                    Hệ thống bắt buộc chỉ định người tiếp nhận mới để không có khách hàng hay cơ hội
                    nào bị mất chủ sở hữu.
                  </div>
                </div>

                {/* Target User Info Card */}
                <article className={styles.deactivateModal__targetCard}>
                  <div className={styles.deactivateModal__targetUser}>
                    <Avatar src={targetUser.avatarUrl} name={targetUser.fullName} size="md" />
                    <div>
                      <div className={styles.deactivateModal__targetName}>
                        <span>{targetUser.fullName}</span>
                        <Badge tone="primary" size="sm">
                          {targetUser.role}
                        </Badge>
                      </div>
                      <p className={styles.deactivateModal__targetMeta}>
                        {targetUser.email} · {targetUser.title}
                      </p>
                      <p className={styles.deactivateModal__targetTeam}>
                        Nhóm kinh doanh: {targetUser.salesTeamName}
                      </p>
                    </div>
                  </div>

                  <span className={styles.deactivateModal__sessionBadge}>
                    <ShieldOff size={14} />
                    Thu hồi {targetUser.activeSessions} phiên đang mở
                  </span>
                </article>

                {/* Data Impact Summary (Customers & Opportunities to Handover) */}
                <section aria-label="Phạm vi dữ liệu bàn giao">
                  <div className={styles.deactivateModal__impactGrid}>
                    <div className={styles.deactivateModal__impactBox}>
                      <span className={styles.deactivateModal__impactLabel}>
                        <Users size={13} /> Khách hàng bàn giao
                      </span>
                      <strong className={styles.deactivateModal__impactValue}>
                        {userCustomers.length} hồ sơ
                      </strong>
                      <span className={styles.deactivateModal__impactSub}>
                        Chuyển 100% quyền sở hữu
                      </span>
                    </div>

                    <div className={styles.deactivateModal__impactBox}>
                      <span className={styles.deactivateModal__impactLabel}>
                        <Briefcase size={13} /> Cơ hội (Deals) bàn giao
                      </span>
                      <strong className={styles.deactivateModal__impactValue}>
                        {userDeals.length} cơ hội
                      </strong>
                      <span className={styles.deactivateModal__impactSub}>
                        Giữ nguyên giai đoạn Pipeline
                      </span>
                    </div>

                    <div className={styles.deactivateModal__impactBox}>
                      <span className={styles.deactivateModal__impactLabel}>
                        Tổng giá trị Pipeline ARR
                      </span>
                      <strong className={styles.deactivateModal__impactValue}>
                        {formatCompactCurrency(totalDealsValue)}
                      </strong>
                      <span className={styles.deactivateModal__impactSub}>
                        Không thất thoát doanh thu
                      </span>
                    </div>
                  </div>

                  {(userCustomers.length > 0 || userDeals.length > 0) && (
                    <div className={styles.deactivateModal__previewList}>
                      {userCustomers.slice(0, 4).map((cust) => (
                        <span key={cust.id} className={styles.deactivateModal__previewChip}>
                          🏢 {cust.company}
                        </span>
                      ))}
                      {userDeals.slice(0, 2).map((deal) => (
                        <span key={deal.id} className={styles.deactivateModal__previewChip}>
                          💼 {deal.title}
                        </span>
                      ))}
                      {userCustomers.length > 4 && (
                        <span className={styles.deactivateModal__previewChip}>
                          +{userCustomers.length - 4} khách hàng khác
                        </span>
                      )}
                    </div>
                  )}
                </section>

                {/* Mandatory Select New Owner from Active Users */}
                <fieldset className={styles.deactivateModal__formGroup} disabled={isSubmitting}>
                  <label
                    htmlFor="new-owner-select"
                    className={styles.deactivateModal__label}
                  >
                    <span>
                      Chọn người tiếp nhận bàn giao (New Owner)
                      <span className={styles.deactivateModal__required}>*</span>
                    </span>
                    <Badge tone="success" size="sm">
                      {eligibleActiveOwners.length} nhân sự đang hoạt động
                    </Badge>
                  </label>

                  {/* Accessible synchronized native select */}
                  <select
                    id="new-owner-select"
                    name="newOwnerUserId"
                    value={selectedNewOwnerId}
                    onChange={handleSelectChange}
                    disabled={isSubmitting}
                    aria-required="true"
                    aria-invalid={Boolean(validationError)}
                    className={styles.deactivateModal__srOnlySelect}
                  >
                    <option value="">Chọn nhân sự tiếp nhận</option>
                    {eligibleActiveOwners.map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>
                        {candidate.fullName} ({candidate.email})
                      </option>
                    ))}
                  </select>

                  {/* Modern Rich Interactive Selector */}
                  <div className={styles.deactivateModal__customPicker}>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setIsPickerOpen((prev) => !prev)}
                      className={`${styles.deactivateModal__pickerTrigger} ${
                        isPickerOpen ? styles['deactivateModal__pickerTrigger--open'] : ''
                      } ${
                        validationError ? styles['deactivateModal__pickerTrigger--error'] : ''
                      }`}
                      aria-expanded={isPickerOpen}
                    >
                      {selectedNewOwner ? (
                        <div className={styles.deactivateModal__pickerSelected}>
                          <Avatar
                            src={selectedNewOwner.avatarUrl}
                            name={selectedNewOwner.fullName}
                            size="sm"
                            status="online"
                          />
                          <div className={styles.deactivateModal__pickerSelectedInfo}>
                            <div className={styles.deactivateModal__pickerSelectedName}>
                              <span>{selectedNewOwner.fullName}</span>
                              <Badge tone="primary" size="sm">
                                {selectedNewOwner.role}
                              </Badge>
                            </div>
                            <p className={styles.deactivateModal__pickerSelectedSub}>
                              {selectedNewOwner.email} · {selectedNewOwner.salesTeamName}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className={styles.deactivateModal__pickerPlaceholder}>
                          <span className={styles.deactivateModal__pickerPlaceholderIcon}>
                            <UserCheck size={17} />
                          </span>
                          <span>
                            Nhấn để chọn nhân sự đang hoạt động (Active User) tiếp nhận bàn giao...
                          </span>
                        </div>
                      )}

                      <ChevronDown
                        size={18}
                        className={`${styles.deactivateModal__pickerChevron} ${
                          isPickerOpen ? styles['deactivateModal__pickerChevron--open'] : ''
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {isPickerOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.14 }}
                          className={styles.deactivateModal__dropdownMenu}
                          role="listbox"
                          aria-label="Danh sách nhân sự đang hoạt động"
                        >
                          {eligibleActiveOwners.map((candidate) => {
                            const isSelected = candidate.id === selectedNewOwnerId;
                            return (
                              <button
                                key={candidate.id}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => handleChooseOwner(candidate.id)}
                                className={`${styles.deactivateModal__optionCard} ${
                                  isSelected
                                    ? styles['deactivateModal__optionCard--selected']
                                    : ''
                                }`}
                              >
                                <div className={styles.deactivateModal__optionLeft}>
                                  <Avatar
                                    src={candidate.avatarUrl}
                                    name={candidate.fullName}
                                    size="sm"
                                    status="online"
                                  />
                                  <div>
                                    <div className={styles.deactivateModal__optionName}>
                                      <span>{candidate.fullName}</span>
                                      <Badge tone="primary" size="sm">
                                        {candidate.role}
                                      </Badge>
                                    </div>
                                    <p className={styles.deactivateModal__optionMeta}>
                                      {candidate.email} · {candidate.salesTeamName}
                                    </p>
                                  </div>
                                </div>

                                <div className={styles.deactivateModal__optionRight}>
                                  <span className={styles.deactivateModal__optionCountPill}>
                                    🏢 {candidate.customersCount} KH · 💼 {candidate.dealsCount}{' '}
                                    Deals
                                  </span>
                                  {isSelected && (
                                    <span className={styles.deactivateModal__optionCheck}>
                                      <Check size={13} />
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {validationError && (
                    <p className={styles.deactivateModal__errorText} role="alert">
                      <AlertTriangle size={14} />
                      <span>{validationError}</span>
                    </p>
                  )}
                </fieldset>

                {/* Visual Preview of Selected New Owner */}
                {selectedNewOwner && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={styles.deactivateModal__handoverPreview}
                  >
                    <div className={styles.deactivateModal__handoverOwner}>
                      <Avatar
                        src={selectedNewOwner.avatarUrl}
                        name={selectedNewOwner.fullName}
                        size="sm"
                        status="online"
                      />
                      <div>
                        <p className={styles.deactivateModal__handoverOwnerName}>
                          Bàn giao sang: {selectedNewOwner.fullName} ({selectedNewOwner.role})
                        </p>
                        <p className={styles.deactivateModal__handoverOwnerSub}>
                          {selectedNewOwner.salesTeamName} · {selectedNewOwner.email}
                        </p>
                      </div>
                    </div>

                    <div className={styles.deactivateModal__handoverStats}>
                      <span>
                        {selectedNewOwner.customersCount} KH <ArrowRight size={12} />{' '}
                        {selectedNewOwner.customersCount + userCustomers.length} KH
                      </span>
                      <span>·</span>
                      <span>
                        {selectedNewOwner.dealsCount} Deals <ArrowRight size={12} />{' '}
                        {selectedNewOwner.dealsCount + userDeals.length} Deals
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Reason / Audit Log Note */}
                <fieldset className={styles.deactivateModal__formGroup} disabled={isSubmitting}>
                  <label
                    htmlFor="deactivation-reason-input"
                    className={styles.deactivateModal__label}
                  >
                    <span>Lý do khóa &amp; ghi chú Nhật ký Bàn giao</span>
                  </label>

                  <div className={styles.deactivateModal__reasonChips}>
                    {QUICK_REASONS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => setReason(preset)}
                        className={`${styles.deactivateModal__reasonChip} ${
                          reason === preset ? styles['deactivateModal__reasonChip--active'] : ''
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  <textarea
                    id="deactivation-reason-input"
                    className={styles.deactivateModal__textarea}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    disabled={isSubmitting}
                    placeholder="Nhập lý do khóa tài khoản và ghi chú bàn giao dữ liệu..."
                  />
                </fieldset>

                {/* Acceptance Criteria Verification Checklist */}
                <div className={styles.deactivateModal__checklist}>
                  <div className={styles.deactivateModal__checkItem}>
                    <CheckCircle2 size={14} className={styles.deactivateModal__checkIcon} />
                    <span>
                      Tài khoản <strong>{targetUser.email}</strong> bị khóa đăng nhập &amp; thu hồi
                      ngay {targetUser.activeSessions} phiên đang mở.
                    </span>
                  </div>
                  <div className={styles.deactivateModal__checkItem}>
                    <CheckCircle2 size={14} className={styles.deactivateModal__checkIcon} />
                    <span>
                      Bàn giao toàn bộ <strong>{userCustomers.length} khách hàng</strong> và{' '}
                      <strong>{userDeals.length} cơ hội</strong> sang chủ sở hữu mới.
                    </span>
                  </div>
                  <div className={styles.deactivateModal__checkItem}>
                    <CheckCircle2 size={14} className={styles.deactivateModal__checkIcon} />
                    <span>
                      Ghi nhận tự động vào <strong>Nhật ký Bàn giao &amp; Kiểm toán</strong>, đảm
                      bảo 100% dữ liệu không mất chủ sở hữu.
                    </span>
                  </div>
                </div>
              </div>

              <footer className={styles.deactivateModal__footer}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  isLoading={isSubmitting}
                  leftIcon={<UserCheck size={16} />}
                >
                  {isSubmitting
                    ? 'Đang khóa & bàn giao dữ liệu...'
                    : 'Xác nhận Khóa & Bàn giao Chủ sở hữu'}
                </Button>
              </footer>
            </form>
          </motion.section>
        </div>
      )}
    </AnimatePresence>
  );
};
