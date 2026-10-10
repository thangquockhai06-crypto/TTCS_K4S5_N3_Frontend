import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Users,
  Loader2,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { userService } from '../../services/userService';
import { IUserItem } from '../../interfaces/user-management.interface';

interface IImportUserSearchPanelProps {
  onSelectUser?: (user: IUserItem) => void;
  uploadedEmails?: Set<string>;
}

export const ImportUserSearchPanel: React.FC<IImportUserSearchPanelProps> = ({
  onSelectUser,
  uploadedEmails,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 8;

  const [users, setUsers] = useState<IUserItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Debounced search logic
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await userService.getUsers({
        search: searchTerm.trim(),
        role: selectedRole,
        status: selectedStatus,
        group: 'all',
        page,
        limit,
      });
      setUsers(res.data);
      setTotalCount(res.total);
      setTotalPages(res.totalPages || Math.max(1, Math.ceil(res.total / limit)));
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể tra cứu danh sách người dùng từ hệ thống.');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedRole, selectedStatus, page, limit]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(handler);
  }, [fetchUsers]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedRole('all');
    setSelectedStatus('all');
    setPage(1);
  };

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 'var(--radius-md, 10px)',
        border: '1px solid var(--color-border, #e2e8f0)',
        padding: '20px',
        boxShadow: 'var(--shadow-xs, 0 1px 2px rgba(0,0,0,0.05))',
      }}
    >
      {/* Header section */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={20} style={{ color: 'var(--color-primary, #2563eb)' }} />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-primary, #0f172a)' }}>
              Tra Cứu &amp; Đối Soát Người Dùng Hiện Có
            </h3>
          </div>
          <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: 'var(--color-text-muted, #64748b)' }}>
            Tìm kiếm trực tiếp từ CSDL theo tên, email, vai trò, nhóm để đối chiếu độc lập trong khi tiến trình nhập đang chạy
          </p>
        </div>

        <span
          style={{
            fontSize: '0.75rem',
            padding: '3px 8px',
            borderRadius: '4px',
            backgroundColor: '#eff6ff',
            color: '#1d4ed8',
            fontWeight: 600,
          }}
        >
          {totalCount} tài khoản trong hệ thống
        </span>
      </div>

      {/* Bộ lọc và ô tìm kiếm */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '10px',
          marginBottom: '16px',
        }}
      >
        {/* Input tìm kiếm */}
        <div style={{ position: 'relative' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
            }}
          />
          <input
            type="text"
            placeholder="Tìm theo họ tên, email, chức danh..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            style={{
              width: '100%',
              padding: '8px 30px 8px 34px',
              fontSize: '0.85rem',
              borderRadius: 'var(--radius-xs, 6px)',
              border: '1px solid var(--color-border-strong, #cbd5e1)',
              outline: 'none',
              backgroundColor: '#ffffff',
            }}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setPage(1);
              }}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Lọc vai trò */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              setPage(1);
            }}
            style={{
              width: '100%',
              padding: '8px 10px',
              fontSize: '0.85rem',
              borderRadius: 'var(--radius-xs, 6px)',
              border: '1px solid var(--color-border-strong, #cbd5e1)',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              cursor: 'pointer',
              outline: 'none',
            }}
            aria-label="Lọc theo vai trò"
          >
            <option value="all">Tất cả vai trò</option>
            <option value="admin">Quản trị viên (Admin)</option>
            <option value="manager">Trưởng nhóm (Manager)</option>
            <option value="sales">Nhân viên kinh doanh (Sales)</option>
            <option value="viewer">Người xem (Viewer)</option>
          </select>
        </div>

        {/* Lọc trạng thái */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            style={{
              width: '100%',
              padding: '8px 10px',
              fontSize: '0.85rem',
              borderRadius: 'var(--radius-xs, 6px)',
              border: '1px solid var(--color-border-strong, #cbd5e1)',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              cursor: 'pointer',
              outline: 'none',
            }}
            aria-label="Lọc theo trạng thái"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động (Active)</option>
            <option value="locked">Bị khóa (Locked)</option>
            <option value="pending_activation">Chờ kích hoạt</option>
          </select>
        </div>

        {/* Nút đặt lại bộ lọc */}
        {(searchTerm || selectedRole !== 'all' || selectedStatus !== 'all') && (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleResetFilters}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                fontSize: '0.85rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-xs, 6px)',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#475569',
                cursor: 'pointer',
              }}
              title="Đặt lại bộ lọc tìm kiếm"
            >
              <RotateCcw size={14} />
              <span>Đặt lại</span>
            </button>
          </div>
        )}
      </div>

      {errorMsg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            color: '#b91c1c',
            fontSize: '0.82rem',
            marginBottom: '12px',
          }}
        >
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Bảng kết quả tìm kiếm */}
      <div
        style={{
          border: '1px solid var(--color-border, #e2e8f0)',
          borderRadius: 'var(--radius-sm, 8px)',
          overflowX: 'auto',
          backgroundColor: '#ffffff',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
          <thead style={{ backgroundColor: 'var(--color-bg-subtle, #f8fafc)', borderBottom: '1px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: '8px 12px', color: '#64748b', fontWeight: 600 }}>Họ và tên</th>
              <th style={{ padding: '8px 12px', color: '#64748b', fontWeight: 600 }}>Email</th>
              <th style={{ padding: '8px 12px', color: '#64748b', fontWeight: 600 }}>Vai trò</th>
              <th style={{ padding: '8px 12px', color: '#64748b', fontWeight: 600 }}>Phòng ban / Nhóm</th>
              <th style={{ padding: '8px 12px', color: '#64748b', fontWeight: 600 }}>Trạng thái</th>
              <th style={{ padding: '8px 12px', color: '#64748b', fontWeight: 600 }}>Trong tệp nhập?</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px 12px', textAlign: 'center', color: '#64748b' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Loader2 size={18} className="spin" style={{ color: 'var(--color-primary, #2563eb)' }} />
                    <span>Đang tìm kiếm người dùng trong hệ thống...</span>
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '28px 12px', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
                  Không tìm thấy tài khoản nào khớp với thông tin tìm kiếm.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const normEmail = (u.email || '').trim().toLowerCase();
                const isInUploadedFile = uploadedEmails ? uploadedEmails.has(normEmail) : false;

                return (
                  <tr
                    key={`search-user-${u.id}`}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: isInUploadedFile ? '#fffdf5' : '#ffffff',
                      cursor: onSelectUser ? 'pointer' : 'default',
                    }}
                    onClick={() => onSelectUser && onSelectUser(u)}
                  >
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#0f172a' }}>
                      {u.name}
                    </td>

                    <td style={{ padding: '8px 12px', color: '#334155' }}>
                      {u.email}
                    </td>

                    <td style={{ padding: '8px 12px', color: '#475569' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#f1f5f9',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                        }}
                      >
                        {(u.roles || []).join(', ') || 'sales'}
                      </span>
                    </td>

                    <td style={{ padding: '8px 12px', color: '#475569' }}>
                      {u.group || 'Chưa phân nhóm'}
                    </td>

                    <td style={{ padding: '8px 12px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          backgroundColor:
                            u.status === 'active'
                              ? '#dcfce7'
                              : u.status === 'locked'
                              ? '#fee2e2'
                              : '#fef3c7',
                          color:
                            u.status === 'active'
                              ? '#15803d'
                              : u.status === 'locked'
                              ? '#b91c1c'
                              : '#b45309',
                        }}
                      >
                        {u.status === 'active'
                          ? 'Hoạt động'
                          : u.status === 'locked'
                          ? 'Bị khóa'
                          : 'Chờ kích hoạt'}
                      </span>
                    </td>

                    <td style={{ padding: '8px 12px' }}>
                      {isInUploadedFile ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: '#fef3c7',
                            color: '#b45309',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                          }}
                          title="Email này trùng với một dòng trong tệp bạn đang tải lên"
                        >
                          <AlertCircle size={12} />
                          <span>Có trong file</span>
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Phân trang */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '12px',
            fontSize: '0.8rem',
            color: '#64748b',
          }}
        >
          <span>
            Trang <strong>{page}</strong> / <strong>{totalPages}</strong> (tổng {totalCount} tài khoản)
          </span>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '4px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                opacity: page <= 1 ? 0.5 : 1,
              }}
            >
              <ChevronLeft size={14} /> Trước
            </button>

            <button
              type="button"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '4px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                opacity: page >= totalPages ? 0.5 : 1,
              }}
            >
              Sau <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
