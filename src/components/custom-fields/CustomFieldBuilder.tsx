import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Type,
  Hash,
  Calendar,
  List,
  Eye,
  X,
  RotateCcw,
} from 'lucide-react';
import { ICustomField } from '../../interfaces';
import { sprint2Service } from '../../services/sprint2Service';
import { useCRMData } from '../../context/CRMDataContext';
import { CustomSelect, ICustomSelectOption } from '../common/CustomSelect';
import { ConfirmModal } from '../common/ConfirmModal';
import { ToastNotification, IToastItem } from '../common/ToastNotification';
import { CustomFieldRenderer } from './CustomFieldRenderer';

export const CustomFieldBuilder: React.FC = () => {
  const { appearance } = useCRMData();
  const isDark = appearance.theme === 'dark';

  const [entityType, setEntityType] = useState<'customer' | 'deal'>('customer');
  const [fields, setFields] = useState<ICustomField[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Toast notifications state
  const [toasts, setToasts] = useState<IToastItem[]>([]);

  const addToast = (type: IToastItem['type'], message: string) => {
    const newToast: IToastItem = {
      id: `toast-${Date.now()}-${Math.random()}`,
      type,
      message,
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<ICustomField | null>(null);
  const [fieldName, setFieldName] = useState('');
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState<'text' | 'number' | 'date' | 'select'>('text');
  const [optionsStr, setOptionsStr] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [defaultValue, setDefaultValue] = useState('');

  // Delete Confirm Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    field: ICustomField | null;
  }>({
    isOpen: false,
    field: null,
  });

  // Interactive dynamic preview values state
  const [previewValues, setPreviewValues] = useState<Record<string, string | number>>({});

  const fetchFields = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await sprint2Service.getCustomFields(entityType);
      setFields(data);
    } catch {
      addToast('error', 'Không thể tải danh sách trường tùy chỉnh.');
    } finally {
      setIsLoading(false);
    }
  }, [entityType]);

  useEffect(() => {
    fetchFields();
    setPreviewValues({});
  }, [fetchFields]);

  const handleOpenCreate = () => {
    setEditingField(null);
    setFieldName('');
    setFieldLabel('');
    setFieldType('text');
    setOptionsStr('');
    setIsRequired(false);
    setDefaultValue('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (f: ICustomField) => {
    setEditingField(f);
    setFieldName(f.field_name);
    setFieldLabel(f.field_label);
    setFieldType(f.field_type);
    setOptionsStr(f.options || '');
    setIsRequired(f.is_required);
    setDefaultValue(f.default_value || '');
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldLabel.trim()) {
      addToast('warning', 'Vui lòng nhập tên nhãn hiển thị.');
      return;
    }

    try {
      if (editingField) {
        await sprint2Service.updateCustomField(editingField.id, {
          field_label: fieldLabel.trim(),
          field_type: fieldType,
          options: fieldType === 'select' ? optionsStr.trim() : undefined,
          is_required: isRequired,
          default_value: defaultValue.trim() || undefined,
        });
        addToast('success', 'Cập nhật trường dữ liệu thành công!');
      } else {
        const generatedName = fieldName.trim()
          ? fieldName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')
          : fieldLabel
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9]/g, '_');

        await sprint2Service.createCustomField({
          entity_type: entityType,
          field_name: generatedName,
          field_label: fieldLabel.trim(),
          field_type: fieldType,
          options: fieldType === 'select' ? optionsStr.trim() : undefined,
          is_required: isRequired,
          default_value: defaultValue.trim() || undefined,
        });
        addToast('success', 'Thêm trường tùy chỉnh mới thành công!');
      }
      setIsModalOpen(false);
      fetchFields();
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Lỗi khi lưu cấu hình trường dữ liệu.';
      addToast('error', errorMsg);
    }
  };

  const handleRequestDelete = (f: ICustomField) => {
    setDeleteModal({
      isOpen: true,
      field: f,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.field) return;
    try {
      await sprint2Service.deleteCustomField(deleteModal.field.id);
      addToast('success', `Đã xóa trường "${deleteModal.field.field_label}" thành công.`);
      setDeleteModal({ isOpen: false, field: null });
      fetchFields();
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Lỗi khi xóa trường tùy chỉnh.';
      addToast('error', errorMsg);
    }
  };

  const renderFieldTypeIcon = (type: string) => {
    switch (type) {
      case 'number':
        return <Hash size={14} color="#0891b2" />;
      case 'date':
        return <Calendar size={14} color="#f59e0b" />;
      case 'select':
        return <List size={14} color="#8b5cf6" />;
      default:
        return <Type size={14} color="#2563eb" />;
    }
  };

  const getFieldTypeLabel = (type: string): string => {
    switch (type) {
      case 'number':
        return 'Số';
      case 'date':
        return 'Ngày tháng';
      case 'select':
        return 'Danh sách chọn';
      default:
        return 'Văn bản';
    }
  };

  const fieldTypeSelectOptions: ICustomSelectOption<string>[] = [
    { value: 'text', label: 'Văn bản ngắn' },
    { value: 'number', label: 'Số / Tiền tệ' },
    { value: 'date', label: 'Ngày tháng' },
    { value: 'select', label: 'Danh sách lựa chọn' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div>
        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: isDark ? '#f8fafc' : '#0f172a',
            margin: 0,
          }}
        >
          Trình thiết kế Trường Tùy chỉnh
        </h2>
        <p
          style={{
            fontSize: '0.84rem',
            color: isDark ? '#94a3b8' : '#64748b',
            margin: '4px 0 0',
          }}
        >
          Khai báo các trường dữ liệu tùy biến (Văn bản, Số, Ngày tháng, Danh sách chọn) cho Khách hàng & Cơ hội bán hàng, tự động đồng bộ trên Biểu mẫu, Bộ lọc và Xuất Excel.
        </p>
      </div>

      {/* Entity Switcher Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
          paddingBottom: '8px',
        }}
      >
        <button
          type="button"
          onClick={() => setEntityType('customer')}
          style={{
            padding: '7px 16px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: entityType === 'customer' ? '#2563eb' : isDark ? '#1e293b' : '#f1f5f9',
            color: entityType === 'customer' ? '#ffffff' : isDark ? '#cbd5e1' : '#475569',
            fontSize: '0.84rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
          }}
        >
          Trường tùy chỉnh Khách hàng
        </button>
        <button
          type="button"
          onClick={() => setEntityType('deal')}
          style={{
            padding: '7px 16px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: entityType === 'deal' ? '#2563eb' : isDark ? '#1e293b' : '#f1f5f9',
            color: entityType === 'deal' ? '#ffffff' : isDark ? '#cbd5e1' : '#475569',
            fontSize: '0.84rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
          }}
        >
          Trường tùy chỉnh Cơ hội bán hàng
        </button>
      </div>

      {/* Main Grid: Left = Table of fields, Right = Dynamic Field Renderer Preview */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Configured Fields List */}
        <div
          style={{
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            borderRadius: '8px',
            border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
            boxShadow: isDark
              ? '0 1px 3px rgba(0, 0, 0, 0.4)'
              : '0 1px 3px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
              backgroundColor: isDark ? '#111827' : '#ffffff',
            }}
          >
            <span
              style={{
                fontSize: '0.86rem',
                fontWeight: 600,
                color: isDark ? '#f1f5f9' : '#334155',
              }}
            >
              Danh sách trường cấu hình ({fields.length})
            </span>
            <button
              type="button"
              onClick={handleOpenCreate}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.15s',
              }}
            >
              <Plus size={14} /> Thêm trường mới
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.82rem',
                textAlign: 'left',
              }}
            >
              <thead
                style={{
                  backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                  borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                }}
              >
                <tr>
                  <th style={{ padding: '10px 14px', color: isDark ? '#94a3b8' : '#64748b', whiteSpace: 'nowrap' }}>
                    Nhãn hiển thị
                  </th>
                  <th style={{ padding: '10px 14px', color: isDark ? '#94a3b8' : '#64748b', whiteSpace: 'nowrap' }}>
                    Mã trường
                  </th>
                  <th style={{ padding: '10px 14px', color: isDark ? '#94a3b8' : '#64748b', whiteSpace: 'nowrap' }}>
                    Kiểu dữ liệu
                  </th>
                  <th style={{ padding: '10px 14px', color: isDark ? '#94a3b8' : '#64748b', textAlign: 'center', whiteSpace: 'nowrap', minWidth: '100px' }}>
                    Bắt buộc
                  </th>
                  <th
                    style={{
                      padding: '10px 14px',
                      textAlign: 'right',
                      color: isDark ? '#94a3b8' : '#64748b',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: '28px',
                        textAlign: 'center',
                        color: isDark ? '#94a3b8' : '#64748b',
                      }}
                    >
                      Đang nạp trường tùy chỉnh...
                    </td>
                  </tr>
                ) : fields.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: '28px',
                        textAlign: 'center',
                        color: isDark ? '#64748b' : '#94a3b8',
                      }}
                    >
                      Chưa có trường tùy biến nào. Hãy nhấn "Thêm trường mới".
                    </td>
                  </tr>
                ) : (
                  fields.map((f) => (
                    <tr
                      key={f.id}
                      style={{
                        borderBottom: `1px solid ${isDark ? '#334155' : '#f1f5f9'}`,
                      }}
                    >
                      <td
                        style={{
                          padding: '10px 14px',
                          fontWeight: 500,
                          color: isDark ? '#f8fafc' : '#1e293b',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {f.field_label}
                      </td>
                      <td style={{ padding: '10px 14px', color: isDark ? '#cbd5e1' : '#64748b', whiteSpace: 'nowrap' }}>
                        <code
                          style={{
                            backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.78rem',
                          }}
                        >
                          {f.field_name}
                        </code>
                      </td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '0.78rem',
                            color: isDark ? '#e2e8f0' : '#334155',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {renderFieldTypeIcon(f.field_type)}
                          {getFieldTypeLabel(f.field_type)}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        {f.is_required ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              whiteSpace: 'nowrap',
                              padding: '3px 10px',
                              borderRadius: '999px',
                              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
                              color: isDark ? '#f87171' : '#dc2626',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                            }}
                          >
                            Bắt buộc
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              whiteSpace: 'nowrap',
                              padding: '3px 10px',
                              borderRadius: '999px',
                              backgroundColor: isDark ? 'rgba(100, 116, 139, 0.2)' : '#f1f5f9',
                              color: isDark ? '#94a3b8' : '#64748b',
                              fontSize: '0.74rem',
                            }}
                          >
                            Không
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(f)}
                            title="Chỉnh sửa trường"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: isDark ? '#60a5fa' : '#2563eb',
                              cursor: 'pointer',
                              padding: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                            }}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRequestDelete(f)}
                            title="Xóa trường"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: isDark ? '#f87171' : '#dc2626',
                              cursor: 'pointer',
                              padding: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Dynamic Field Renderer Preview */}
        <div
          style={{
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            borderRadius: '8px',
            border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
            boxShadow: isDark
              ? '0 1px 3px rgba(0, 0, 0, 0.4)'
              : '0 1px 3px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: isDark ? '#111827' : '#ffffff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Eye size={16} color="#2563eb" />
              <span
                style={{
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  color: isDark ? '#f1f5f9' : '#334155',
                }}
              >
                Khung xem trước Biểu mẫu Động
              </span>
            </div>

            {Object.keys(previewValues).length > 0 && (
              <button
                type="button"
                onClick={() => setPreviewValues({})}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'none',
                  border: 'none',
                  color: isDark ? '#94a3b8' : '#64748b',
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                }}
                title="Xóa giá trị đã nhập thử"
              >
                <RotateCcw size={12} />
                <span>Làm mới</span>
              </button>
            )}
          </div>

          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <span style={{ fontSize: '0.8rem', color: isDark ? '#94a3b8' : '#64748b' }}>
              Trình tạo biểu mẫu động tự động sinh các ô nhập theo đúng kiểu dữ liệu (Văn bản, Số, Ngày tháng, Danh sách chọn). Thử nhập dữ liệu trực tiếp dưới đây:
            </span>

            <CustomFieldRenderer
              fields={fields}
              values={previewValues}
              onChange={(fieldNameKey, val) =>
                setPreviewValues((prev) => ({ ...prev, [fieldNameKey]: val }))
              }
              layout="stack"
            />
          </div>
        </div>
      </div>

      {/* Modal Add / Edit Field */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(15, 23, 42, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          <div
            style={{
              backgroundColor: isDark ? '#111827' : '#ffffff',
              borderRadius: '8px',
              border: isDark ? '1px solid #1e293b' : 'none',
              width: '100%',
              maxWidth: '480px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: isDark
                ? '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
                : '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: isDark ? '#f8fafc' : '#0f172a',
                }}
              >
                {editingField ? 'Chỉnh sửa Trường tùy biến' : 'Thêm mới Trường tùy biến'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: isDark ? '#94a3b8' : '#64748b',
                  display: 'inline-flex',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: isDark ? '#cbd5e1' : '#475569',
                    marginBottom: '5px',
                  }}
                >
                  Tên nhãn hiển thị <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Mã số thuế doanh nghiệp, Ngân sách dự kiến"
                  value={fieldLabel}
                  onChange={(e) => setFieldLabel(e.target.value)}
                  style={{
                    width: '100%',
                    height: '38px',
                    padding: '0 12px',
                    borderRadius: '6px',
                    border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    fontSize: '0.84rem',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              {!editingField && (
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: isDark ? '#cbd5e1' : '#475569',
                      marginBottom: '5px',
                    }}
                  >
                    Mã trường kỹ thuật
                  </label>
                  <input
                    type="text"
                    placeholder="ma_so_thue, ngan_sach (tự động tạo nếu để trống)"
                    value={fieldName}
                    onChange={(e) => setFieldName(e.target.value)}
                    style={{
                      width: '100%',
                      height: '38px',
                      padding: '0 12px',
                      borderRadius: '6px',
                      border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                      backgroundColor: isDark ? '#1e293b' : '#ffffff',
                      color: isDark ? '#f8fafc' : '#0f172a',
                      fontSize: '0.84rem',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: '0.74rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                    Dùng làm định danh cột khi xuất Excel và liên kết hệ thống
                  </span>
                </div>
              )}

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: isDark ? '#cbd5e1' : '#475569',
                    marginBottom: '5px',
                  }}
                >
                  Kiểu dữ liệu <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <CustomSelect
                  value={fieldType}
                  options={fieldTypeSelectOptions}
                  onChange={(val) => setFieldType(val as 'text' | 'number' | 'date' | 'select')}
                  height="38px"
                />
              </div>

              {fieldType === 'select' && (
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: isDark ? '#cbd5e1' : '#475569',
                      marginBottom: '5px',
                    }}
                  >
                    Các tùy chọn (Phân cách bằng dấu phẩy) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Lựa chọn 1, Lựa chọn 2, Lựa chọn 3"
                    value={optionsStr}
                    onChange={(e) => setOptionsStr(e.target.value)}
                    style={{
                      width: '100%',
                      height: '38px',
                      padding: '0 12px',
                      borderRadius: '6px',
                      border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                      backgroundColor: isDark ? '#1e293b' : '#ffffff',
                      color: isDark ? '#f8fafc' : '#0f172a',
                      fontSize: '0.84rem',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>
              )}

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: isDark ? '#cbd5e1' : '#475569',
                    marginBottom: '5px',
                  }}
                >
                  Giá trị mặc định (Tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="Để trống nếu không có giá trị mặc định"
                  value={defaultValue}
                  onChange={(e) => setDefaultValue(e.target.value)}
                  style={{
                    width: '100%',
                    height: '38px',
                    padding: '0 12px',
                    borderRadius: '6px',
                    border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    fontSize: '0.84rem',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  id="isRequiredField"
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label
                  htmlFor="isRequiredField"
                  style={{
                    fontSize: '0.84rem',
                    color: isDark ? '#cbd5e1' : '#334155',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  Bắt buộc nhập trên biểu mẫu
                </label>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  marginTop: '10px',
                  borderTop: `1px solid ${isDark ? '#1e293b' : '#f1f5f9'}`,
                  paddingTop: '14px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '6px',
                    border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    color: isDark ? '#cbd5e1' : '#475569',
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                  }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '7px 18px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {editingField ? 'Lưu cập nhật' : 'Tạo trường mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Xác nhận xóa trường tùy chỉnh"
        message={`Bạn có chắc chắn muốn xóa trường "${deleteModal.field?.field_label}"? Các dữ liệu đã lưu trữ tương ứng trong Khách hàng / Cơ hội và file xuất Excel có thể bị ảnh hưởng.`}
        confirmLabel="Xóa vĩnh viễn"
        cancelLabel="Hủy bỏ"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, field: null })}
      />

      {/* Toast Notification Container in bottom-right corner */}
      <ToastNotification toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
};
