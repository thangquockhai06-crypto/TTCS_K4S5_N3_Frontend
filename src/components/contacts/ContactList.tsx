import React from 'react';
import {
  ArrowRightLeft,
  Building,
  Edit2,
  History,
  Mail,
  Phone,
  Plus,
  Star,
  Trash2,
  Users,
} from 'lucide-react';
import { IContact } from '../../interfaces/contact.interface';
import { Avatar, Badge, Button } from '../common';
import { ContactCard } from './ContactCard';
import { ContactRoleBadge } from './ContactRoleBadge';
import styles from './ContactList.module.css';

export interface IContactListProps {
  contacts: IContact[];
  viewMode: 'grid' | 'table';
  onEdit: (contact: IContact) => void;
  onDelete: (contactId: string) => void;
  onTransfer: (contact: IContact) => void;
  onViewHistory: (contact: IContact) => void;
  onSetPrimary: (contactId: string, customerId: string) => void;
  onAddNew: () => void;
}

export const ContactList: React.FC<IContactListProps> = ({
  contacts,
  viewMode,
  onEdit,
  onDelete,
  onTransfer,
  onViewHistory,
  onSetPrimary,
  onAddNew,
}) => {
  if (contacts.length === 0) {
    return (
      <div className={styles.emptyContactsState}>
        <div className={styles.emptyContactsState__icon}>
          <Users size={28} />
        </div>
        <h3 className={styles.emptyContactsState__title}>Không tìm thấy người liên hệ phù hợp</h3>
        <p className={styles.emptyContactsState__desc}>
          Không có nhân sự nào khớp với điều kiện tìm kiếm hoặc bộ lọc vai trò hiện tại. Hãy thử thay đổi bộ lọc hoặc thêm người liên hệ mới.
        </p>
        <Button variant="primary" leftIcon={<Plus size={16} />} onClick={onAddNew}>
          Thêm Người liên hệ mới
        </Button>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className={styles.contactsGrid}>
        {contacts.map((contact) => (
          <ContactCard
            key={contact.id}
            contact={contact}
            onEdit={onEdit}
            onDelete={onDelete}
            onTransfer={onTransfer}
            onViewHistory={onViewHistory}
            onSetPrimary={onSetPrimary}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.contactsTable} aria-label="Danh sách người liên hệ và vai trò quyết định mua">
        <thead>
          <tr>
            <th>Người liên hệ</th>
            <th>Khách hàng / Doanh nghiệp</th>
            <th>Chức danh & Phòng ban</th>
            <th>Vai trò Quyết định Mua</th>
            <th>Thông tin liên hệ</th>
            <th>Lịch sử chuyển</th>
            <th style={{ textAlign: 'right' }}>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => (
            <tr key={contact.id}>
              <td>
                <div className={styles.tableUserCell}>
                  <Avatar src={contact.avatarUrl} name={contact.fullName} size="md" />
                  <div className={styles.tableUserInfo}>
                    <span className={styles.tableUserName}>
                      {contact.fullName}
                      {contact.isPrimary && (
                        <Badge tone="warning" size="sm">
                          ⭐ Đầu mối chính
                        </Badge>
                      )}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Cập nhật: {new Date(contact.updatedAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
              </td>

              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                  <Building size={14} color="#2563eb" />
                  <span>{contact.companyName}</span>
                </div>
              </td>

              <td>
                <div>
                  <div style={{ fontWeight: 600 }}>{contact.jobTitle}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {contact.department || 'Chung'}
                  </div>
                </div>
              </td>

              <td>
                <ContactRoleBadge role={contact.roleInBuying} size="sm" showSubtitle />
              </td>

              <td>
                <div className={styles.tableContactInfo}>
                  <a href={`mailto:${contact.email}`}>
                    <Mail size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    {contact.email}
                  </a>
                  <a href={`tel:${contact.phone}`}>
                    <Phone size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    {contact.phone}
                  </a>
                </div>
              </td>

              <td>
                {(contact.transferHistory?.length || 0) > 0 ? (
                  <button
                    type="button"
                    className={styles.tableActionBtn}
                    onClick={() => onViewHistory(contact)}
                    style={{ borderColor: '#bfdbfe', color: '#2563eb' }}
                  >
                    <History size={12} /> {contact.transferHistory.length} lần
                  </button>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Chưa chuyển</span>
                )}
              </td>

              <td style={{ textAlign: 'right' }}>
                <div className={styles.tableActions} style={{ justifyContent: 'flex-end' }}>
                  {!contact.isPrimary && (
                    <button
                      type="button"
                      className={styles.tableActionBtn}
                      onClick={() => onSetPrimary(contact.id, contact.customerId)}
                      title="Đặt làm đầu mối chính"
                    >
                      <Star size={12} /> Đầu mối
                    </button>
                  )}

                  <button
                    type="button"
                    className={styles.tableActionBtn}
                    onClick={() => onTransfer(contact)}
                    style={{ color: '#2563eb' }}
                    title="Chuyển sang doanh nghiệp khác"
                  >
                    <ArrowRightLeft size={12} /> Chuyển
                  </button>

                  <button
                    type="button"
                    className={styles.tableActionBtn}
                    onClick={() => onEdit(contact)}
                    title="Chỉnh sửa"
                  >
                    <Edit2 size={12} />
                  </button>

                  <button
                    type="button"
                    className={styles.tableActionBtn}
                    onClick={() => {
                      if (window.confirm(`Xóa người liên hệ ${contact.fullName}?`)) {
                        onDelete(contact.id);
                      }
                    }}
                    style={{ color: '#e11d48' }}
                    title="Xóa"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
