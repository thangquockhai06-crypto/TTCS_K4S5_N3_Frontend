import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  Mail,
  Phone,
  ArrowRightLeft,
  Edit2,
  Trash2,
  Star,
} from 'lucide-react';
import { ICustomerContact, ICreateContactDTO, ICustomer } from '../../interfaces';
import { customerService } from '../../services/customerService';
import { Button, Input, Modal } from '../common';

interface IContactListTabProps {
  customerId: string;
  customerName?: string;
  onContactChanged?: () => void;
}

const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Decider: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' }, // Người quyết định
  Influencer: { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE' }, // Người ảnh hưởng
  Buyer: { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' }, // Người mua hàng
  Gatekeeper: { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' }, // Người gác cổng
  User: { bg: '#F3F4F6', text: '#374151', border: '#E5E7EB' }, // Người dùng trực tiếp
};

export const ContactListTab: React.FC<IContactListTabProps> = ({
  customerId,
  customerName: _customerName,
  onContactChanged,
}) => {
  const [contacts, setContacts] = useState<ICustomerContact[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Add / Edit Modal state
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingContact, setEditingContact] = useState<ICustomerContact | null>(null);
  const [formData, setFormData] = useState<ICreateContactDTO>({
    fullName: '',
    email: '',
    phone: '',
    position: '',
    role: 'Decider',
    isPrimary: false,
    isActive: true,
    notes: '',
  });

  // Transfer Modal state
  const [transferringContact, setTransferringContact] = useState<ICustomerContact | null>(null);
  const [allCustomers, setAllCustomers] = useState<ICustomer[]>([]);
  const [targetCustomerId, setTargetCustomerId] = useState<string>('');
  const [transferReason, setTransferReason] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState<boolean>(false);
  const [transferError, setTransferError] = useState<string | null>(null);

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const data = await customerService.getContacts(customerId);
      setContacts(data);
      setError(null);
    } catch (err: any) {
      setError('Không thể tải danh sách người liên hệ.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [customerId]);

  const handleOpenCreate = () => {
    setEditingContact(null);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      position: '',
      role: 'Decider',
      isPrimary: contacts.length === 0,
      isActive: true,
      notes: '',
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (contact: ICustomerContact) => {
    setEditingContact(contact);
    setFormData({
      fullName: contact.fullName,
      email: contact.email || '',
      phone: contact.phone || '',
      position: contact.position || '',
      role: contact.role,
      isPrimary: contact.isPrimary,
      isActive: contact.isActive,
      notes: contact.notes || '',
    });
    setIsFormOpen(true);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) return;

    try {
      if (editingContact) {
        await customerService.updateContact(editingContact.id, formData);
      } else {
        await customerService.createContact(customerId, formData);
      }
      setIsFormOpen(false);
      fetchContacts();
      onContactChanged?.();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Lỗi khi lưu người liên hệ');
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa người liên hệ này?')) return;
    try {
      await customerService.deleteContact(contactId);
      fetchContacts();
      onContactChanged?.();
    } catch (err: any) {
      alert('Không thể xóa người liên hệ');
    }
  };

  // Open Transfer Modal
  const handleOpenTransfer = async (contact: ICustomerContact) => {
    setTransferringContact(contact);
    setTargetCustomerId('');
    setTransferReason('');
    setTransferError(null);
    try {
      const list = await customerService.getCustomers({ limit: 200 });
      // Loại bỏ chính công ty hiện tại
      setAllCustomers(list.filter((c) => c.id !== customerId));
    } catch (err) {
      // ignore
    }
  };

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferringContact || !targetCustomerId) {
      setTransferError('Vui lòng chọn doanh nghiệp nhận người liên hệ.');
      return;
    }

    setIsTransferring(true);
    setTransferError(null);
    try {
      await customerService.transferContact(
        transferringContact.id,
        targetCustomerId,
        transferReason || 'Điều chuyển công tác nội bộ'
      );
      setTransferringContact(null);
      fetchContacts();
      onContactChanged?.();
      alert(`Đã điều chuyển thành công người liên hệ ${transferringContact.fullName}.`);
    } catch (err: any) {
      setTransferError(err.response?.data?.detail || 'Không thể điều chuyển người liên hệ.');
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
            Danh sách Người liên hệ ({contacts.length})
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#6B7280' }}>
            Quản lý những người nắm giữ vai trò ra quyết định và mua hàng tại doanh nghiệp.
          </p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={15} />} onClick={handleOpenCreate}>
          Thêm người liên hệ
        </Button>
      </div>

      {isLoading ? (
        <div style={{ padding: '32px', textAlign: 'center', color: '#6B7280' }}>Đang nạp dữ liệu người liên hệ...</div>
      ) : error ? (
        <div style={{ padding: '16px', backgroundColor: '#FEF2F2', color: '#DC2626', borderRadius: '8px' }}>
          {error}
        </div>
      ) : contacts.length === 0 ? (
        <div
          style={{
            padding: '36px',
            textAlign: 'center',
            backgroundColor: '#F9FAFB',
            borderRadius: '10px',
            border: '1px dashed #D1D5DB',
          }}
        >
          <UserCheck size={36} style={{ color: '#9CA3AF', margin: '0 auto 12px' }} />
          <h4 style={{ margin: '0 0 6px', fontSize: '15px' }}>Chưa có người liên hệ nào</h4>
          <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#6B7280' }}>
            Thêm các đầu mối liên hệ (Decider, Influencer, Buyer) để quản lý tương tác và cơ hội bán hàng.
          </p>
          <Button variant="secondary" onClick={handleOpenCreate}>
            Thêm liên hệ đầu tiên
          </Button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
          {contacts.map((contact) => {
            const roleStyle = ROLE_COLORS[contact.role] || ROLE_COLORS.User;
            return (
              <div
                key={contact.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '10px',
                  border: '1px solid #E5E7EB',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  position: 'relative',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: '#E0E7FF',
                        color: '#4338CA',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '14px',
                      }}
                    >
                      {contact.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 600, fontSize: '15px', color: '#111827' }}>
                          {contact.fullName}
                        </span>
                        {contact.isPrimary && (
                          <span
                            title="Người liên hệ chính"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              color: '#F59E0B',
                            }}
                          >
                            <Star size={14} fill="#F59E0B" />
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '13px', color: '#6B7280' }}>
                        {contact.position || 'Chưa cập nhật chức vụ'}
                      </span>
                    </div>
                  </div>

                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      fontWeight: 600,
                      backgroundColor: roleStyle.bg,
                      color: roleStyle.text,
                      border: `1px solid ${roleStyle.border}`,
                    }}
                  >
                    {contact.role}
                  </span>
                </div>

                {/* Contact info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                  {contact.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#374151' }}>
                      <Phone size={14} style={{ color: '#9CA3AF' }} />
                      <a href={`tel:${contact.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {contact.phone}
                      </a>
                    </div>
                  )}
                  {contact.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#374151' }}>
                      <Mail size={14} style={{ color: '#9CA3AF' }} />
                      <a href={`mailto:${contact.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {contact.email}
                      </a>
                    </div>
                  )}
                </div>

                {contact.notes && (
                  <p style={{ margin: 0, fontSize: '12px', color: '#6B7280', fontStyle: 'italic' }}>
                    "{contact.notes}"
                  </p>
                )}

                {/* Actions */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid #F3F4F6',
                    paddingTop: '10px',
                    marginTop: 'auto',
                  }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<ArrowRightLeft size={13} />}
                    onClick={() => handleOpenTransfer(contact)}
                    title="Chuyển công tác sang doanh nghiệp khác"
                  >
                    Chuyển công ty
                  </Button>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(contact)}
                      title="Sửa thông tin"
                    >
                      <Edit2 size={13} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteContact(contact.id)}
                      title="Xóa liên hệ"
                    >
                      <Trash2 size={13} style={{ color: '#EF4444' }} />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Thêm / Sửa Người liên hệ */}
      {isFormOpen && (
        <Modal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          title={editingContact ? 'Chỉnh sửa Người liên hệ' : 'Thêm Người liên hệ mới'}
        >
          <form onSubmit={handleSaveContact} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <Input
                label="Họ và tên *"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="VD: Trần Thị Mai Phương"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <Input
                  label="Số điện thoại"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="VD: 0988776655"
                />
              </div>
              <div>
                <Input
                  label="Email công việc"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="VD: phuong.tran@corp.vn"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <Input
                  label="Chức vụ"
                  value={formData.position || ''}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="VD: Giám đốc CNTT (CIO)"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Vai trò mua hàng (Purchasing Role)
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '14px',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <option value="Decider">Decider (Người quyết định cuối cùng)</option>
                  <option value="Influencer">Influencer (Người có ảnh hưởng chuyên môn)</option>
                  <option value="Buyer">Buyer (Người phụ trách mua sắm / hợp đồng)</option>
                  <option value="Gatekeeper">Gatekeeper (Người gác cổng / trợ lý)</option>
                  <option value="User">User (Người sử dụng trực tiếp)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <input
                type="checkbox"
                id="isPrimary"
                checked={formData.isPrimary}
                onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
              />
              <label htmlFor="isPrimary" style={{ fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                Đặt làm Người liên hệ chính của doanh nghiệp
              </label>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Ghi chú thêm
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Ghi chú về sở thích, phong cách làm việc, thời gian liên hệ thuận tiện..."
                rows={2}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <Button variant="secondary" type="button" onClick={() => setIsFormOpen(false)}>
                Hủy bỏ
              </Button>
              <Button variant="primary" type="submit">
                {editingContact ? 'Lưu thay đổi' : 'Thêm liên hệ'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: Điều chuyển người liên hệ sang doanh nghiệp khác */}
      {transferringContact && (
        <Modal
          isOpen={Boolean(transferringContact)}
          onClose={() => setTransferringContact(null)}
          title="Điều chuyển Người liên hệ sang Doanh nghiệp mới"
        >
          <form onSubmit={handleExecuteTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                padding: '12px 14px',
                backgroundColor: '#EFF6FF',
                borderRadius: '8px',
                border: '1px solid #BFDBFE',
                fontSize: '13px',
                color: '#1E40AF',
              }}
            >
              Bạn đang chuyển người liên hệ <strong>{transferringContact.fullName}</strong> ({transferringContact.position || transferringContact.role}) từ doanh nghiệp hiện tại sang doanh nghiệp mới. Toàn bộ thông tin lịch sử liên hệ sẽ được bảo toàn.
            </div>

            {transferError && (
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#FEF2F2',
                  color: '#DC2626',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              >
                {transferError}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Chọn Doanh nghiệp mới tiếp nhận <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select
                value={targetCustomerId}
                onChange={(e) => setTargetCustomerId(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  fontSize: '14px',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <option value="">-- Chọn khách hàng doanh nghiệp --</option>
                {allCustomers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company || c.fullName} {c.taxCode ? `(MST: ${c.taxCode})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Input
                label="Lý do điều chuyển"
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                placeholder="VD: Chuyển công tác sang công ty thành viên, thay đổi vai trò..."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <Button
                variant="secondary"
                type="button"
                onClick={() => setTransferringContact(null)}
                disabled={isTransferring}
              >
                Hủy bỏ
              </Button>
              <Button
                variant="primary"
                type="submit"
                isLoading={isTransferring}
                leftIcon={<ArrowRightLeft size={15} />}
              >
                Xác nhận điều chuyển
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
