import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Crown,
  Grid,
  LayoutGrid,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Table as TableIcon,
  Users,
} from 'lucide-react';
import {
  ContactRoleType,
  ContactSortFieldType,
  CreateContactDTO,
  IContact,
  TransferContactDTO,
  UpdateContactDTO,
} from '../../interfaces/contact.interface';
import { useContacts } from '../../hooks/useContacts';
import { Button } from '../common';
import { BuyingInfluenceMatrix } from './BuyingInfluenceMatrix';
import { ContactHistoryModal } from './ContactHistoryModal';
import { ContactList } from './ContactList';
import { ContactModal } from './ContactModal';
import { TransferContactModal } from './TransferContactModal';
import styles from './ContactManager.module.css';

export interface IContactManagerProps {
  initialCustomerId?: string;
  hideHeader?: boolean;
}

export const ContactManager: React.FC<IContactManagerProps> = ({
  initialCustomerId,
  hideHeader = false,
}) => {
  const {
    contacts,
    customers,
    stats,
    isLoading,
    filterState,
    setFilterState,
    addContact,
    updateContact,
    deleteContact,
    setPrimaryContact,
    transferContact,
    resetData,
  } = useContacts(initialCustomerId);

  // Modals state
  const [isContactModalOpen, setIsContactModalOpen] = useState<boolean>(false);
  const [editingContact, setEditingContact] = useState<IContact | null>(null);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [transferringContact, setTransferringContact] = useState<IContact | null>(null);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [viewingHistoryContact, setViewingHistoryContact] = useState<IContact | null>(null);

  const handleOpenAddModal = () => {
    setEditingContact(null);
    setIsContactModalOpen(true);
  };

  const handleOpenEditModal = (contact: IContact) => {
    setEditingContact(contact);
    setIsContactModalOpen(true);
  };

  const handleOpenTransferModal = (contact: IContact) => {
    setTransferringContact(contact);
    setIsTransferModalOpen(true);
  };

  const handleOpenHistoryModal = (contact: IContact) => {
    setViewingHistoryContact(contact);
    setIsHistoryModalOpen(true);
  };

  const handleContactSubmit = (dto: CreateContactDTO | UpdateContactDTO) => {
    if (editingContact) {
      updateContact(editingContact.id, dto as UpdateContactDTO);
    } else {
      addContact(dto as CreateContactDTO);
    }
  };

  const handleTransferSubmit = (dto: TransferContactDTO) => {
    transferContact(dto);
  };

  return (
    <section className={styles.contactManager} aria-label="Phân hệ Quản lý Người liên hệ và Quyết định mua">
      {/* Header Section */}
      {!hideHeader && (
        <header className={styles.headerSection}>
          <div className={styles.headerTitleGroup}>
            <h1 className={styles.headerTitle}>
              <Users size={26} color="#2563eb" />
              Quản lý Người liên hệ & Trung tâm Quyết định Mua hàng
            </h1>
            <p className={styles.headerSubtitle}>
              Phân loại chức danh, vai trò quyền lực (Người quyết định, Người ảnh hưởng, Người dùng cuối, Người cản trở)
              và quản lý luân chuyển doanh nghiệp giữ nguyên lịch sử giao dịch.
            </p>
          </div>

          <div className={styles.headerActions}>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw size={14} />}
              onClick={() => {
                if (window.confirm('Khôi phục dữ liệu người liên hệ mẫu ban đầu?')) {
                  resetData();
                }
              }}
              title="Khôi phục dữ liệu mẫu ban đầu"
            >
              Đặt lại mẫu
            </Button>

            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={16} />}
              onClick={handleOpenAddModal}
            >
              Thêm Người liên hệ
            </Button>
          </div>
        </header>
      )}

      {/* KPI Stats Grid */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiCard__header}>
            <span className={styles.kpiCard__label}>Tổng nhân sự</span>
            <Users size={16} color="#64748b" />
          </div>
          <span className={styles.kpiCard__value}>{stats.totalContacts}</span>
          <span className={styles.kpiCard__sub}>
            ⭐ {stats.primaryContactsCount} đầu mối chính
          </span>
        </div>

        <div className={`${styles.kpiCard} ${styles['kpiCard--decisionMaker']}`}>
          <div className={styles.kpiCard__header}>
            <span className={styles.kpiCard__label}>Người quyết định</span>
            <Crown size={16} color="#9333ea" />
          </div>
          <span className={styles.kpiCard__value}>{stats.decisionMakersCount}</span>
          <span className={styles.kpiCard__sub}>Duyệt ngân sách & chốt ký</span>
        </div>

        <div className={`${styles.kpiCard} ${styles['kpiCard--influencer']}`}>
          <div className={styles.kpiCard__header}>
            <span className={styles.kpiCard__label}>Người ảnh hưởng</span>
            <Sparkles size={16} color="#2563eb" />
          </div>
          <span className={styles.kpiCard__value}>{stats.influencersCount}</span>
          <span className={styles.kpiCard__sub}>Cố vấn & đánh giá kỹ thuật</span>
        </div>

        <div className={`${styles.kpiCard} ${styles['kpiCard--endUser']}`}>
          <div className={styles.kpiCard__header}>
            <span className={styles.kpiCard__label}>Người dùng cuối</span>
            <CheckCircle2 size={16} color="#059669" />
          </div>
          <span className={styles.kpiCard__value}>{stats.endUsersCount}</span>
          <span className={styles.kpiCard__sub}>Trực tiếp sử dụng hệ thống</span>
        </div>

        <div className={`${styles.kpiCard} ${styles['kpiCard--blocker']}`}>
          <div className={styles.kpiCard__header}>
            <span className={styles.kpiCard__label} style={{ color: '#be123c' }}>
              Người cản trở (Rào cản)
            </span>
            <AlertCircle size={16} color="#e11d48" />
          </div>
          <span className={styles.kpiCard__value} style={{ color: '#be123c' }}>
            {stats.blockersCount}
          </span>
          <span className={styles.kpiCard__sub} style={{ color: '#be123c', fontWeight: 600 }}>
            ⚠️ Cần sale giải tỏa nghi ngại
          </span>
        </div>
      </div>

      {/* Interactive Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbar__topRow}>
          {/* Search bar */}
          <div className={styles.searchInputWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email, điện thoại, chức danh, công ty..."
              value={filterState.searchQuery}
              onChange={(e) =>
                setFilterState((prev) => ({ ...prev, searchQuery: e.target.value }))
              }
              className={styles.searchInput}
              aria-label="Tìm kiếm người liên hệ"
            />
          </div>

          {/* Customer filter */}
          <div>
            <select
              value={filterState.customerId}
              onChange={(e) =>
                setFilterState((prev) => ({ ...prev, customerId: e.target.value }))
              }
              className={styles.selectInput}
              aria-label="Lọc theo khách hàng"
            >
              <option value="all">🏢 Tất cả Khách hàng / Công ty</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company} ({c.fullName})
                </option>
              ))}
            </select>
          </div>

          {/* Sort field */}
          <div>
            <select
              value={filterState.sortField}
              onChange={(e) =>
                setFilterState((prev) => ({
                  ...prev,
                  sortField: e.target.value as ContactSortFieldType,
                }))
              }
              className={styles.selectInput}
              aria-label="Sắp xếp theo trường"
            >
              <option value="fullName">Sắp xếp: Tên (A-Z)</option>
              <option value="companyName">Sắp xếp: Công ty</option>
              <option value="jobTitle">Sắp xếp: Chức danh</option>
              <option value="roleInBuying">Sắp xếp: Vai trò quyết định</option>
              <option value="createdAt">Sắp xếp: Mới nhất</option>
            </select>
          </div>
        </div>

        <div className={styles.toolbar__bottomRow}>
          {/* Quick Filter Pills */}
          <div className={styles.toolbar__filterPills}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>
              Vai trò:
            </span>
            {(
              [
                { id: 'all', label: 'Tất cả vai trò' },
                { id: 'decision_maker', label: '👑 Người quyết định' },
                { id: 'influencer', label: '✨ Người ảnh hưởng' },
                { id: 'end_user', label: '👥 Người dùng cuối' },
                { id: 'blocker', label: '🚨 Người cản trở' },
              ] as const
            ).map((rolePill) => (
              <button
                key={rolePill.id}
                type="button"
                className={`${styles.filterPill} ${
                  filterState.roleInBuying === rolePill.id ? styles['filterPill--active'] : ''
                }`}
                onClick={() =>
                  setFilterState((prev) => ({
                    ...prev,
                    roleInBuying: rolePill.id as ContactRoleType | 'all',
                  }))
                }
              >
                {rolePill.label}
              </button>
            ))}

            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginLeft: '8px' }}>
              Đầu mối:
            </span>
            <button
              type="button"
              className={`${styles.filterPill} ${
                filterState.isPrimary === 'primary' ? styles['filterPill--active'] : ''
              }`}
              onClick={() =>
                setFilterState((prev) => ({
                  ...prev,
                  isPrimary: prev.isPrimary === 'primary' ? 'all' : 'primary',
                }))
              }
            >
              ⭐ Chỉ đầu mối chính
            </button>
          </div>

          {/* View Mode Switcher (Grid | Table | Matrix) */}
          <div className={styles.viewModeToggle} role="group" aria-label="Chế độ xem">
            <button
              type="button"
              className={`${styles.viewModeBtn} ${
                filterState.viewMode === 'grid' ? styles['viewModeBtn--active'] : ''
              }`}
              onClick={() => setFilterState((prev) => ({ ...prev, viewMode: 'grid' }))}
              title="Xem dạng Lưới thẻ"
            >
              <LayoutGrid size={14} /> Lưới
            </button>

            <button
              type="button"
              className={`${styles.viewModeBtn} ${
                filterState.viewMode === 'table' ? styles['viewModeBtn--active'] : ''
              }`}
              onClick={() => setFilterState((prev) => ({ ...prev, viewMode: 'table' }))}
              title="Xem dạng Bảng biểu"
            >
              <TableIcon size={14} /> Bảng
            </button>

            <button
              type="button"
              className={`${styles.viewModeBtn} ${
                filterState.viewMode === 'matrix' ? styles['viewModeBtn--active'] : ''
              }`}
              onClick={() => setFilterState((prev) => ({ ...prev, viewMode: 'matrix' }))}
              title="Xem Ma trận Trung tâm Quyết định Mua hàng (Bản đồ Quyền lực)"
            >
              <Grid size={14} /> Ma trận Quyết định
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#64748b' }}>
          Đang tải dữ liệu người liên hệ...
        </div>
      ) : filterState.viewMode === 'matrix' ? (
        <BuyingInfluenceMatrix
          contacts={contacts}
          onEdit={handleOpenEditModal}
          onTransfer={handleOpenTransferModal}
          onViewHistory={handleOpenHistoryModal}
          onSetPrimary={setPrimaryContact}
        />
      ) : (
        <ContactList
          contacts={contacts}
          viewMode={filterState.viewMode}
          onEdit={handleOpenEditModal}
          onDelete={deleteContact}
          onTransfer={handleOpenTransferModal}
          onViewHistory={handleOpenHistoryModal}
          onSetPrimary={setPrimaryContact}
          onAddNew={handleOpenAddModal}
        />
      )}

      {/* Modals */}
      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        onSubmit={handleContactSubmit}
        customers={customers}
        editingContact={editingContact}
        defaultCustomerId={
          filterState.customerId !== 'all' ? filterState.customerId : undefined
        }
      />

      <TransferContactModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        contact={transferringContact}
        customers={customers}
        onTransfer={handleTransferSubmit}
      />

      <ContactHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        contact={viewingHistoryContact}
      />
    </section>
  );
};
