import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Eye,
  GitBranch,
  History,
  Lock,
  Shield,
  ShieldAlert,
  Unlock,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { Avatar, Badge, Button, Card } from '../common';
import { useUserManagement } from '../../hooks/useUserManagement';
import type {
  DeactivateUserRequestDTO,
  IManagedUser,
  SystemRoleType,
  UserAccountStatusType,
} from '../../interfaces';
import { ROLE_DATA_SCOPE_MAP } from '../../mock/userManagement.mock';
import { formatCompactCurrency } from '../../utils/formatters';
import { showGlobalToast } from '../../context/ToastContext';
import { DeactivateUserModal } from './DeactivateUserModal';
import styles from './UserManagementPanel.module.css';

interface IRoleOptionMeta {
  role: SystemRoleType;
  dotColor: string;
  summary: string;
}

const ROLE_OPTIONS: ReadonlyArray<IRoleOptionMeta> = [
  {
    role: 'Super Admin',
    dotColor: '#2563EB',
    summary: 'Toàn quyền quản trị hệ thống & xem 100% cây tổ chức',
  },
  {
    role: 'VP of Sales',
    dotColor: '#8B5CF6',
    summary: 'Giám sát toàn bộ Khối Kinh doanh & phê duyệt chiết khấu lớn',
  },
  {
    role: 'Sales Manager',
    dotColor: '#10B981',
    summary: 'Quản lý dữ liệu nhánh Nhóm Kinh doanh phụ trách & cấp dưới',
  },
  {
    role: 'Account Executive',
    dotColor: '#F59E0B',
    summary: 'Truy cập Khách hàng & Cơ hội do cá nhân trực tiếp sở hữu',
  },
  {
    role: 'RevOps Lead',
    dotColor: '#0EA5E9',
    summary: 'Quản trị Phễu doanh thu, Quota & Nhật ký kiểm toán hệ thống',
  },
];

export const UserManagementPanel: React.FC = () => {
  const {
    users,
    activeUsers,
    deactivatedUsers,
    salesTeams,
    handoverLogs,
    getCustomersForUser,
    getDealsForUser,
    deactivateAndHandoverUser,
    updateUserRoleAndTeam,
    addManagedUser,
    reactivateUser,
  } = useUserManagement();

  const [statusFilter, setStatusFilter] = useState<'ALL' | UserAccountStatusType>('ALL');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [modalTargetUser, setModalTargetUser] = useState<IManagedUser | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Custom dropdown menu states per user card
  const [openRoleDropdownUserId, setOpenRoleDropdownUserId] = useState<string | null>(null);
  const [openTeamDropdownUserId, setOpenTeamDropdownUserId] = useState<string | null>(null);
  const [expandedPortfolioUserId, setExpandedPortfolioUserId] = useState<string | null>(null);

  // Add new user form state
  const [isAddUserOpen, setIsAddUserOpen] = useState<boolean>(false);
  const [newUserName, setNewUserName] = useState<string>('');
  const [newUserEmail, setNewUserEmail] = useState<string>('');
  const [newUserTitle, setNewUserTitle] = useState<string>('Chuyên viên Kinh doanh');
  const [newUserRole, setNewUserRole] = useState<SystemRoleType>('Account Executive');
  const [newUserTeamId, setNewUserTeamId] = useState<string>(
    salesTeams[1]?.id ?? 'team-ent-global'
  );
  const [addUserError, setAddUserError] = useState<string | null>(null);

  const auditSectionRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (!containerRef.current) return;
      const target = event.target as HTMLElement | null;
      if (target && !target.closest('[data-custom-dropdown="true"]')) {
        setOpenRoleDropdownUserId(null);
        setOpenTeamDropdownUserId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredUsers = useMemo<IManagedUser[]>(() => {
    return users.filter((u) => {
      if (statusFilter !== 'ALL' && u.status !== statusFilter) return false;
      if (selectedTeamId !== 'ALL' && u.salesTeamId !== selectedTeamId) return false;

      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        u.salesTeamName.toLowerCase().includes(q)
      );
    });
  }, [users, statusFilter, selectedTeamId, searchQuery]);

  const totalHandedOverRecords = useMemo<number>(() => {
    return handoverLogs.reduce(
      (sum, item) => sum + item.transferredCustomersCount + item.transferredDealsCount,
      0
    );
  }, [handoverLogs]);

  const showToast = (message: string): void => {
    setFeedbackToast(message);
    showGlobalToast(message, 'success');
    window.setTimeout(() => {
      setFeedbackToast((prev) => (prev === message ? null : prev));
    }, 5000);
  };

  const handleConfirmDeactivate = async (dto: DeactivateUserRequestDTO): Promise<void> => {
    const result = await deactivateAndHandoverUser(dto);
    showToast(
      `Đã khóa tài khoản ${result.deactivatedUser.fullName}, thu hồi ${result.auditLog.revokedSessionsCount} phiên đang mở và bàn giao ${result.auditLog.transferredCustomersCount} khách hàng + ${result.auditLog.transferredDealsCount} cơ hội sang ${result.newOwnerUser.fullName}.`
    );
  };

  const handleSelectRole = (user: IManagedUser, nextRole: SystemRoleType): void => {
    setOpenRoleDropdownUserId(null);
    if (user.role === nextRole) return;
    updateUserRoleAndTeam({
      userId: user.id,
      role: nextRole,
      salesTeamId: user.salesTeamId,
    });
    showToast(
      `Đã gán vai trò "${nextRole}" cho ${user.fullName} (${ROLE_DATA_SCOPE_MAP[nextRole].label}).`
    );
  };

  const handleSelectTeam = (user: IManagedUser, nextTeamId: string): void => {
    setOpenTeamDropdownUserId(null);
    if (user.salesTeamId === nextTeamId) return;
    updateUserRoleAndTeam({
      userId: user.id,
      role: user.role,
      salesTeamId: nextTeamId,
    });
    const teamName = salesTeams.find((t) => t.id === nextTeamId)?.name ?? user.salesTeamName;
    showToast(`Đã chuyển ${user.fullName} vào nhóm "${teamName}".`);
  };

  const handleCreateNewUser = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setAddUserError(null);

    if (newUserName.trim().length < 2) {
      setAddUserError('Vui lòng nhập họ và tên nhân sự (tối thiểu 2 ký tự).');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUserEmail.trim())) {
      setAddUserError('Vui lòng nhập địa chỉ email công việc hợp lệ.');
      return;
    }
    if (users.some((u) => u.email.toLowerCase() === newUserEmail.trim().toLowerCase())) {
      setAddUserError('Email này đã tồn tại trong danh sách nhân sự.');
      return;
    }

    const created = addManagedUser({
      fullName: newUserName,
      email: newUserEmail,
      title: newUserTitle,
      role: newUserRole,
      salesTeamId: newUserTeamId,
    });

    setNewUserName('');
    setNewUserEmail('');
    setNewUserTitle('Chuyên viên Kinh doanh');
    setIsAddUserOpen(false);
    showToast(
      `Đã thêm nhân sự "${created.fullName}" vào nhóm "${created.salesTeamName}" với vai trò ${created.role}.`
    );
  };

  const targetUserCustomers = useMemo(() => {
    if (!modalTargetUser) return [];
    return getCustomersForUser(modalTargetUser);
  }, [getCustomersForUser, modalTargetUser]);

  const targetUserDeals = useMemo(() => {
    if (!modalTargetUser) return [];
    return getDealsForUser(modalTargetUser);
  }, [getDealsForUser, modalTargetUser]);

  const getRoleDotColor = (role: SystemRoleType): string => {
    return ROLE_OPTIONS.find((r) => r.role === role)?.dotColor ?? '#2563EB';
  };

  return (
    <section
      ref={containerRef}
      className={styles.userManage}
      aria-label="Quản trị người dùng, cây tổ chức và bàn giao"
    >
      {/* Top Banner */}
      <header className={styles.userManage__banner}>
        <div>
          <Badge tone="primary" dot>
            QUẢN TRỊ HỆ THỐNG · PHÂN QUYỀN TỔ CHỨC &amp; BÀN GIAO DỮ LIỆU
          </Badge>
          <h2 className={styles.userManage__bannerTitle}>
            Quản trị Vai trò, Nhóm Kinh doanh &amp; Bảo toàn Chủ sở hữu
          </h2>
          <p className={styles.userManage__bannerDesc}>
            Gán vai trò và gắn người dùng vào cây tổ chức kinh doanh để quyết định đúng phạm vi dữ
            liệu mỗi người nhìn thấy. Khi khóa tài khoản, hệ thống tự động thu hồi phiên đang mở và
            bắt buộc bàn giao toàn bộ khách hàng &amp; cơ hội sang nhân sự đang hoạt động.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="sm"
          leftIcon={<UserPlus size={15} />}
          onClick={() => setIsAddUserOpen((prev) => !prev)}
        >
          {isAddUserOpen ? 'Đóng biểu mẫu thêm' : 'Thêm nhân sự vào nhóm'}
        </Button>
      </header>

      {/* Add New User Form */}
      {isAddUserOpen && (
        <form className={styles.userManage__addForm} onSubmit={handleCreateNewUser}>
          <div className={styles.userManage__addFormHeader}>
            <h3 className={styles.userManage__sectionTitle}>
              <UserPlus size={17} />
              Thêm nhân sự mới &amp; Gắn vào Nhóm Kinh doanh
            </h3>
            <button
              type="button"
              onClick={() => setIsAddUserOpen(false)}
              style={{ color: 'var(--color-text-muted)' }}
              aria-label="Đóng"
            >
              <X size={17} />
            </button>
          </div>

          <div className={styles.userManage__addFormGrid}>
            <div className={styles.userManage__addField}>
              <label className={styles.userManage__addLabel} htmlFor="add-user-name">
                Họ và tên nhân sự *
              </label>
              <input
                id="add-user-name"
                type="text"
                className={styles.userManage__addInput}
                placeholder="VD: Nguyễn Minh Quân"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
              />
            </div>

            <div className={styles.userManage__addField}>
              <label className={styles.userManage__addLabel} htmlFor="add-user-email">
                Email công việc *
              </label>
              <input
                id="add-user-email"
                type="email"
                className={styles.userManage__addInput}
                placeholder="quan.nguyen@nexuscrm.vn"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
              />
            </div>

            <div className={styles.userManage__addField}>
              <label className={styles.userManage__addLabel} htmlFor="add-user-title">
                Chức danh
              </label>
              <input
                id="add-user-title"
                type="text"
                className={styles.userManage__addInput}
                placeholder="Chuyên viên Kinh doanh"
                value={newUserTitle}
                onChange={(e) => setNewUserTitle(e.target.value)}
              />
            </div>

            <div className={styles.userManage__addField}>
              <label className={styles.userManage__addLabel} htmlFor="add-user-role">
                Vai trò hệ thống (Role)
              </label>
              <select
                id="add-user-role"
                className={styles.userManage__addInput}
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as SystemRoleType)}
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.role} value={opt.role}>
                    {opt.role}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.userManage__addField}>
              <label className={styles.userManage__addLabel} htmlFor="add-user-team">
                Nhóm Kinh doanh (Sales Team)
              </label>
              <select
                id="add-user-team"
                className={styles.userManage__addInput}
                value={newUserTeamId}
                onChange={(e) => setNewUserTeamId(e.target.value)}
              >
                {salesTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.userManage__addField}>
              <span className={styles.userManage__addLabel}>Phạm vi dữ liệu tự động</span>
              <div className={styles.userManage__scopeCard}>
                <Eye size={14} className={styles.userManage__scopeIcon} />
                <span>{ROLE_DATA_SCOPE_MAP[newUserRole].label}</span>
              </div>
            </div>
          </div>

          {addUserError && (
            <p style={{ color: '#dc2626', fontSize: '0.8rem', fontWeight: 600 }}>{addUserError}</p>
          )}

          <div className={styles.userManage__addFormFooter}>
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsAddUserOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm" leftIcon={<Check size={15} />}>
              Lưu &amp; Gắn vào Cây tổ chức
            </Button>
          </div>
        </form>
      )}

      {/* Live Feedback Toast */}
      {feedbackToast && (
        <div className={styles.userManage__toast} role="status">
          <div className={styles.userManage__toastContent}>
            <CheckCircle2 size={18} className={styles.userManage__toastIcon} />
            <span>{feedbackToast}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setFeedbackToast(null)}>
            Đóng
          </Button>
        </div>
      )}

      {/* 4 Interactive KPI Summary Cards */}
      <div className={styles.userManage__statsGrid}>
        <button
          type="button"
          onClick={() => {
            setStatusFilter('ALL');
            setSelectedTeamId('ALL');
          }}
          className={`${styles.userManage__statCard} ${
            statusFilter === 'ALL' && selectedTeamId === 'ALL'
              ? styles['userManage__statCard--active']
              : ''
          }`}
        >
          <div className={styles.userManage__statLabel}>
            <span>Tổng nhân sự hệ thống</span>
            <Users size={15} />
          </div>
          <strong className={styles.userManage__statValue}>{users.length}</strong>
          <span className={styles.userManage__statSub}>
            Nhấn để xem toàn bộ {salesTeams.length} nhánh Nhóm Kinh doanh
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('Active')}
          className={`${styles.userManage__statCard} ${
            statusFilter === 'Active' ? styles['userManage__statCard--active'] : ''
          }`}
        >
          <div className={styles.userManage__statLabel}>
            <span>Nhân sự Đang hoạt động (Active)</span>
            <UserCheck size={15} />
          </div>
          <strong className={styles.userManage__statValue}>{activeUsers.length}</strong>
          <span className={styles.userManage__statSub}>
            Sẵn sàng nhận bàn giao Khách hàng &amp; Deals
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('Deactivated')}
          className={`${styles.userManage__statCard} ${
            statusFilter === 'Deactivated' ? styles['userManage__statCard--active'] : ''
          }`}
        >
          <div className={styles.userManage__statLabel}>
            <span>Tài khoản Đã khóa</span>
            <Lock size={15} />
          </div>
          <strong className={styles.userManage__statValue}>{deactivatedUsers.length}</strong>
          <span className={styles.userManage__statSub}>
            Đã chặn đăng nhập &amp; thu hồi 100% phiên mở
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            auditSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          className={styles.userManage__statCard}
        >
          <div className={styles.userManage__statLabel}>
            <span>Hồ sơ Đã bàn giao an toàn</span>
            <History size={15} />
          </div>
          <strong className={styles.userManage__statValue}>{totalHandedOverRecords}</strong>
          <span className={styles.userManage__statSub}>
            Nhấn để xem Nhật ký Bàn giao ({handoverLogs.length} lượt)
          </span>
        </button>
      </div>

      {/* Organization Tree & Sales Team Data Visibility Scope */}
      <Card padding="lg">
        <div className={styles.userManage__sectionHeaderRow}>
          <div>
            <h3 className={styles.userManage__sectionTitle}>
              <GitBranch size={18} />
              Cây Tổ Chức &amp; Phạm Vi Dữ Liệu Nhìn Thấy
            </h3>
            <p className={styles.userManage__sectionSub}>
              Chọn một nhánh Nhóm Kinh doanh bên dưới để lọc danh sách nhân sự theo phạm vi dữ liệu.
            </p>
          </div>
          {selectedTeamId !== 'ALL' && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setSelectedTeamId('ALL')}
            >
              Hiển thị tất cả các nhóm ({users.length})
            </Button>
          )}
        </div>

        <div className={styles.userManage__orgTreeGrid}>
          {salesTeams.map((team) => {
            const teamMemberCount = users.filter((u) => u.salesTeamId === team.id).length;
            const isSelected = selectedTeamId === team.id;

            return (
              <button
                key={team.id}
                type="button"
                onClick={() => setSelectedTeamId(isSelected ? 'ALL' : team.id)}
                className={`${styles.userManage__teamCard} ${
                  isSelected ? styles['userManage__teamCard--active'] : ''
                }`}
              >
                <div className={styles.userManage__teamHeader}>
                  <span className={styles.userManage__teamCode}>
                    Cấp {team.level} · {team.code}
                  </span>
                  <Badge
                    tone={
                      team.dataScope === 'ALL_ORG'
                        ? 'primary'
                        : team.dataScope === 'TEAM_TREE'
                        ? 'accent'
                        : 'neutral'
                    }
                    size="sm"
                  >
                    {team.dataScopeLabel}
                  </Badge>
                </div>

                <strong className={styles.userManage__teamName}>{team.name}</strong>
                <p className={styles.userManage__teamDesc}>{team.description}</p>

                <div className={styles.userManage__teamMeta}>
                  <span>Quản lý nhánh: {team.managerName}</span>
                  <span>
                    {team.parentTeamName ? `Trực thuộc: ${team.parentTeamName}` : 'Nút gốc (Root)'}{' '}
                    · <strong>{teamMemberCount} thành viên</strong>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* User List: Role Assignment, Sales Team Binding & Deactivate/Handover Action */}
      <Card padding="lg">
        <div className={styles.userManage__toolbar}>
          <div>
            <h3 className={styles.userManage__sectionTitle}>
              <Users size={18} />
              Danh sách Nhân sự, Gán Vai trò &amp; Khóa/Bàn giao
            </h3>
            <p className={styles.userManage__sectionSub}>
              Nhấn vào ô <strong>Vai trò</strong> hoặc <strong>Nhóm Kinh doanh</strong> để phân
              quyền nhanh, hoặc nhấn <strong>Khóa &amp; Bàn giao</strong> để chuyển giao chủ sở hữu.
            </p>
          </div>

          <div className={styles.userManage__filterGroup}>
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`${styles.userManage__filterBtn} ${
                statusFilter === 'ALL' ? styles['userManage__filterBtn--active'] : ''
              }`}
            >
              Tất cả ({users.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Active')}
              className={`${styles.userManage__filterBtn} ${
                statusFilter === 'Active' ? styles['userManage__filterBtn--active'] : ''
              }`}
            >
              Đang hoạt động ({activeUsers.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Deactivated')}
              className={`${styles.userManage__filterBtn} ${
                statusFilter === 'Deactivated' ? styles['userManage__filterBtn--active'] : ''
              }`}
            >
              Đã khóa ({deactivatedUsers.length})
            </button>

            <input
              type="search"
              className={styles.userManage__searchInput}
              placeholder="Tìm theo tên, email, vai trò, nhóm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Tìm kiếm người dùng"
            />
          </div>
        </div>

        <div className={styles.userManage__userList}>
          {filteredUsers.map((item) => {
            const isDeactivated = item.status === 'Deactivated';
            const isRoleOpen = openRoleDropdownUserId === item.id;
            const isTeamOpen = openTeamDropdownUserId === item.id;
            const isPortfolioExpanded = expandedPortfolioUserId === item.id;
            const ownedCustomers = getCustomersForUser(item);
            const ownedDeals = getDealsForUser(item);

            return (
              <article
                key={item.id}
                className={`${styles.userManage__userCard} ${
                  isDeactivated ? styles['userManage__userCard--deactivated'] : ''
                }`}
              >
                {/* Top Row: User Identity + Portfolio Trigger + Lock/Unlock Action */}
                <div className={styles.userManage__cardTop}>
                  <div className={styles.userManage__userIdentity}>
                    <Avatar
                      src={item.avatarUrl}
                      name={item.fullName}
                      size="md"
                      status={isDeactivated ? 'offline' : 'online'}
                    />
                    <div className={styles.userManage__userInfo}>
                      <div className={styles.userManage__userName}>
                        <span>{item.fullName}</span>
                        {isDeactivated ? (
                          <Badge tone="danger" size="sm">
                            Đã khóa · Chặn đăng nhập
                          </Badge>
                        ) : (
                          <Badge tone="success" size="sm" dot>
                            Đang hoạt động
                          </Badge>
                        )}
                      </div>
                      <p className={styles.userManage__userEmail}>
                        {item.email} · {item.title}
                      </p>
                      <p className={styles.userManage__sessionLine}>
                        {isDeactivated ? (
                          <>
                            <ShieldAlert size={13} color="#dc2626" />
                            <span>
                              Đã thu hồi toàn bộ phiên đang mở · Không thể đăng nhập
                            </span>
                          </>
                        ) : (
                          <>
                            <span>🟢 {item.activeSessions} phiên đang mở</span>
                            <span>·</span>
                            <span>Hoạt động: {item.lastActiveAt}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className={styles.userManage__cardTopRight}>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedPortfolioUserId(isPortfolioExpanded ? null : item.id)
                      }
                      className={`${styles.userManage__portfolioBtn} ${
                        isPortfolioExpanded ? styles['userManage__portfolioBtn--active'] : ''
                      }`}
                      title="Nhấn để xem danh sách Khách hàng và Cơ hội đang sở hữu"
                    >
                      <span>🏢 {item.customersCount} Khách hàng</span>
                      <span>·</span>
                      <span>💼 {item.dealsCount} Cơ hội</span>
                      <span>·</span>
                      <span>{formatCompactCurrency(item.totalPipelineArr)}</span>
                      <ChevronDown size={14} />
                    </button>

                    {isDeactivated ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        leftIcon={<Unlock size={14} />}
                        onClick={() => {
                          reactivateUser(item.id);
                          showToast(`Đã mở khóa lại tài khoản ${item.fullName}.`);
                        }}
                      >
                        Mở khóa tài khoản
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        leftIcon={<Lock size={14} />}
                        onClick={() => setModalTargetUser(item)}
                        disabled={activeUsers.length <= 1}
                      >
                        Khóa &amp; Bàn giao
                      </Button>
                    )}
                  </div>
                </div>

                {/* Handover Notice Banner when Deactivated */}
                {isDeactivated && item.handedOverToUserName && (
                  <div className={styles.userManage__handoverBanner}>
                    <span>
                      ✓ Đã bàn giao 100% khách hàng và cơ hội sang người tiếp nhận:{' '}
                      <strong>{item.handedOverToUserName}</strong>
                    </span>
                    {item.deactivationReason && <span>Lý do: {item.deactivationReason}</span>}
                  </div>
                )}

                {/* Expandable Owned Customers & Deals Drawer */}
                {isPortfolioExpanded && (
                  <div className={styles.userManage__portfolioDrawer}>
                    <div className={styles.userManage__portfolioDrawerTitle}>
                      <span>
                        Hồ sơ do {item.fullName} đang trực tiếp sở hữu ({ownedCustomers.length}{' '}
                        Khách hàng, {ownedDeals.length} Cơ hội)
                      </span>
                      <button
                        type="button"
                        onClick={() => setExpandedPortfolioUserId(null)}
                        style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}
                      >
                        Thu gọn
                      </button>
                    </div>

                    {ownedCustomers.length === 0 && ownedDeals.length === 0 ? (
                      <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                        Hiện chưa có hồ sơ khách hàng hoặc cơ hội nào thuộc sở hữu của nhân sự này.
                      </p>
                    ) : (
                      <div className={styles.userManage__portfolioChips}>
                        {ownedCustomers.map((c) => (
                          <span key={c.id} className={styles.userManage__portfolioItemChip}>
                            🏢 {c.company} ({c.fullName})
                          </span>
                        ))}
                        {ownedDeals.map((d) => (
                          <span key={d.id} className={styles.userManage__portfolioItemChip}>
                            💼 {d.title} ({formatCompactCurrency(d.value)})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom 3-Column Bar: Role Picker, Sales Team Picker & Data Scope */}
                <div className={styles.userManage__controlsGrid}>
                  {/* Box 1: Custom Role Selector */}
                  <div className={styles.userManage__controlBox} data-custom-dropdown="true">
                    <span className={styles.userManage__controlLabel}>
                      <Shield size={12} /> Vai trò hệ thống (Role)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setOpenTeamDropdownUserId(null);
                        setOpenRoleDropdownUserId(isRoleOpen ? null : item.id);
                      }}
                      className={`${styles.userManage__customSelectBtn} ${
                        isRoleOpen ? styles['userManage__customSelectBtn--open'] : ''
                      }`}
                    >
                      <span className={styles.userManage__customSelectMain}>
                        <span
                          className={styles.userManage__customSelectDot}
                          style={{ backgroundColor: getRoleDotColor(item.role) }}
                        />
                        <span className={styles.userManage__customSelectText}>{item.role}</span>
                      </span>
                      <ChevronDown size={15} color="var(--color-text-muted)" />
                    </button>

                    {isRoleOpen && (
                      <div className={styles.userManage__popoverMenu} role="listbox">
                        {ROLE_OPTIONS.map((opt) => {
                          const isSelected = item.role === opt.role;
                          return (
                            <button
                              key={opt.role}
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              onClick={() => handleSelectRole(item, opt.role)}
                              className={`${styles.userManage__popoverOption} ${
                                isSelected ? styles['userManage__popoverOption--selected'] : ''
                              }`}
                            >
                              <div>
                                <div className={styles.userManage__popoverOptionTitle}>
                                  <span
                                    className={styles.userManage__customSelectDot}
                                    style={{ backgroundColor: opt.dotColor }}
                                  />
                                  <span>{opt.role}</span>
                                </div>
                                <p className={styles.userManage__popoverOptionSub}>{opt.summary}</p>
                              </div>
                              {isSelected && <Check size={15} color="var(--color-primary)" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Box 2: Custom Sales Team Selector */}
                  <div className={styles.userManage__controlBox} data-custom-dropdown="true">
                    <span className={styles.userManage__controlLabel}>
                      <GitBranch size={12} /> Nhóm Kinh doanh (Sales Team)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setOpenRoleDropdownUserId(null);
                        setOpenTeamDropdownUserId(isTeamOpen ? null : item.id);
                      }}
                      className={`${styles.userManage__customSelectBtn} ${
                        isTeamOpen ? styles['userManage__customSelectBtn--open'] : ''
                      }`}
                    >
                      <span className={styles.userManage__customSelectMain}>
                        <span className={styles.userManage__customSelectText}>
                          {item.salesTeamName}
                        </span>
                      </span>
                      <ChevronDown size={15} color="var(--color-text-muted)" />
                    </button>

                    {isTeamOpen && (
                      <div className={styles.userManage__popoverMenu} role="listbox">
                        {salesTeams.map((teamOpt) => {
                          const isSelected = item.salesTeamId === teamOpt.id;
                          return (
                            <button
                              key={teamOpt.id}
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              onClick={() => handleSelectTeam(item, teamOpt.id)}
                              className={`${styles.userManage__popoverOption} ${
                                isSelected ? styles['userManage__popoverOption--selected'] : ''
                              }`}
                            >
                              <div>
                                <div className={styles.userManage__popoverOptionTitle}>
                                  <span className={styles.userManage__teamCode}>
                                    Cấp {teamOpt.level}
                                  </span>
                                  <span>{teamOpt.name}</span>
                                </div>
                                <p className={styles.userManage__popoverOptionSub}>
                                  Quản lý: {teamOpt.managerName} · {teamOpt.dataScopeLabel}
                                </p>
                              </div>
                              {isSelected && <Check size={15} color="var(--color-primary)" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Box 3: Data Visibility Scope Display */}
                  <div className={styles.userManage__controlBox}>
                    <span className={styles.userManage__controlLabel}>
                      <Eye size={12} /> Phạm vi Dữ liệu nhìn thấy
                    </span>
                    <div className={styles.userManage__scopeCard}>
                      <Eye size={15} className={styles.userManage__scopeIcon} />
                      <span>{item.dataScopeLabel}</span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </Card>

      {/* Handover & Account Lock Audit Trail */}
      <div ref={auditSectionRef}>
        <Card padding="lg">
          <div>
            <h3 className={styles.userManage__sectionTitle}>
              <History size={18} />
              Nhật ký Bàn giao Chủ sở hữu &amp; Khóa Tài khoản
            </h3>
            <p className={styles.userManage__sectionSub}>
              Ghi nhận tự động mỗi khi Quản trị viên khóa tài khoản và chuyển giao khách hàng, cơ
              hội sang chủ sở hữu mới.
            </p>
          </div>

          <div className={styles.userManage__auditList}>
            {handoverLogs.length === 0 ? (
              <div className={styles.userManage__emptyAudit}>
                Chưa có lịch sử khóa tài khoản &amp; bàn giao nào. Khi bạn nhấn{' '}
                <strong>&ldquo;Khóa &amp; Bàn giao&rdquo;</strong> trên một tài khoản nhân sự, biên
                bản bàn giao sẽ được ghi nhận tại đây.
              </div>
            ) : (
              handoverLogs.map((log) => (
                <article key={log.id} className={styles.userManage__auditItem}>
                  <div className={styles.userManage__auditHeader}>
                    <div className={styles.userManage__auditFlow}>
                      <Badge tone="danger" size="sm">
                        Đã khóa: {log.deactivatedUserName} ({log.deactivatedUserEmail})
                      </Badge>
                      <ArrowRight size={15} />
                      <Badge tone="success" size="sm">
                        Người tiếp nhận (New Owner): {log.newOwnerUserName} ({log.newOwnerUserEmail}
                        )
                      </Badge>
                    </div>

                    <time className={styles.userManage__auditTime}>
                      {new Date(log.createdAt).toLocaleString('vi-VN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </time>
                  </div>

                  <p className={styles.userManage__auditMeta}>
                    Thực hiện bởi <strong>{log.performedByName}</strong> ({log.performedByEmail}) ·
                    Đã thu hồi <strong>{log.revokedSessionsCount} phiên đang mở</strong> · Chuyển
                    giao <strong>{log.transferredCustomersCount} khách hàng</strong> &amp;{' '}
                    <strong>{log.transferredDealsCount} cơ hội</strong> (Tổng giá trị:{' '}
                    <strong>{formatCompactCurrency(log.transferredPipelineArr)}</strong>) · Lý do:{' '}
                    <em>{log.reason}</em>
                  </p>

                  {(log.transferredCustomerNames.length > 0 ||
                    log.transferredDealTitles.length > 0) && (
                    <div className={styles.userManage__auditChips}>
                      {log.transferredCustomerNames.map((companyName) => (
                        <span key={companyName} className={styles.userManage__auditChip}>
                          🏢 {companyName}
                        </span>
                      ))}
                      {log.transferredDealTitles.map((dealTitle) => (
                        <span key={dealTitle} className={styles.userManage__auditChip}>
                          💼 {dealTitle}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* DeactivateUserModal Component */}
      <DeactivateUserModal
        isOpen={Boolean(modalTargetUser)}
        onClose={() => setModalTargetUser(null)}
        targetUser={modalTargetUser}
        activeUsers={activeUsers}
        userCustomers={targetUserCustomers}
        userDeals={targetUserDeals}
        onConfirmDeactivate={handleConfirmDeactivate}
      />
    </section>
  );
};
