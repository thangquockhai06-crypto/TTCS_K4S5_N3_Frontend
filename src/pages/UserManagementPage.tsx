import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  Clock,
  Compass,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Users,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { UserActivationModal } from '../components/users/UserActivationModal';
import { UserDetailModal } from '../components/users/UserDetailModal';
import { UserFilterBar } from '../components/users/UserFilterBar';
import { UserModal } from '../components/users/UserModal';
import { UserPagination } from '../components/users/UserPagination';
import { UserTable } from '../components/users/UserTable';
import { AssignRoleModal } from '../components/users/AssignRoleModal';
import { ExcelImportModal } from '../components/users/ExcelImportModal';
import { UserManagementPanel } from '../components/users/UserManagementPanel';
import { useAuth } from '../hooks/useAuth';
import {
  IUserCreateInput,
  IUserFilterState,
  IUserItem,
  IUserUpdateInput,
} from '../interfaces/user-management.interface';
import { userService } from '../services/userService';
import styles from './UserManagementPage.module.css';

export const UserManagementPage: React.FC = () => {
  const { user: currentAuthUser } = useAuth();
  const navigate = useNavigate();

  // Chuyển tab giữa Quản lý tài khoản (CRUD) và Bàn giao tài khoản
  const [activeTab, setActiveTab] = useState<'crud' | 'handover'>('crud');

  // Filter & Pagination state (Mặc định 20 dòng)
  const [filter, setFilter] = useState<IUserFilterState>({
    search: '',
    role: 'all',
    status: 'all',
    group: 'all',
    page: 1,
    limit: 20,
  });

  const [users, setUsers] = useState<IUserItem[]>([]);
  const [totalFiltered, setTotalFiltered] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<IUserItem | null>(null);
  const [assignRoleUser, setAssignRoleUser] = useState<IUserItem | null>(null);
  const [selectedUserDetail, setSelectedUserDetail] = useState<IUserItem | null>(null);
  const [createdUserSuccess, setCreatedUserSuccess] = useState<{
    user: IUserItem;
    tempPassword: string;
  } | null>(null);

  // Toast feedback state
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    sales: 0,
    managers: 0,
    pending: 0,
  });

  const showToast = (type: 'success' | 'error', message: string): void => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 4000);
  };

  const fetchUsers = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const result = await userService.getUsers(filter);
      setUsers(result.data);
      setTotalFiltered(result.total);
      setTotalPages(result.totalPages);

      // Tính toán số liệu thống kê từ danh sách hiện tại
      setStats({
        total: result.total,
        sales: result.data.filter((u) => u.roles.some((r) => r.toLowerCase().includes('sales'))).length,
        managers: result.data.filter((u) => u.roles.some((r) => r.toLowerCase().includes('manager') || r.toLowerCase().includes('admin') || r.toLowerCase().includes('leader'))).length,
        pending: result.data.filter((u) => u.status === 'pending_activation' || u.status === 'locked').length,
      });
    } catch (err: any) {
      showToast('error', err.message || 'Không thể tải danh sách người dùng.');
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleFilterChange = (newFilter: Partial<IUserFilterState>): void => {
    setFilter((prev) => ({
      ...prev,
      ...newFilter,
    }));
  };

  const handleResetFilter = (): void => {
    setFilter({
      search: '',
      role: 'all',
      status: 'all',
      group: 'all',
      page: 1,
      limit: 20,
    });
  };

  // Tạo tài khoản mới & gửi email kích hoạt kèm mật khẩu tạm
  const handleCreateUser = async (data: IUserCreateInput): Promise<void> => {
    const result = await userService.createUser(data);
    showToast('success', result.message);
    setCreatedUserSuccess({
      user: result.user,
      tempPassword: result.tempPassword,
    });
    fetchUsers();
  };

  // Cập nhật người dùng
  const handleUpdateUser = async (
    userId: string,
    data: IUserUpdateInput
  ): Promise<void> => {
    const result = await userService.updateUser(
      userId,
      data,
      currentAuthUser?.id,
      currentAuthUser?.email
    );
    showToast('success', result.message);
    setEditingUser(null);
    fetchUsers();
  };

  // Khóa / Mở khóa tài khoản
  const handleToggleStatus = async (targetUser: IUserItem): Promise<void> => {
    try {
      const result = await userService.toggleStatus(
        targetUser.id,
        currentAuthUser?.id,
        currentAuthUser?.email
      );
      showToast('success', result.message);
      fetchUsers();
    } catch (err: any) {
      showToast('error', err.message || 'Không thể cập nhật trạng thái.');
    }
  };

  // Xóa tài khoản
  const handleDeleteUser = async (targetUser: IUserItem): Promise<void> => {
    const confirm = window.confirm(
      `Bạn có chắc chắn muốn xóa tài khoản '${targetUser.name}' (${targetUser.email})? Hành động này không thể hoàn tác.`
    );
    if (!confirm) return;

    try {
      const result = await userService.deleteUser(
        targetUser.id,
        currentAuthUser?.id,
        currentAuthUser?.email
      );
      showToast('success', result.message);
      fetchUsers();
    } catch (err: any) {
      showToast('error', err.message || 'Không thể xóa tài khoản.');
    }
  };

  // Gửi lại email kích hoạt
  const handleResendActivation = async (targetUser: IUserItem): Promise<void> => {
    try {
      const result = await userService.resendActivationEmail(targetUser.id);
      showToast('success', result.message);
      fetchUsers();
    } catch (err: any) {
      showToast('error', err.message || 'Không thể gửi lại email kích hoạt.');
    }
  };

  const allEmails = users.map((u) => u.email);

  return (
    <div className={styles.pageContainer}>
      {/* Toast thông báo */}
      {toast && (
        <div
          className={`${styles.toastBanner} ${
            toast.type === 'success' ? styles.toastSuccess : styles.toastError
          }`}
        >
          <div className={styles.toastMessage}>
            {toast.type === 'success' ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            <span>{toast.message}</span>
          </div>
          <button
            type="button"
            className={styles.toastCloseBtn}
            onClick={() => setToast(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Tab điều hướng phân hệ */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          marginBottom: '1.25rem',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '0.75rem',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('crud')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: 'none',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
            backgroundColor: activeTab === 'crud' ? '#2563eb' : '#f1f5f9',
            color: activeTab === 'crud' ? '#ffffff' : '#475569',
          }}
        >
          Quản lý &amp; Cấp quyền Địa bàn (45 Người dùng)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('handover')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: 'none',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
            backgroundColor: activeTab === 'handover' ? '#2563eb' : '#f1f5f9',
            color: activeTab === 'handover' ? '#ffffff' : '#475569',
          }}
        >
          Khóa tài khoản &amp; Bàn giao Khách hàng / Deals
        </button>
      </div>

      {activeTab === 'handover' ? (
        <UserManagementPanel />
      ) : (
        <>
          {/* Header section */}
          <div className={styles.headerSection}>
        <div className={styles.headerText}>
          <h1 className={styles.pageTitle}>Quản lý Người dùng & Cấp quyền Địa bàn</h1>
          <p className={styles.pageSubtitle}>
            Là Quản trị hệ thống, bạn có thể tạo, chỉnh sửa và tìm kiếm tài khoản người dùng,
            để cấp quyền cho nhân viên kinh doanh mới ngay ngày đầu nhận địa bàn.
          </p>
        </div>

        <div className={styles.headerActions}>
          {/* Thêm người dùng mới */}
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus size={18} />
            <span>Thêm người dùng mới</span>
          </button>

          {/* Nhập Excel (S2-01) */}
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => setIsExcelModalOpen(true)}
            title="Nhập danh sách người dùng từ tệp Excel / CSV (S2-01)"
          >
            <FileSpreadsheet size={16} style={{ color: '#16a34a' }} />
            <span>Nhập Excel</span>
          </button>

          {/* Nút thử nghiệm màn hình 403 Forbidden */}
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => navigate('/forbidden')}
            title="Kiểm tra thông báo khi không đủ quyền hạn (403)"
          >
            <ShieldAlert size={15} style={{ color: '#dc2626' }} />
            <span>Thử lỗi 403</span>
          </button>

          {/* Nút thử nghiệm màn hình 404 Not Found */}
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => navigate('/duong-dan-khong-ton-tai')}
            title="Kiểm tra thông báo khi truy cập nhầm chỗ (404)"
          >
            <Compass size={15} style={{ color: '#2563eb' }} />
            <span>Thử lỗi 404</span>
          </button>


        </div>
      </div>

      {/* Thẻ thống kê */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconTotal}`}>
            <Users size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats.total}</span>
            <span className={styles.statLabel}>Tổng người dùng</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconSales}`}>
            <Briefcase size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats.sales}</span>
            <span className={styles.statLabel}>Nhân viên kinh doanh</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconManager}`}>
            <ShieldCheck size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats.managers}</span>
            <span className={styles.statLabel}>Trưởng nhóm địa bàn</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.statIconPending}`}>
            <Clock size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats.pending}</span>
            <span className={styles.statLabel}>Chờ kích hoạt email</span>
          </div>
        </div>
      </div>

      {/* Bộ lọc & Tìm kiếm */}
      <UserFilterBar
        filter={filter}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilter}
        totalFiltered={totalFiltered}
      />

      {/* Bảng danh sách & Phân trang */}
      <div className={styles.tableSection}>
        {isLoading ? (
          <div className={styles.loadingOverlay}>
            <RefreshCw size={20} className="spin" />
            <span>Đang tải danh sách người dùng...</span>
          </div>
        ) : (
          <>
            <UserTable
              users={users}
              currentUserId={currentAuthUser?.id}
              currentUserEmail={currentAuthUser?.email}
              onEdit={(u) => setEditingUser(u)}
              onViewDetails={(u) => setSelectedUserDetail(u)}
              onToggleStatus={handleToggleStatus}
              onDelete={handleDeleteUser}
              onResendActivation={handleResendActivation}
              onAssignRole={(u) => setAssignRoleUser(u)}
            />

            <UserPagination
              currentPage={filter.page}
              totalPages={totalPages}
              totalItems={totalFiltered}
              limit={filter.limit}
              onPageChange={(page) => handleFilterChange({ page })}
              onLimitChange={(limit) => handleFilterChange({ limit, page: 1 })}
            />
          </>
        )}
      </div>

      {/* Modal Phân vai trò & Nhóm (S1-09) */}
      <AssignRoleModal
        isOpen={Boolean(assignRoleUser)}
        onClose={() => setAssignRoleUser(null)}
        user={assignRoleUser}
        currentUserId={currentAuthUser?.id}
        currentUserEmail={currentAuthUser?.email}
        onSave={async (userId, roles, team) => {
          const res = await userService.updateUser(
            userId,
            { roles, group: team },
            currentAuthUser?.id,
            currentAuthUser?.email
          );
          showToast('success', res.message || 'Cập nhật phân quyền thành công.');
          fetchUsers();
        }}
      />

      {/* Modal Thêm người dùng mới */}
      <UserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmitCreate={handleCreateUser}
        currentUserId={currentAuthUser?.id}
        currentUserEmail={currentAuthUser?.email}
        allExistingEmails={allEmails}
      />

      {/* Modal Chỉnh sửa người dùng */}
      <UserModal
        isOpen={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        editingUser={editingUser}
        onSubmitUpdate={handleUpdateUser}
        currentUserId={currentAuthUser?.id}
        currentUserEmail={currentAuthUser?.email}
        allExistingEmails={allEmails}
      />

      {/* Modal Thông báo gửi email kích hoạt kèm mật khẩu tạm */}
      <UserActivationModal
        isOpen={Boolean(createdUserSuccess)}
        onClose={() => setCreatedUserSuccess(null)}
        user={createdUserSuccess?.user || null}
        tempPassword={createdUserSuccess?.tempPassword}
        onResendActivation={handleResendActivation}
      />

      {/* Modal Xem chi tiết người dùng */}
      <UserDetailModal
        isOpen={Boolean(selectedUserDetail)}
        onClose={() => setSelectedUserDetail(null)}
        user={selectedUserDetail}
      />

      {/* Modal Nhập dữ liệu Excel / CSV (S2-01) */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onSuccess={() => {
          fetchUsers();
          showToast('success', 'Nhập danh sách người dùng thành công.');
        }}
      />
        </>
      )}
    </div>
  );
};
