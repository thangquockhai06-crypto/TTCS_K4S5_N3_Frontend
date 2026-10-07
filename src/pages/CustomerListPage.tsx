import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  Edit,
  Eye,
  Filter,
  GitMerge,
  LayoutGrid,
  List,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  ICustomer,
} from '../interfaces/customer.interface';
import { customerService } from '../services/customerService';
import { formatCurrency } from '../utils/formatters';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Modal,
  SearchBar,
} from '../components/common';
import { RiskBadge } from '../components/customer/RiskBadge';
import { CustomerForm } from '../components/customer/CustomerForm';
import { MergeCustomerModal } from '../components/customer/MergeCustomerModal';
import { CustomerImportModal } from '../components/customer/CustomerImportModal';
import { FilterDrawer, ICustomerFilterParams } from '../components/customer/FilterDrawer';
import styles from './CustomerListPage.module.css';

const STATUS_FILTER_CHIPS: ReadonlyArray<{
  value: string;
  label: string;
}> = [
  { value: 'All', label: 'Tất cả' },
  { value: 'Active', label: 'Đang hợp tác' },
  { value: 'Negotiation', label: 'Đang đàm phán' },
  { value: 'New Lead', label: 'Tiềm năng mới' },
  { value: 'At Risk', label: 'Cần chú ý' },
  { value: 'Churned', label: 'Đã ngừng' },
];

export const CustomerListPage: React.FC = () => {
  const navigate = useNavigate();

  // Data & State
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [page, setPage] = useState<number>(1);
  const limit = 20;
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & View
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [advancedFilters, setAdvancedFilters] = useState<ICustomerFilterParams>({});
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<ICustomer | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState<boolean>(false);
  const [mergePrimaryCustomer, setMergePrimaryCustomer] = useState<ICustomer | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false);
  const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Load customers from API with data scope enforced on backend
  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const criteria = {
        ...advancedFilters,
        skip: (page - 1) * limit,
        limit,
        search: searchQuery.trim() || undefined,
        status: selectedStatus !== 'All' ? selectedStatus : advancedFilters.status,
      };

      const res = await customerService.getCustomers(criteria);
      setCustomers(res || []);
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách khách hàng:', err);
      setError(err.response?.data?.detail || 'Không thể tải danh sách khách hàng từ máy chủ.');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, searchQuery, selectedStatus, advancedFilters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchCustomers]);

  const handleDeleteCustomer = async () => {
    if (!deletingCustomerId) return;
    setIsDeleting(true);
    try {
      await customerService.deleteCustomer(deletingCustomerId);
      setDeletingCustomerId(null);
      fetchCustomers();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Lỗi khi xóa khách hàng');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenMergeFor = (c: ICustomer, e: React.MouseEvent) => {
    e.stopPropagation();
    setMergePrimaryCustomer(c);
    setIsMergeModalOpen(true);
  };

  const totalFilteredArr = customers.reduce(
    (sum, c) => sum + (c.totalContractValue || c.dealValue || 0),
    0
  );

  return (
    <div className={styles.customerListPage}>
      {/* Tiêu đề trang & Các nút chức năng */}
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageHeader__title}>Danh bạ Khách hàng Doanh nghiệp (S3-01)</h1>
          <p className={styles.pageHeader__subtitle}>
            Hiển thị <strong>{customers.length}</strong> doanh nghiệp · Tổng ARR danh mục:{' '}
            <strong className="tabular-nums" style={{ color: '#059669' }}>
              {formatCurrency(totalFilteredArr)}
            </strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            leftIcon={<Clock size={16} />}
            onClick={() => navigate('/customers/stagnant')}
            title="Danh sách cần chăm sóc định kỳ (S3-09)"
          >
            Chăm sóc định kỳ
          </Button>

          <Button
            variant="secondary"
            leftIcon={<GitMerge size={16} />}
            onClick={() => {
              setMergePrimaryCustomer(customers[0] || null);
              setIsMergeModalOpen(true);
            }}
            title="Gộp khách hàng trùng lặp (S3-04)"
          >
            Gộp trùng
          </Button>

          <Button
            variant="secondary"
            leftIcon={<Upload size={16} />}
            onClick={() => setIsImportModalOpen(true)}
            title="Nhập khách hàng từ Excel (S3-06)"
          >
            Nhập Excel
          </Button>

          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Thêm khách hàng
          </Button>
        </div>
      </header>

      {/* Thanh công cụ: Tìm kiếm, Bộ lọc nâng cao, Bảng/Lưới */}
      <Card padding="sm" className={styles.toolbarCard}>
        <div className={styles.toolbar__topRow}>
          <div className={styles.toolbar__searchWrap}>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Tìm theo tên công ty, MST, người đại diện, số điện thoại..."
              ariaLabel="Lọc danh sách khách hàng theo từ khóa"
              shortcutHint="Tìm nhanh"
            />
          </div>

          <div className={styles.toolbar__controls}>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Filter size={15} />}
              onClick={() => setIsFilterDrawerOpen(true)}
            >
              Bộ lọc nâng cao
              {Object.keys(advancedFilters).length > 0 && (
                <span
                  style={{
                    marginLeft: 6,
                    padding: '1px 6px',
                    borderRadius: 10,
                    backgroundColor: '#2563EB',
                    color: '#fff',
                    fontSize: '0.75rem',
                  }}
                >
                  {Object.keys(advancedFilters).length}
                </span>
              )}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={fetchCustomers}
              leftIcon={<RefreshCw size={14} />}
              title="Làm mới dữ liệu"
            >
              Làm mới
            </Button>

            {/* View Mode Toggle */}
            <div className={styles.viewToggle} role="group" aria-label="Chế độ hiển thị">
              <button
                type="button"
                className={`${styles.viewToggle__btn} ${
                  viewMode === 'table' ? styles['viewToggle__btn--active'] : ''
                }`}
                onClick={() => setViewMode('table')}
                aria-label="Chế độ danh sách bảng"
              >
                <List size={16} />
                <span>Bảng</span>
              </button>
              <button
                type="button"
                className={`${styles.viewToggle__btn} ${
                  viewMode === 'grid' ? styles['viewToggle__btn--active'] : ''
                }`}
                onClick={() => setViewMode('grid')}
                aria-label="Chế độ lưới thẻ"
              >
                <LayoutGrid size={16} />
                <span>Lưới</span>
              </button>
            </div>
          </div>
        </div>

        {/* Hàng Filter Chips trạng thái */}
        <div className={styles.toolbar__chipsRow}>
          <div className={styles.chipGroup} role="group" aria-label="Lọc theo trạng thái">
            {STATUS_FILTER_CHIPS.map((chip) => {
              const isActive = selectedStatus === chip.value;
              return (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => {
                    setSelectedStatus(chip.value);
                    setPage(1);
                  }}
                  className={`${styles.filterChip} ${
                    isActive ? styles['filterChip--active'] : ''
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Thông báo lỗi nếu có */}
      {error && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: 8,
            color: '#B91C1C',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Hiển thị danh sách khách hàng */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#64748B' }}>
          <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          <div>Đang tải dữ liệu khách hàng từ cơ sở dữ liệu...</div>
        </div>
      ) : customers.length === 0 ? (
        <EmptyState
          title="Không tìm thấy khách hàng nào"
          description="Hãy thử đổi từ khóa tìm kiếm, đặt lại bộ lọc hoặc tạo hồ sơ khách hàng doanh nghiệp mới."
          action={
            <Button
              variant="primary"
              leftIcon={<Plus size={15} />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Thêm khách hàng mới
            </Button>
          }
        />
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className={styles.customerGrid}>
          {customers.map((c) => (
            <div
              key={c.id}
              onClick={() => navigate(`/customers/${c.id}`)}
              style={{
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                backgroundColor: '#FFFFFF',
                borderRadius: 8,
                padding: 16,
                border: '1px solid #E2E8F0',
                transition: 'box-shadow 0.2s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <Avatar name={c.company || c.fullName} size="md" />
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>
                      {c.company || c.fullName}
                    </h3>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      {c.fullName} {c.role ? `· ${c.role}` : ''}
                    </div>
                  </div>
                </div>
                <RiskBadge isRisk={Boolean(c.riskFlag)} reason={c.riskReason} />
              </div>

              <div style={{ fontSize: '0.8125rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div><strong>MST:</strong> <code>{c.taxCode || '—'}</code></div>
                <div><strong>Phân hạng:</strong> {c.tier || 'Enterprise'} · {c.industry || 'Chưa phân ngành'}</div>
                <div><strong>ARR:</strong> <strong style={{ color: '#059669' }}>{formatCurrency(c.totalContractValue || c.dealValue || 0)}</strong></div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: 8, marginTop: 'auto' }}>
                <Badge tone={c.status === 'Active' ? 'success' : 'neutral'} size="sm">
                  {c.status || 'New Lead'}
                </Badge>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCustomer(c);
                    }}
                    title="Chỉnh sửa"
                  >
                    <Edit size={13} />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => handleOpenMergeFor(c, e)}
                    title="Gộp trùng"
                  >
                    <GitMerge size={13} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <Card padding="none" className={styles.tableCard}>
          <div className={styles.tableResponsive}>
            <table className={styles.customerTable}>
              <thead>
                <tr>
                  <th>Tên Doanh nghiệp & Đại diện</th>
                  <th>Mã số thuế (MST)</th>
                  <th>Phân hạng / Ngành nghề</th>
                  <th>Trạng thái</th>
                  <th>Cờ rủi ro</th>
                  <th className={styles.thRight}>Giá trị ARR</th>
                  <th className={styles.thRight}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    className={styles.customerTable__row}
                    onClick={() => navigate(`/customers/${c.id}`)}
                  >
                    <td>
                      <div className={styles.cellIdentity}>
                        <Avatar name={c.company || c.fullName} size="sm" />
                        <div>
                          <strong className={styles.cellIdentity__name}>
                            {c.company || c.fullName}
                          </strong>
                          <span className={styles.cellIdentity__role}>
                            {c.fullName} {c.role ? `· ${c.role}` : ''}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <code>{c.taxCode || '—'}</code>
                    </td>

                    <td>
                      <div style={{ fontSize: '0.8125rem' }}>
                        <span style={{ fontWeight: 600 }}>{c.tier || 'Enterprise'}</span>
                        <div style={{ color: '#64748B' }}>{c.industry || '—'}</div>
                      </div>
                    </td>

                    <td>
                      <Badge
                        tone={c.status === 'Active' ? 'success' : c.status === 'At Risk' ? 'danger' : 'neutral'}
                        size="sm"
                      >
                        {c.status || 'New Lead'}
                      </Badge>
                    </td>

                    <td>
                      <RiskBadge isRisk={Boolean(c.riskFlag)} reason={c.riskReason} />
                    </td>

                    <td className={styles.tdRight}>
                      <strong className={`${styles.cellArr} tabular-nums`} style={{ color: '#059669' }}>
                        {formatCurrency(c.totalContractValue || c.dealValue || 0)}
                      </strong>
                    </td>

                    <td className={styles.tdRight}>
                      <div
                        style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(`/customers/${c.id}`)}
                          title="Xem 360"
                        >
                          <Eye size={14} />
                        </Button>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setEditingCustomer(c)}
                          title="Chỉnh sửa hồ sơ"
                        >
                          <Edit size={14} />
                        </Button>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => handleOpenMergeFor(c, e)}
                          title="Gộp trùng với hồ sơ khác"
                        >
                          <GitMerge size={14} />
                        </Button>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setDeletingCustomerId(c.id)}
                          title="Xóa hồ sơ (Soft-delete)"
                        >
                          <Trash2 size={14} color="#DC2626" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
        <span style={{ fontSize: '0.875rem', color: '#64748B' }}>
          Trang {page} (Hiển thị {customers.length} khách hàng)
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Trang trước
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={customers.length < limit}
            onClick={() => setPage((p) => p + 1)}
          >
            Trang sau
          </Button>
        </div>
      </div>

      {/* Create Customer Modal (S3-01) */}
      {isCreateModalOpen && (
        <CustomerForm
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            fetchCustomers();
          }}
        />
      )}

      {/* Edit Customer Modal (S3-01) */}
      {editingCustomer && (
        <CustomerForm
          isOpen={Boolean(editingCustomer)}
          onClose={() => setEditingCustomer(null)}
          customerToEdit={editingCustomer}
          onSuccess={() => {
            setEditingCustomer(null);
            fetchCustomers();
          }}
        />
      )}

      {/* Merge Customer Modal (S3-04) */}
      {isMergeModalOpen && (
        <MergeCustomerModal
          isOpen={isMergeModalOpen}
          onClose={() => setIsMergeModalOpen(false)}
          primaryCustomer={mergePrimaryCustomer}
          onMerged={() => {
            setIsMergeModalOpen(false);
            fetchCustomers();
          }}
        />
      )}

      {/* Excel Import Modal (S3-06) */}
      {isImportModalOpen && (
        <CustomerImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={() => {
            fetchCustomers();
          }}
        />
      )}

      {/* Advanced Filter Drawer (S3-07) */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={advancedFilters}
        onApplyFilters={(filters) => {
          setAdvancedFilters(filters);
          setPage(1);
        }}
        onResetFilters={() => {
          setAdvancedFilters({});
          setSearchQuery('');
          setSelectedStatus('All');
          setPage(1);
        }}
      />

      {/* Delete Confirmation Modal */}
      {deletingCustomerId && (
        <Modal
          isOpen={Boolean(deletingCustomerId)}
          onClose={() => setDeletingCustomerId(null)}
          title="Xác nhận xóa khách hàng"
          maxWidth="sm"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Button variant="secondary" onClick={() => setDeletingCustomerId(null)} disabled={isDeleting}>
                Hủy bỏ
              </Button>
              <Button
                variant="primary"
                onClick={handleDeleteCustomer}
                disabled={isDeleting}
                style={{ backgroundColor: '#DC2626' }}
              >
                {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa mềm'}
              </Button>
            </div>
          }
        >
          <div style={{ color: '#475569', fontSize: '0.875rem' }}>
            Hồ sơ khách hàng này sẽ được chuyển vào trạng thái xóa mềm (soft-deleted). Các liên kết dữ liệu sẽ được giữ an toàn.
          </div>
        </Modal>
      )}
    </div>
  );
};
