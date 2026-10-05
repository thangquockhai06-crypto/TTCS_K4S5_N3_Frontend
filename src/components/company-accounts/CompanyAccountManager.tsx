import React, { useState } from 'react';
import {
  Ban,
  Briefcase,
  Building,
  CheckCircle2,
  Clock,
  Download,
  LayoutGrid,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Table as TableIcon,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  CompanyScaleType,
  CompanySortFieldType,
  CompanyStatusType,
  CreateCompanyAccountDTO,
  ICompanyAccount,
  UpdateCompanyAccountDTO,
} from '../../interfaces/company-account.interface';
import { useCompanyAccounts } from '../../hooks/useCompanyAccounts';
import { Button } from '../common';
import { CompanyAccountDetailModal } from './CompanyAccountDetailModal';
import { CompanyAccountList } from './CompanyAccountList';
import { CompanyAccountModal } from './CompanyAccountModal';
import { formatCurrency } from '../../utils/formatters';
import styles from './CompanyAccountManager.module.css';

export interface ICompanyAccountManagerProps {
  hideHeader?: boolean;
}

export const CompanyAccountManager: React.FC<ICompanyAccountManagerProps> = ({
  hideHeader = false,
}) => {
  const {
    accounts,
    stats,
    isLoading,
    currentUser,
    filterState,
    setFilterState,
    availableIndustries,
    addAccount,
    updateAccount,
    deleteAccount,
    checkTaxCodeUnique,
    exportCsv,
    resetData,
  } = useCompanyAccounts();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingAccount, setEditingAccount] = useState<ICompanyAccount | null>(null);

  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [selectedAccount, setSelectedAccount] = useState<ICompanyAccount | null>(null);

  const handleOpenAdd = () => {
    setEditingAccount(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (acc: ICompanyAccount) => {
    setEditingAccount(acc);
    setIsModalOpen(true);
  };

  const handleOpenDetail = (acc: ICompanyAccount) => {
    setSelectedAccount(acc);
    setIsDetailOpen(true);
  };

  const handleModalSubmit = (
    dto: CreateCompanyAccountDTO | UpdateCompanyAccountDTO,
    ownerName: string,
    ownerEmail: string,
    ownerTeam: string
  ) => {
    if (editingAccount) {
      updateAccount(editingAccount.id, dto as UpdateCompanyAccountDTO);
    } else {
      addAccount(dto as CreateCompanyAccountDTO, ownerName, ownerEmail, ownerTeam);
    }
  };

  return (
    <section className={styles.managerContainer} aria-label="Phân hệ Quản lý Hồ sơ Khách hàng Doanh nghiệp">
      {/* Header */}
      {!hideHeader && (
        <header className={styles.headerSection}>
          <div className={styles.titleGroup}>
            <h1 className={styles.mainTitle}>
              <Building size={26} color="#2563eb" />
              Quản lý Hồ sơ Khách hàng Doanh nghiệp
            </h1>
            <p className={styles.subtitle}>
              Chuẩn hóa cơ sở dữ liệu khách hàng doanh nghiệp B2B (Tên, Mã số thuế duy nhất, Quy mô, Ngành nghề, Đại diện liên hệ) thay vì lưu trữ rời rạc trên file Excel cá nhân.
            </p>
          </div>

          <div className={styles.headerActions}>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download size={14} />}
              onClick={exportCsv}
              title="Xuất dữ liệu chuẩn định dạng CSV/Excel"
            >
              Xuất Excel chuẩn
            </Button>

            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw size={14} />}
              onClick={() => {
                if (window.confirm('Khôi phục danh sách khách hàng doanh nghiệp mẫu?')) {
                  resetData();
                }
              }}
              title="Khôi phục dữ liệu mẫu"
            >
              Đặt lại mẫu
            </Button>

            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={16} />}
              onClick={handleOpenAdd}
            >
              Thêm Khách hàng Doanh nghiệp
            </Button>
          </div>
        </header>
      )}

      {/* Scope Selector (Nhân viên thấy của mình, Trưởng nhóm thấy của nhóm, Giám đốc thấy tất cả) */}
      <div className={styles.scopeBar}>
        <div className={styles.scopeTabs} role="tablist" aria-label="Phạm vi hiển thị dữ liệu">
          <button
            type="button"
            role="tab"
            aria-selected={filterState.scope === 'my_accounts'}
            className={`${styles.scopeTabBtn} ${
              filterState.scope === 'my_accounts' ? styles['scopeTabBtn--active'] : ''
            }`}
            onClick={() => setFilterState((prev) => ({ ...prev, scope: 'my_accounts' }))}
          >
            <UserCheck size={14} /> Khách hàng của tôi ({currentUser?.fullName || 'Nhân viên'})
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={filterState.scope === 'team_accounts'}
            className={`${styles.scopeTabBtn} ${
              filterState.scope === 'team_accounts' ? styles['scopeTabBtn--active'] : ''
            }`}
            onClick={() => setFilterState((prev) => ({ ...prev, scope: 'team_accounts' }))}
          >
            <Users size={14} /> Khách hàng toàn nhóm ({currentUser?.department || 'Nhóm kinh doanh'})
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={filterState.scope === 'all_accounts'}
            className={`${styles.scopeTabBtn} ${
              filterState.scope === 'all_accounts' ? styles['scopeTabBtn--active'] : ''
            }`}
            onClick={() => setFilterState((prev) => ({ ...prev, scope: 'all_accounts' }))}
          >
            <Building size={14} /> Toàn công ty (Tất cả)
          </button>
        </div>

        <div className={styles.scopeInfo}>
          Quyền hiện tại: <strong>{currentUser?.role || 'Sales Staff'}</strong> · Đang xem:{' '}
          <strong>{accounts.length}</strong> doanh nghiệp
        </div>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiCard__header}>
            <span className={styles.kpiCard__label}>Tổng doanh nghiệp</span>
            <Building size={16} color="#64748b" />
          </div>
          <span className={styles.kpiCard__value}>{stats.totalCount}</span>
          <span className={styles.kpiCard__sub}>Hồ sơ chuẩn hóa</span>
        </div>

        <div className={styles.kpiCard} style={{ borderLeft: '4px solid #2563eb' }}>
          <div className={styles.kpiCard__header}>
            <span className={styles.kpiCard__label}>Tiềm năng</span>
            <Sparkles size={16} color="#2563eb" />
          </div>
          <span className={styles.kpiCard__value}>{stats.leadCount}</span>
          <span className={styles.kpiCard__sub}>Đang tiếp cận</span>
        </div>

        <div className={styles.kpiCard} style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className={styles.kpiCard__header}>
            <span className={styles.kpiCard__label}>Đang giao dịch</span>
            <Clock size={16} color="#f59e0b" />
          </div>
          <span className={styles.kpiCard__value}>{stats.negotiationCount}</span>
          <span className={styles.kpiCard__sub}>Đang báo giá & đàm phán</span>
        </div>

        <div className={styles.kpiCard} style={{ borderLeft: '4px solid #059669' }}>
          <div className={styles.kpiCard__header}>
            <span className={styles.kpiCard__label}>Khách hàng</span>
            <CheckCircle2 size={16} color="#059669" />
          </div>
          <span className={styles.kpiCard__value}>{stats.customerCount}</span>
          <span className={styles.kpiCard__sub}>Đang hợp tác chính thức</span>
        </div>

        <div className={styles.kpiCard} style={{ borderLeft: '4px solid #64748b' }}>
          <div className={styles.kpiCard__header}>
            <span className={styles.kpiCard__label}>Ngừng hợp tác</span>
            <Ban size={16} color="#64748b" />
          </div>
          <span className={styles.kpiCard__value}>{stats.churnedCount}</span>
          <span className={styles.kpiCard__sub}>Tạm dừng / Hủy hợp đồng</span>
        </div>

        <div className={styles.kpiCard} style={{ borderLeft: '4px solid #10b981', backgroundColor: '#f0fdf4' }}>
          <div className={styles.kpiCard__header}>
            <span className={styles.kpiCard__label} style={{ color: '#047857' }}>Tổng doanh số ARR</span>
            <Briefcase size={16} color="#047857" />
          </div>
          <span className={styles.kpiCard__value} style={{ color: '#047857' }}>
            {formatCurrency(stats.totalPipelineValue)}
          </span>
          <span className={styles.kpiCard__sub} style={{ color: '#047857' }}>Dự kiến trong năm</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbar__top}>
          {/* Search */}
          <div className={styles.searchInputWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Tìm theo tên công ty, mã số thuế, địa chỉ, người phụ trách..."
              value={filterState.searchQuery}
              onChange={(e) =>
                setFilterState((prev) => ({ ...prev, searchQuery: e.target.value }))
              }
              className={styles.searchInput}
              aria-label="Tìm kiếm doanh nghiệp"
            />
          </div>

          {/* Scale filter */}
          <div>
            <select
              value={filterState.scale}
              onChange={(e) =>
                setFilterState((prev) => ({
                  ...prev,
                  scale: e.target.value as CompanyScaleType | 'all',
                }))
              }
              className={styles.selectInput}
              aria-label="Lọc theo quy mô"
            >
              <option value="all">🏢 Tất cả Quy mô</option>
              <option value="startup">Startup (1-20)</option>
              <option value="sme">SME (21-100)</option>
              <option value="mid_market">Mid-Market (101-500)</option>
              <option value="enterprise">Enterprise (500+)</option>
            </select>
          </div>

          {/* Industry filter */}
          <div>
            <select
              value={filterState.industry}
              onChange={(e) =>
                setFilterState((prev) => ({ ...prev, industry: e.target.value }))
              }
              className={styles.selectInput}
              aria-label="Lọc theo ngành nghề"
            >
              <option value="all">🌐 Tất cả Ngành nghề</option>
              {availableIndustries.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
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
                  sortField: e.target.value as CompanySortFieldType,
                }))
              }
              className={styles.selectInput}
              aria-label="Sắp xếp theo"
            >
              <option value="createdAt">Mới tạo nhất</option>
              <option value="companyName">Tên công ty (A-Z)</option>
              <option value="dealValueEstimate">Doanh số cao nhất</option>
              <option value="taxCode">Mã số thuế</option>
              <option value="status">Trạng thái</option>
            </select>
          </div>
        </div>

        <div className={styles.toolbar__bottom}>
          {/* Filter Pills for Status */}
          <div className={styles.filterPills}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Trạng thái:</span>
            {(
              [
                { id: 'all', label: 'Tất cả' },
                { id: 'lead', label: '✨ Tiềm năng' },
                { id: 'negotiation', label: '⏳ Đang giao dịch' },
                { id: 'customer', label: '✅ Khách hàng' },
                { id: 'churned', label: '🚫 Ngừng hợp tác' },
              ] as const
            ).map((stPill) => (
              <button
                key={stPill.id}
                type="button"
                className={`${styles.filterPill} ${
                  filterState.status === stPill.id ? styles['filterPill--active'] : ''
                }`}
                onClick={() =>
                  setFilterState((prev) => ({
                    ...prev,
                    status: stPill.id as CompanyStatusType | 'all',
                  }))
                }
              >
                {stPill.label}
              </button>
            ))}
          </div>

          {/* View Toggle */}
          <div className={styles.viewToggle} role="group" aria-label="Chế độ xem danh sách">
            <button
              type="button"
              className={`${styles.viewBtn} ${
                filterState.viewMode === 'grid' ? styles['viewBtn--active'] : ''
              }`}
              onClick={() => setFilterState((prev) => ({ ...prev, viewMode: 'grid' }))}
              title="Xem dạng Lưới thẻ"
            >
              <LayoutGrid size={14} /> Lưới
            </button>

            <button
              type="button"
              className={`${styles.viewBtn} ${
                filterState.viewMode === 'table' ? styles['viewBtn--active'] : ''
              }`}
              onClick={() => setFilterState((prev) => ({ ...prev, viewMode: 'table' }))}
              title="Xem dạng Bảng biểu"
            >
              <TableIcon size={14} /> Bảng
            </button>
          </div>
        </div>
      </div>

      {/* Main Content List */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#64748b' }}>
          Đang tải dữ liệu hồ sơ doanh nghiệp...
        </div>
      ) : (
        <CompanyAccountList
          accounts={accounts}
          viewMode={filterState.viewMode}
          onEdit={handleOpenEdit}
          onDelete={deleteAccount}
          onViewDetail={handleOpenDetail}
          onAddNew={handleOpenAdd}
        />
      )}

      {/* Modals */}
      <CompanyAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        editingAccount={editingAccount}
        onCheckTaxCodeUnique={checkTaxCodeUnique}
      />

      <CompanyAccountDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        account={selectedAccount}
        onEdit={handleOpenEdit}
      />
    </section>
  );
};
