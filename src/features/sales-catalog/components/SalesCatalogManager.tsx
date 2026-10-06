import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Edit2,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { Button, Card, Modal } from '../../../components/common';
import { useSalesCatalog } from '../hooks/useSalesCatalog';
import {
  ISalesCatalogFormValues,
  ISalesCatalogItem,
  SALES_CATALOG_TYPES,
} from '../types/SalesCatalog.types';
import { SalesCatalogItemFormModal } from './SalesCatalogItemFormModal';
import styles from './SalesCatalogManager.module.css';

export const SalesCatalogManager: React.FC = () => {
  const catalog = useSalesCatalog();
  const [editingItem, setEditingItem] = useState<ISalesCatalogItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<ISalesCatalogItem | null>(null);
  const activeOption = SALES_CATALOG_TYPES.find(
    ({ type }) => type === catalog.activeType
  );
  const isMutating =
    catalog.isCreating ||
    catalog.isUpdating ||
    catalog.deletingId !== null ||
    catalog.isReordering;

  const openCreate = (): void => {
    catalog.clearMessage();
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const openEdit = (item: ISalesCatalogItem): void => {
    catalog.clearMessage();
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const saveItem = async (values: ISalesCatalogFormValues): Promise<boolean> => {
    const saved = editingItem
      ? await catalog.updateCategory(editingItem.id, values)
      : await catalog.createCategory(values);
    if (saved) {
      setIsFormOpen(false);
      setEditingItem(null);
    }
    return saved;
  };

  const confirmDelete = async (): Promise<void> => {
    if (!deletingItem) {
      return;
    }
    const deleted = await catalog.deleteCategory(deletingItem);
    if (deleted) {
      setDeletingItem(null);
    }
  };

  return (
    <section className={styles.salesCatalog} aria-labelledby="sales-catalog-title">
      <header className={styles.salesCatalog__header}>
        <div>
          <h2 id="sales-catalog-title">Danh mục dùng chung bán hàng</h2>
          <p>
            Quản lý thống nhất ngành nghề, quy mô doanh nghiệp, nguồn Lead và
            loại hoạt động.
          </p>
        </div>
        <Button
          leftIcon={<Plus size={16} />}
          onClick={openCreate}
          disabled={catalog.isLoading || Boolean(catalog.error) || isMutating}
        >
          Thêm danh mục
        </Button>
      </header>

      <div
        className={styles.salesCatalog__tabs}
        role="tablist"
        aria-label="Nhóm danh mục bán hàng"
      >
        {SALES_CATALOG_TYPES.map((option) => (
          <button
            key={option.type}
            id={`sales-catalog-tab-${option.type}`}
            type="button"
            role="tab"
            aria-selected={catalog.activeType === option.type}
            aria-controls="sales-catalog-panel"
            disabled={isMutating || catalog.isLoading}
            className={`${styles.salesCatalog__tab} ${
              catalog.activeType === option.type
                ? styles['salesCatalog__tab--active']
                : ''
            }`}
            onClick={() => catalog.setActiveType(option.type)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {catalog.error && (
        <div className={styles.salesCatalog__alert} role="alert">
          <AlertCircle size={18} aria-hidden="true" />
          <span>{catalog.error}</span>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw size={14} />}
            onClick={() => void catalog.reload()}
            disabled={catalog.isLoading}
          >
            Thử lại
          </Button>
        </div>
      )}
      {catalog.message && (
        <div
          className={`${styles.salesCatalog__alert} ${
            catalog.message.type === 'success'
              ? styles['salesCatalog__alert--success']
              : ''
          }`}
          role={catalog.message.type === 'success' ? 'status' : 'alert'}
        >
          {catalog.message.type === 'success' ? (
            <CheckCircle2 size={18} aria-hidden="true" />
          ) : (
            <AlertCircle size={18} aria-hidden="true" />
          )}
          <span>{catalog.message.text}</span>
        </div>
      )}

      <Card padding="none" className={styles.salesCatalog__card}>
        <div className={styles.salesCatalog__listHeader}>
          <div>
            <h3>{activeOption?.label}</h3>
            <span>{catalog.categories.length} mục</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<RefreshCw size={15} />}
            onClick={() => void catalog.reload()}
            disabled={catalog.isLoading || isMutating}
          >
            Làm mới
          </Button>
        </div>

        <div
          id="sales-catalog-panel"
          role="tabpanel"
          aria-labelledby={`sales-catalog-tab-${catalog.activeType}`}
          aria-busy={catalog.isLoading}
        >
          {catalog.isLoading ? (
            <div className={styles.salesCatalog__state} role="status">
              <span className={styles.salesCatalog__spinner} aria-hidden="true" />
              {catalog.isInitialLoading
                ? 'Đang tải danh mục...'
                : 'Đang cập nhật danh sách...'}
            </div>
          ) : catalog.error && catalog.categories.length === 0 ? (
            <div className={styles.salesCatalog__state}>
              <h3>Không thể tải danh mục</h3>
              <p>Hãy thử tải lại danh sách.</p>
              <Button
                variant="secondary"
                leftIcon={<RefreshCw size={15} />}
                onClick={() => void catalog.reload()}
              >
                Thử lại
              </Button>
            </div>
          ) : catalog.categories.length === 0 ? (
            <div className={styles.salesCatalog__state}>
              <h3>Chưa có {activeOption?.itemLabel} nào</h3>
              <p>Thêm mục đầu tiên để bắt đầu quản lý danh mục này.</p>
              <Button
                leftIcon={<Plus size={16} />}
                onClick={openCreate}
                disabled={isMutating}
              >
                Thêm danh mục
              </Button>
            </div>
          ) : (
            <ul className={styles.salesCatalog__list}>
              {catalog.categories.map((item, index) => {
                const isReferenced = item.usage_count > 0;
                return (
                  <li key={item.id} className={styles.salesCatalog__item}>
                    <div className={styles.salesCatalog__order}>
                      <span aria-label={`Vị trí ${index + 1}`}>{index + 1}</span>
                      <div>
                        <button
                          type="button"
                          aria-label={`Di chuyển ${item.name} lên`}
                          title="Di chuyển lên"
                          disabled={index === 0 || isMutating}
                          onClick={() => void catalog.moveCategory(index, 'up')}
                        >
                          <ArrowUp size={15} />
                        </button>
                        <button
                          type="button"
                          aria-label={`Di chuyển ${item.name} xuống`}
                          title="Di chuyển xuống"
                          disabled={
                            index === catalog.categories.length - 1 || isMutating
                          }
                          onClick={() => void catalog.moveCategory(index, 'down')}
                        >
                          <ArrowDown size={15} />
                        </button>
                      </div>
                    </div>
                    <div className={styles.salesCatalog__itemInfo}>
                      <strong>{item.name}</strong>
                      <span>{item.code}</span>
                    </div>
                    <div className={styles.salesCatalog__reference}>
                      <span
                        className={
                          isReferenced
                            ? styles['salesCatalog__reference--used']
                            : styles['salesCatalog__reference--unused']
                        }
                      >
                        {isReferenced
                          ? `Đang được tham chiếu · ${item.usage_count}`
                          : 'Chưa được tham chiếu'}
                      </span>
                    </div>
                    <div className={styles.salesCatalog__actions}>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Chỉnh sửa ${item.name}`}
                        title="Chỉnh sửa"
                        leftIcon={<Edit2 size={15} />}
                        onClick={() => openEdit(item)}
                        disabled={isMutating}
                      >
                        Sửa
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        aria-label={
                          isReferenced
                            ? `${item.name} đang được tham chiếu, không thể xóa`
                            : `Xóa ${item.name}`
                        }
                        title={
                          isReferenced
                            ? 'Không thể xóa danh mục đang được tham chiếu'
                            : 'Xóa danh mục'
                        }
                        leftIcon={<Trash2 size={15} />}
                        onClick={() => setDeletingItem(item)}
                        disabled={isReferenced || isMutating}
                      >
                        Xóa
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {catalog.isReordering && (
          <p className={styles.salesCatalog__operationStatus} role="status">
            Đang lưu thứ tự mới...
          </p>
        )}
      </Card>

      <SalesCatalogItemFormModal
        key={editingItem?.id ?? 'new-sales-catalog-item'}
        isOpen={isFormOpen}
        isEditing={editingItem !== null}
        isSubmitting={catalog.isCreating || catalog.isUpdating}
        error={catalog.error}
        initialValues={{
          name: editingItem?.name ?? '',
          code: editingItem?.code ?? '',
        }}
        onClose={() => setIsFormOpen(false)}
        onSubmit={saveItem}
      />

      <Modal
        isOpen={deletingItem !== null}
        onClose={() => {
          if (catalog.deletingId === null) {
            setDeletingItem(null);
          }
        }}
        title="Xóa danh mục"
        subtitle="Thao tác này không thể hoàn tác."
        maxWidth="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeletingItem(null)}
              disabled={catalog.deletingId !== null}
            >
              Hủy
            </Button>
            <Button
              variant="danger"
              isLoading={catalog.deletingId !== null}
              onClick={() => void confirmDelete()}
              disabled={!deletingItem || deletingItem.usage_count > 0}
            >
              Xóa
            </Button>
          </>
        }
      >
        {deletingItem && (
          <p>
            Bạn có chắc muốn xóa <strong>{deletingItem.name}</strong>?
          </p>
        )}
      </Modal>
    </section>
  );
};
