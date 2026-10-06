import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpDown,
  Eye,
  LayoutGrid,
  List,
  Plus,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import {
  CustomerCard,
  getCustomerStatusLabel,
  getCustomerStatusTone,
} from '../components/customer/CustomerCard';
import { CustomerDetailPanel } from '../components/customer/CustomerDetailPanel';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Drawer,
  Dropdown,
  EmptyState,
  SearchBar,
} from '../components/common';
import { useCRMData } from '../context/CRMDataContext';
import { useCustomerFilter } from '../hooks/useCustomerFilter';
import { CustomerSortFieldType, CustomerStatusType, ICustomer } from '../interfaces';
import { formatCurrency } from '../utils/formatters';
import styles from './CustomerListPage.module.css';

const STATUS_FILTER_CHIPS: ReadonlyArray<{
  value: CustomerStatusType | 'All';
  label: string;
}> = [
  { value: 'All', label: 'Tất cả' },
  { value: 'Active', label: 'Đang hợp tác' },
  { value: 'Negotiation', label: 'Đang đàm phán' },
  { value: 'New Lead', label: 'Tiềm năng mới' },
  { value: 'At Risk', label: 'Cần chú ý' },
  { value: 'Churned', label: 'Đã ngừng' },
];

const SORT_OPTIONS: ReadonlyArray<{ label: string; value: CustomerSortFieldType }> = [
  { label: 'Giá trị Hợp đồng (ARR)', value: 'dealValue' },
  { label: 'Điểm Sức khỏe', value: 'healthScore' },
  { label: 'Tên Khách hàng', value: 'fullName' },
  { label: 'Tên Doanh nghiệp', value: 'company' },
];

export const CustomerListPage: React.FC = () => {
  const { customers } = useCRMData();
  const navigate = useNavigate();

  const {
    searchQuery,
    setSearchQuery,
    selectedStatus,
    setSelectedStatus,
    selectedTag,
    setSelectedTag,
    sortField,
    setSortField,
    sortDirection,
    toggleSortDirection,
    viewMode,
    setViewMode,
    filteredCustomers,
    availableTags,
    resetFilters,
  } = useCustomerFilter(customers);

  const [inspectedCustomer, setInspectedCustomer] = useState<ICustomer | null>(null);

  const totalFilteredArr = filteredCustomers.reduce((sum, c) => sum + c.dealValue, 0);

  return (
    <div className={styles.customerListPage}>
      {/* Tiêu đề trang */}
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageHeader__title}>Danh bạ Khách hàng Doanh nghiệp</h1>
          <p className={styles.pageHeader__subtitle}>
            Đang hiển thị <strong>{filteredCustomers.length}</strong> trên tổng số{' '}
            {customers.length} khách hàng · Tổng giá trị danh mục:{' '}
            <strong className="tabular-nums">{formatCurrency(totalFilteredArr)}</strong>
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<Plus size={16} />}
          onClick={() => navigate('/customers/new')}
        >
          Thêm khách hàng
        </Button>
      </header>

      {/* Thanh công cụ kết hợp: Tìm kiếm + Sắp xếp + Chuyển đổi Bảng/Lưới */}
      <Card padding="sm" className={styles.toolbarCard}>
        <div className={styles.toolbar__topRow}>
          <div className={styles.toolbar__searchWrap}>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Tìm theo họ tên, công ty, tên miền, quốc gia hoặc nhãn tag..."
              ariaLabel="Lọc danh sách khách hàng theo từ khóa"
              shortcutHint="Lọc nhanh"
            />
          </div>

          <div className={styles.toolbar__controls}>
            <Dropdown<CustomerSortFieldType>
              label="Sắp xếp"
              value={sortField}
              options={SORT_OPTIONS}
              onChange={setSortField}
              ariaLabel="Sắp xếp danh sách khách hàng"
              icon={<SlidersHorizontal size={14} />}
            />

            <button
              type="button"
              onClick={toggleSortDirection}
              className={styles.toolbar__dirBtn}
              aria-label={`Chiều sắp xếp: ${sortDirection}`}
              title="Đổi chiều Tăng dần / Giảm dần"
            >
              <ArrowUpDown size={15} />
              <span>{sortDirection === 'desc' ? 'GIẢM DẦN' : 'TĂNG DẦN'}</span>
            </button>

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
                <span>Lưới thẻ</span>
              </button>
            </div>
          </div>
        </div>

        {/* Hàng Filter Chips */}
        <div className={styles.toolbar__chipsRow}>
          <div className={styles.chipGroup} role="group" aria-label="Lọc theo trạng thái">
            {STATUS_FILTER_CHIPS.map((chip) => {
              const isActive = selectedStatus === chip.value;
              return (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => setSelectedStatus(chip.value)}
                  className={`${styles.filterChip} ${
                    isActive ? styles['filterChip--active'] : ''
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          <div className={styles.tagChipsGroup} role="group" aria-label="Lọc theo nhãn tag">
            {availableTags.slice(0, 6).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={`${styles.tagChip} ${
                  selectedTag === tag ? styles['tagChip--active'] : ''
                }`}
              >
                #{tag === 'All' ? 'Tất cả Tag' : tag}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Danh sách hiển thị */}
      {filteredCustomers.length === 0 ? (
        <EmptyState
          title="Không tìm thấy khách hàng phù hợp"
          description="Hãy thử xóa từ khóa tìm kiếm hoặc đặt lại bộ lọc trạng thái để xem đầy đủ 50 khách hàng doanh nghiệp."
          action={
            <Button
              variant="secondary"
              leftIcon={<RotateCcw size={15} />}
              onClick={resetFilters}
            >
              Đặt lại Bộ lọc
            </Button>
          }
        />
      ) : viewMode === 'grid' ? (
        <div className={styles.customerGrid}>
          {filteredCustomers.map((customer, index) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              index={index}
              onSelect={(c) => navigate(`/customers/${c.id}`)}
              onQuickInspect={(c) => setInspectedCustomer(c)}
            />
          ))}
        </div>
      ) : (
        <Card padding="none" className={styles.tableCard}>
          <div className={styles.tableResponsive}>
            <table className={styles.customerTable}>
              <thead>
                <tr>
                  <th>Người đại diện & Chức vụ</th>
                  <th>Doanh nghiệp</th>
                  <th>Trạng thái</th>
                  <th>Nhãn phân loại</th>
                  <th>Sức khỏe</th>
                  <th className={styles.thRight}>Giá trị ARR</th>
                  <th>Phụ trách</th>
                  <th className={styles.thRight}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className={styles.customerTable__row}
                    onClick={() => navigate(`/customers/${customer.id}`)}
                  >
                    <td>
                      <div className={styles.cellIdentity}>
                        <Avatar
                          src={customer.avatarUrl}
                          name={customer.fullName}
                          size="sm"
                        />
                        <div>
                          <strong className={styles.cellIdentity__name}>
                            {customer.fullName}
                          </strong>
                          <span className={styles.cellIdentity__role}>
                            {customer.role}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className={styles.cellCompany}>
                        <strong>{customer.company}</strong>
                        <span>
                          {customer.industry} · {customer.location}
                        </span>
                      </div>
                    </td>

                    <td>
                      <Badge
                        tone={getCustomerStatusTone(customer.status)}
                        dot
                        size="sm"
                      >
                        {getCustomerStatusLabel(customer.status)}
                      </Badge>
                    </td>

                    <td>
                      <div className={styles.cellTags}>
                        {customer.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className={styles.cellTagPill}>
                            {tag}
                          </span>
                        ))}
                        {customer.tags.length > 2 && (
                          <span className={styles.cellTagMore}>
                            +{customer.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <div className={styles.cellHealth}>
                        <div className={styles.cellHealth__track}>
                          <div
                            className={styles.cellHealth__fill}
                            style={{
                              width: `${customer.healthScore}%`,
                              backgroundColor:
                                customer.healthScore >= 80
                                  ? '#10B981'
                                  : customer.healthScore >= 60
                                  ? '#F59E0B'
                                  : '#EF4444',
                            }}
                          />
                        </div>
                        <span className="tabular-nums">{customer.healthScore}%</span>
                      </div>
                    </td>

                    <td className={styles.tdRight}>
                      <strong className={`${styles.cellArr} tabular-nums`}>
                        {formatCurrency(customer.dealValue)}
                      </strong>
                    </td>

                    <td>
                      <div className={styles.cellOwner}>
                        <Avatar
                          src={customer.owner.avatarUrl}
                          name={customer.owner.name}
                          size="xs"
                        />
                        <span>{customer.owner.name}</span>
                      </div>
                    </td>

                    <td className={styles.tdRight}>
                      <button
                        type="button"
                        className={styles.quickDrawerBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectedCustomer(customer);
                        }}
                        aria-label={`Xem nhanh ${customer.fullName}`}
                      >
                        <Eye size={15} />
                        <span>Xem nhanh</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Ngăn kéo xem nhanh thông tin bên phải */}
      <Drawer
        isOpen={Boolean(inspectedCustomer)}
        onClose={() => setInspectedCustomer(null)}
        title={inspectedCustomer?.fullName ?? 'Thông tin Khách hàng'}
        subtitle={
          inspectedCustomer ? `${inspectedCustomer.role} @ ${inspectedCustomer.company}` : ''
        }
      >
        {inspectedCustomer && (
          <CustomerDetailPanel
            customer={inspectedCustomer}
            onOpenFullProfile={() => {
              const targetId = inspectedCustomer.id;
              setInspectedCustomer(null);
              navigate(`/customers/${targetId}`);
            }}
          />
        )}
      </Drawer>
    </div>
  );
};
