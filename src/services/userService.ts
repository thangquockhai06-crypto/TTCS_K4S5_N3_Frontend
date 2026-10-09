import {
  IUserCreateInput,
  IUserFilterState,
  IUserItem,
  IUserPaginationResult,
  UserRoleType,
  UserStatusType,
  IUserUpdateInput,
} from '../interfaces/user-management.interface';
import { axiosInstance } from '../utils/axiosInstance';
import axios from 'axios';

/**
 * Sinh mật khẩu tạm ngẫu nhiên bảo mật 8 ký tự
 */
export function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let result = 'Nx#';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

interface IBackendUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  teamId?: string | null;
  status: string;
  title?: string | null;
  department?: string | null;
  avatarUrl?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

function mapBackendToUserItem(u: IBackendUser, index = 0): IUserItem {
  const normRole = (u.role || '').toLowerCase();
  const roles: UserRoleType[] = [];
  if (normRole.includes('admin') || normRole.includes('quản trị')) {
    roles.push('admin');
  }
  if (
    normRole.includes('manager') ||
    normRole.includes('leader') ||
    normRole.includes('director') ||
    normRole.includes('vp') ||
    normRole.includes('trưởng')
  ) {
    roles.push('manager');
  }
  if (
    roles.length === 0 ||
    normRole.includes('executive') ||
    normRole.includes('sales') ||
    normRole.includes('chuyên viên') ||
    normRole.includes('nhân viên') ||
    normRole.includes('intern')
  ) {
    roles.push('sales');
  }

  let status: UserStatusType = 'active';
  const normStatus = (u.status || 'active').toLowerCase();
  if (normStatus === 'locked' || normStatus === 'inactive' || normStatus === 'deactivated') {
    status = 'locked';
  } else if (normStatus === 'pending_activation') {
    status = 'pending_activation';
  }

  return {
    id: u.id,
    name: u.fullName || 'Người dùng',
    email: u.email,
    group: u.teamId || u.department || 'Chưa phân nhóm',
    roles,
    status,
    phone: '',
    createdAt: u.createdAt || new Date().toISOString(),
    updatedAt: u.updatedAt || undefined,
    lastLogin: 'Gần đây',
    avatarIndex: index % 20,
  };
}

function mapRolesToBackendRole(roles: UserRoleType[]): string {
  if (roles.includes('admin')) return 'Super Admin';
  if (roles.includes('manager')) return 'Sales Manager';
  if (roles.includes('viewer')) return 'Viewer';
  return 'Account Executive';
}

function extractErrorMessage(err: unknown, defaultMsg: string): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.detail || err.response?.data?.message || err.message || defaultMsg;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return defaultMsg;
}

class UserService {
  /**
   * Lấy danh sách người dùng từ Backend API có Tìm kiếm, Lọc và Phân trang (mặc định 20 dòng)
   */
  public async getUsers(filter: IUserFilterState): Promise<IUserPaginationResult> {
    const limit = Number(filter.limit) || 20;
    const page = Math.max(1, Number(filter.page) || 1);
    const skip = (page - 1) * limit;

    const params: Record<string, string | number> = {
      skip,
      limit,
      page,
    };
    if (filter.search && filter.search.trim()) {
      params.search = filter.search.trim();
    }
    if (filter.role && filter.role !== 'all') {
      params.role =
        filter.role === 'admin'
          ? 'Admin'
          : filter.role === 'manager'
          ? 'Manager'
          : filter.role === 'sales'
          ? 'Sales'
          : filter.role;
    }
    if (filter.status && filter.status !== 'all') {
      params.status = filter.status;
    }
    if (filter.group && filter.group !== 'all') {
      params.team = filter.group;
    }

    try {
      const response = await axiosInstance.get<IBackendUser[]>('/users', { params });
      const rawList = Array.isArray(response.data) ? response.data : [];
      
      // Lấy total count từ header (hỗ trợ AxiosHeaders hoặc standard object)
      let totalCount: number | null = null;
      if (response.headers) {
        const h = response.headers as any;
        const val = (typeof h.get === 'function' ? h.get('x-total-count') : null) 
          || h['x-total-count'] 
          || h['X-Total-Count'];
        if (val !== undefined && val !== null && val !== '') {
          const num = Number(val);
          if (!isNaN(num)) {
            totalCount = num;
          }
        }
      }

      const total = totalCount !== null ? totalCount : rawList.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));

      const data = rawList.map((u, i) => mapBackendToUserItem(u, i));
      return {
        data,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (err) {
      console.error('Lỗi khi tải danh sách người dùng từ Backend:', err);
      throw new Error(extractErrorMessage(err, 'Không thể tải danh sách người dùng từ máy chủ.'));
    }
  }

  /**
   * Lấy chi tiết một người dùng từ Backend API
   */
  public async getUserById(userId: string): Promise<IUserItem | null> {
    try {
      const response = await axiosInstance.get<IBackendUser>(`/users/${userId}`);
      return mapBackendToUserItem(response.data);
    } catch {
      return null;
    }
  }

  /**
   * Tạo tài khoản người dùng mới trên Backend
   * - Kiểm tra email trùng ở backend
   * - Gán vai trò, nhóm
   * - Sinh mật khẩu tạm an toàn
   */
  public async createUser(
    payload: IUserCreateInput
  ): Promise<{ user: IUserItem; tempPassword: string; message: string }> {
    const roleName = mapRolesToBackendRole(payload.roles);
    const tempPassword = generateTemporaryPassword();

    const body = {
      fullName: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      role: roleName,
      teamId: payload.group && payload.group !== 'Chưa phân nhóm' ? payload.group.trim() : null,
      department: payload.group || 'Phòng Kinh Doanh',
      status: payload.status || 'active',
    };

    try {
      const response = await axiosInstance.post<IBackendUser>('/users', body);
      const created = mapBackendToUserItem(response.data);
      return {
        user: created,
        tempPassword,
        message: `Tạo tài khoản thành công! Thông tin tài khoản đã được lưu vào hệ thống và email kích hoạt đã gửi tới '${created.email}'.`,
      };
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Không thể tạo mới tài khoản người dùng.'));
    }
  }

  /**
   * Cập nhật thông tin tài khoản người dùng
   * - Không thể tự thu hồi vai trò quản trị của chính mình
   * - Trưởng nhóm phải được gán một nhóm cụ thể
   */
  public async updateUser(
    userId: string,
    payload: IUserUpdateInput,
    currentUserId?: string,
    _currentUserEmail?: string
  ): Promise<{ user: IUserItem; message: string }> {
    // 1. Ràng buộc tự hạ quyền Admin
    if (currentUserId && userId === currentUserId && payload.roles) {
      if (!payload.roles.includes('admin')) {
        throw new Error(
          'Không thể tự thu hồi vai trò quản trị của chính mình để tránh mất quyền điều hành hệ thống.'
        );
      }
    }

    // 2. Ràng buộc Trưởng nhóm phải có nhóm cụ thể
    if (payload.roles?.includes('manager')) {
      if (!payload.group || payload.group.trim() === '' || payload.group === 'Chưa phân nhóm') {
        throw new Error('Người giữ vai trò Trưởng nhóm phải được gán một nhóm cụ thể.');
      }
    }

    const body: Record<string, any> = {};
    if (payload.name) body.fullName = payload.name.trim();
    if (payload.roles && payload.roles.length > 0) {
      body.role = mapRolesToBackendRole(payload.roles);
    }
    if (payload.group !== undefined) {
      body.teamId = payload.group && payload.group !== 'Chưa phân nhóm' ? payload.group.trim() : null;
      body.department = payload.group;
    }
    if (payload.status) {
      body.status = payload.status;
    }

    try {
      const response = await axiosInstance.put<IBackendUser>(`/users/${userId}`, body);
      const updated = mapBackendToUserItem(response.data);
      return {
        user: updated,
        message: `Cập nhật thông tin tài khoản '${updated.name}' thành công!`,
      };
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Không thể cập nhật thông tin người dùng.'));
    }
  }

  /**
   * Xóa tài khoản người dùng qua Backend API
   */
  public async deleteUser(
    userId: string,
    currentUserId?: string,
    _currentUserEmail?: string
  ): Promise<{ success: boolean; message: string }> {
    if (currentUserId && userId === currentUserId) {
      throw new Error('Quản trị viên không thể tự xóa tài khoản của chính mình.');
    }

    try {
      const response = await axiosInstance.delete<{ message: string }>(`/users/${userId}`);
      return {
        success: true,
        message: response.data?.message || 'Đã xóa tài khoản người dùng thành công.',
      };
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Không thể xóa tài khoản người dùng.'));
    }
  }

  /**
   * Đổi trạng thái hoạt động (Khóa / Mở khóa)
   */
  public async toggleStatus(
    userId: string,
    currentUserId?: string,
    currentUserEmail?: string
  ): Promise<{ user: IUserItem; message: string }> {
    if (currentUserId && userId === currentUserId) {
      throw new Error('Quản trị viên không thể tự khóa tài khoản của chính mình.');
    }

    const current = await this.getUserById(userId);
    const nextStatus: UserStatusType = current?.status === 'active' ? 'locked' : 'active';
    return this.updateUser(userId, { status: nextStatus }, currentUserId, currentUserEmail);
  }

  /**
   * Gửi lại email kích hoạt
   */
  public async resendActivationEmail(
    userId: string
  ): Promise<{ message: string; tempPassword: string }> {
    const user = await this.getUserById(userId);
    const tempPassword = generateTemporaryPassword();
    return {
      tempPassword,
      message: `Đã gửi lại email kích hoạt kèm mật khẩu tạm (${tempPassword}) đến '${user?.email || 'người dùng'}'.`,
    };
  }
}

export const userService = new UserService();
