import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  AlertCircle,
  Type,
  Hash,
  Calendar,
  List,
  Eye,
  X,
  Save,
} from 'lucide-react';
import { ICustomField } from '../../interfaces';
import { sprint2Service } from '../../services/sprint2Service';
import { showGlobalToast } from '../../context/ToastContext';

export const CustomFieldBuilder: React.FC = () => {
  const [entityType, setEntityType] = useState<'customer' | 'deal'>('customer');
  const [fields, setFields] = useState<ICustomField[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<ICustomField | null>(null);
  const [fieldName, setFieldName] = useState('');
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState<'text' | 'number' | 'date' | 'select'>('text');
  const [optionsStr, setOptionsStr] = useState('');
  const [isRequired, setIsRequired] = useState(false);

  // Interactive dynamic preview values state
  const [previewValues, setPreviewValues] = useState<Record<string, string>>({});
  const [isValueSaving, setIsValueSaving] = useState(false);
  const [valueMsg, setValueMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchFields = useCallback(async () => {
    setIsLoading(true);
    setStatusMsg(null);
    setValueMsg(null);
    try {
      const data = await sprint2Service.getCustomFields(entityType);
      setFields(data);
      // Load saved values from backend
      try {
        const valRes = await sprint2Service.getCustomFieldValues(entityType);
        if (valRes && valRes.values) {
          setPreviewValues(valRes.values);
        } else {
          setPreviewValues({});
        }
      } catch {
        // Fallback: initialize empty
        setPreviewValues({});
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Không thể tải danh sách trường tùy chỉnh.' });
    } finally {
      setIsLoading(false);
    }
  }, [entityType]);

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  const handleOpenCreate = () => {
    setEditingField(null);
    setFieldName('');
    setFieldLabel('');
    setFieldType('text');
    setOptionsStr('');
    setIsRequired(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (f: ICustomField) => {
    setEditingField(f);
    setFieldName(f.field_name);
    setFieldLabel(f.field_label);
    setFieldType(f.field_type);
    setOptionsStr(f.options || '');
    setIsRequired(f.is_required);
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmedLabel = fieldLabel.trim();
    if (!trimmedLabel) {
      setStatusMsg({ type: 'error', text: 'Vui lòng nhập tên nhãn hiển thị.' });
      showGlobalToast('Vui lòng nhập tên nhãn hiển thị.', 'warning');
      return;
    }

    setIsSubmitting(true);
    setStatusMsg(null);
    try {
      if (editingField) {
        await sprint2Service.updateCustomField(editingField.id, {
          field_label: trimmedLabel,
          field_type: fieldType,
          options: fieldType === 'select' ? optionsStr.trim() : undefined,
          is_required: isRequired,
        });
        const msg = `Cập nhật trường dữ liệu "${trimmedLabel}" thành công!`;
        setStatusMsg({ type: 'success', text: msg });
        showGlobalToast(msg, 'success');
      } else {
        const generatedName = fieldName.trim()
          ? fieldName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')
          : trimmedLabel.toLowerCase().replace(/[^a-z0-9_]/g, '_');

        await sprint2Service.createCustomField({
          entity_type: entityType,
          field_name: generatedName,
          field_label: trimmedLabel,
          field_type: fieldType,
          options: fieldType === 'select' ? optionsStr.trim() : undefined,
          is_required: isRequired,
        });
        const msg = `Thêm trường tùy chỉnh "${trimmedLabel}" thành công!`;
        setStatusMsg({ type: 'success', text: msg });
        showGlobalToast(msg, 'success');
      }
      setIsModalOpen(false);
      fetchFields();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Lỗi lưu trường dữ liệu.';
      setStatusMsg({ type: 'error', text: errorMsg });
      showGlobalToast(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (f: ICustomField) => {
    if (isSubmitting) return;
    if (!window.confirm(`Bạn có chắc muốn xóa trường "${f.field_label}"? Các dữ liệu đã nhập trước đó có thể bị ảnh hưởng.`)) {
      return;
    }

    setIsSubmitting(true);
    setStatusMsg(null);
    try {
      await sprint2Service.deleteCustomField(f.id);
      const msg = `Đã xóa trường tùy chỉnh "${f.field_label}" thành công.`;
      setStatusMsg({ type: 'success', text: msg });
      showGlobalToast(msg, 'success');
      fetchFields();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Lỗi khi xóa trường tùy chỉnh.';
      setStatusMsg({ type: 'error', text: errorMsg });
      showGlobalToast(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDynamicValues = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isValueSaving) return;

    setValueMsg(null);

    // Frontend validation
    for (const f of fields) {
      const rawVal = previewValues[f.field_name];
      const val = rawVal !== undefined ? String(rawVal).trim() : '';

      if (f.is_required && !val) {
        const warn = `Trường bắt buộc "${f.field_label}" chưa được nhập giá trị.`;
        setValueMsg({
          type: 'error',
          text: warn,
        });
        showGlobalToast(warn, 'warning');
        return;
      }

      if (val && f.field_type === 'number') {
        if (isNaN(Number(val))) {
          const warn = `Trường "${f.field_label}" yêu cầu kiểu số hợp lệ (hiện tại: "${val}").`;
          setValueMsg({
            type: 'error',
            text: warn,
          });
          showGlobalToast(warn, 'warning');
          return;
        }
      }

      if (val && f.field_type === 'date') {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(val) || isNaN(Date.parse(val))) {
          const warn = `Trường "${f.field_label}" yêu cầu định dạng ngày hợp lệ YYYY-MM-DD.`;
          setValueMsg({
            type: 'error',
            text: warn,
          });
          showGlobalToast(warn, 'warning');
          return;
        }
      }

      if (val && f.field_type === 'select' && f.options) {
        const allowedOptions = f.options.split(',').map((o) => o.trim());
        if (!allowedOptions.includes(val)) {
          const warn = `Giá trị "${val}" của trường "${f.field_label}" không nằm trong danh sách lựa chọn hợp lệ.`;
          setValueMsg({
            type: 'error',
            text: warn,
          });
          showGlobalToast(warn, 'warning');
          return;
        }
      }
    }

    setIsValueSaving(true);
    try {
      const res = await sprint2Service.saveCustomFieldValues({
        entity_type: entityType,
        entity_id: 'sample',
        values: previewValues,
      });
      const msg = res.message || 'Đã lưu và xác thực thành công các giá trị trường tùy chỉnh!';
      setValueMsg({
        type: 'success',
        text: msg,
      });
      showGlobalToast(msg, 'success');
      if (res.values) {
        setPreviewValues(res.values);
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Lỗi khi lưu giá trị trường tùy biến.';
      setValueMsg({ type: 'error', text: errorMsg });
      showGlobalToast(errorMsg, 'error');
    } finally {
      setIsValueSaving(false);
    }
  };

  const renderFieldTypeIcon = (type: string) => {
    switch (type) {
      case 'number':
        return <Hash size={13} color="#0891b2" />;
      case 'date':
        return <Calendar size={13} color="#f59e0b" />;
      case 'select':
        return <List size={13} color="#8b5cf6" />;
      default:
        return <Type size={13} color="#2563eb" />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
          Trình thiết kế Trường Tùy chỉnh
        </h2>
        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0' }}>
          Tạo các trường dữ liệu tùy biến (Text, Number, Date, Select) và xem trước trực quan cơ chế hiển thị trên form khách hàng / cơ hội
        </p>
      </div>

      {/* Entity switcher */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
        <button
          type="button"
          onClick={() => setEntityType('customer')}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: entityType === 'customer' ? '#2563eb' : '#f1f5f9',
            color: entityType === 'customer' ? '#ffffff' : '#475569',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Trường mở rộng Khách hàng (Customer Fields)
        </button>
        <button
          type="button"
          onClick={() => setEntityType('deal')}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: entityType === 'deal' ? '#2563eb' : '#f1f5f9',
            color: entityType === 'deal' ? '#ffffff' : '#475569',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Trường mở rộng Cơ hội bán hàng (Deal Fields)
        </button>
      </div>

      {statusMsg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            backgroundColor: statusMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${statusMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            borderRadius: '6px',
            color: statusMsg.type === 'success' ? '#166534' : '#991b1b',
            fontSize: '0.82rem',
          }}
        >
          {statusMsg.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Main Grid: Left = Table of fields, Right = Dynamic Field Renderer Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {/* Left: Fields List */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              borderBottom: '1px solid #e2e8f0',
            }}
          >
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
              Danh sách trường cấu hình ({fields.length})
            </span>
            <button
              type="button"
              onClick={handleOpenCreate}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 10px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Plus size={13} /> Thêm trường
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '8px 12px', color: '#64748b' }}>Nhãn (Label)</th>
                <th style={{ padding: '8px 12px', color: '#64748b' }}>Mã trường</th>
                <th style={{ padding: '8px 12px', color: '#64748b' }}>Kiểu dữ liệu</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', color: '#64748b' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                    Đang nạp trường tùy chỉnh...
                  </td>
                </tr>
              ) : fields.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                    Chưa có trường tùy biến nào.
                  </td>
                </tr>
              ) : (
                fields.map((f) => (
                  <tr key={f.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 500, color: '#1e293b' }}>
                      {f.field_label}
                      {f.is_required && <span style={{ color: '#dc2626', marginLeft: '2px' }}>*</span>}
                    </td>
                    <td style={{ padding: '8px 12px', color: '#64748b' }}>
                      <code>{f.field_name}</code>
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          textTransform: 'capitalize',
                          fontSize: '0.75rem',
                          color: '#334155',
                        }}
                      >
                        {renderFieldTypeIcon(f.field_type)}
                        {f.field_type}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(f)}
                          disabled={isSubmitting}
                          style={{ background: 'none', border: 'none', color: '#2563eb', cursor: isSubmitting ? 'not-allowed' : 'pointer', padding: '2px' }}
                          title="Chỉnh sửa"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(f)}
                          disabled={isSubmitting}
                          style={{ background: 'none', border: 'none', color: '#dc2626', cursor: isSubmitting ? 'not-allowed' : 'pointer', padding: '2px' }}
                          title="Xóa trường"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Right: Dynamic Field Renderer Preview */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Eye size={15} color="#2563eb" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                Khung xem trước Form Động (Dynamic Field Renderer)
              </span>
            </div>
          </div>

          <form onSubmit={handleSaveDynamicValues} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Các trường tùy chỉnh sẽ tự động hiển thị trong chi tiết {entityType === 'customer' ? 'Khách hàng' : 'Cơ hội'} tương ứng. Nhập dữ liệu để kiểm tra xác thực và lưu:
            </span>

            {valueMsg && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  backgroundColor: valueMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
                  border: `1px solid ${valueMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                  borderRadius: '6px',
                  color: valueMsg.type === 'success' ? '#166534' : '#991b1b',
                  fontSize: '0.78rem',
                }}
              >
                {valueMsg.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                <span>{valueMsg.text}</span>
              </div>
            )}

            {fields.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
                Chưa có trường dữ liệu nào. Hãy thêm trường mới ở bên trái.
              </div>
            ) : (
              fields.map((f) => (
                <div key={`preview-field-${f.id}`} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>
                    {f.field_label} {f.is_required && <span style={{ color: '#dc2626' }}>*</span>}
                  </label>

                  {f.field_type === 'text' && (
                    <input
                      type="text"
                      placeholder={`Nhập ${f.field_label.toLowerCase()}...`}
                      value={previewValues[f.field_name] || ''}
                      onChange={(e) => setPreviewValues({ ...previewValues, [f.field_name]: e.target.value })}
                      style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                    />
                  )}

                  {f.field_type === 'number' && (
                    <input
                      type="number"
                      placeholder="0"
                      value={previewValues[f.field_name] || ''}
                      onChange={(e) => setPreviewValues({ ...previewValues, [f.field_name]: e.target.value })}
                      style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                    />
                  )}

                  {f.field_type === 'date' && (
                    <input
                      type="date"
                      value={previewValues[f.field_name] || ''}
                      onChange={(e) => setPreviewValues({ ...previewValues, [f.field_name]: e.target.value })}
                      style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                    />
                  )}

                  {f.field_type === 'select' && (
                    <select
                      value={previewValues[f.field_name] || ''}
                      onChange={(e) => setPreviewValues({ ...previewValues, [f.field_name]: e.target.value })}
                      style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                    >
                      <option value="">-- Chọn {f.field_label.toLowerCase()} --</option>
                      {(f.options ? f.options.split(',') : []).map((opt) => (
                        <option key={opt.trim()} value={opt.trim()}>
                          {opt.trim()}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ))
            )}

            {fields.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  type="submit"
                  disabled={isValueSaving}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: isValueSaving ? 'not-allowed' : 'pointer',
                  }}
                >
                  <Save size={14} />
                  {isValueSaving ? 'Đang xác thực & lưu...' : 'Lưu & Kiểm tra giá trị Form Động'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Modal Add / Edit Field */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '460px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                {editingField ? 'Chỉnh sửa Trường tùy biến' : 'Thêm mới Trường tùy biến'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Tên nhãn hiển thị (Field Label) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Mã số thuế doanh nghiệp"
                  value={fieldLabel}
                  onChange={(e) => setFieldLabel(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                />
              </div>

              {!editingField && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Tên biến kỹ thuật (Field Name) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="tax_code"
                    value={fieldName}
                    onChange={(e) => setFieldName(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Kiểu dữ liệu (Field Type) *
                </label>
                <select
                  value={fieldType}
                  onChange={(e) => setFieldType(e.target.value as 'text' | 'number' | 'date' | 'select')}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                >
                  <option value="text">Văn bản ngắn (Text)</option>
                  <option value="number">Số / Tiền tệ (Number)</option>
                  <option value="date">Ngày tháng (Date)</option>
                  <option value="select">Danh sách lựa chọn (Select Dropdown)</option>
                </select>
              </div>

              {fieldType === 'select' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Các tùy chọn (Phân cách bằng dấu phẩy) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Loại A, Loại B, Loại C"
                    value={optionsStr}
                    onChange={(e) => setOptionsStr(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="isRequiredField"
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                />
                <label htmlFor="isRequiredField" style={{ fontSize: '0.8rem', color: '#334155', cursor: 'pointer' }}>
                  Bắt buộc nhập (Required)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ padding: '6px 14px', borderRadius: '4px', border: 'none', backgroundColor: '#2563eb', color: '#ffffff', fontSize: '0.8rem', fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
                >
                  {isSubmitting ? 'Đang lưu...' : 'Lưu cấu hình'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
