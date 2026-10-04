import React, { useState } from 'react';
import {
  Building2,
  Check,
  Copy,
  DollarSign,
  ExternalLink,
  Globe,
  HeartHandshake,
  Mail,
  MapPin,
  Phone,
  Tag,
  UserCheck,
  Sliders,
} from 'lucide-react';
import { ICustomer } from '../../interfaces';
import { formatCurrency } from '../../utils/formatters';
import { Avatar, Badge, Button, Card } from '../common';
import { getCustomerStatusLabel, getCustomerStatusTone } from './CustomerCard';
import styles from './CustomerDetailPanel.module.css';

export interface ICustomerDetailPanelProps {
  customer: ICustomer;
  onOpenFullProfile?: () => void;
}

export const CustomerDetailPanel: React.FC<ICustomerDetailPanelProps> = ({
  customer,
  onOpenFullProfile,
}) => {
  const [copiedField, setCopiedField] = useState<'email' | 'phone' | null>(null);

  const handleCopy = (field: 'email' | 'phone', text: string): void => {
    void navigator.clipboard?.writeText(text);
    setCopiedField(field);
    window.setTimeout(() => setCopiedField(null), 1500);
  };

  return (
    <aside className={styles.inspectorPanel} aria-label="Thông tin chi tiết khách hàng">
      {/* Thẻ Giá trị Hợp đồng ARR */}
      <Card padding="md" className={styles.dealValueCard}>
        <div className={styles.dealValueCard__top}>
          <span className={styles.dealValueCard__label}>
            <DollarSign size={14} /> DOANH THU ĐỊNH KỲ HÀNG NĂM (ARR)
          </span>
          <Badge tone={getCustomerStatusTone(customer.status)} dot size="sm">
            {getCustomerStatusLabel(customer.status)}
          </Badge>
        </div>

        <strong className={`${styles.dealValueCard__amount} tabular-nums`}>
          {formatCurrency(customer.dealValue)}
        </strong>

        <div className={styles.dealValueCard__metaGrid}>
          <div>
            <span>Xác suất thành công</span>
            <strong className="tabular-nums">{customer.arrProbability}%</strong>
          </div>
          <div>
            <span>Điểm sức khỏe</span>
            <strong className="tabular-nums">{customer.healthScore}/100</strong>
          </div>
          <div>
            <span>Lịch hẹn kế tiếp</span>
            <strong>{customer.nextFollowUp}</strong>
          </div>
        </div>
      </Card>

      {/* Thẻ Liên hệ Chính */}
      <Card padding="md" className={styles.panelSection}>
        <h3 className={styles.panelSection__heading}>Thông tin Liên hệ</h3>

        <div className={styles.contactList}>
          <div className={styles.contactItem}>
            <Mail size={15} className={styles.contactItem__icon} />
            <div className={styles.contactItem__body}>
              <span className={styles.contactItem__label}>Email công việc</span>
              <span className={styles.contactItem__value}>{customer.email}</span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy('email', customer.email)}
              className={styles.contactItem__copyBtn}
              aria-label="Sao chép địa chỉ email"
              title="Sao chép Email"
            >
              {copiedField === 'email' ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>

          <div className={styles.contactItem}>
            <Phone size={15} className={styles.contactItem__icon} />
            <div className={styles.contactItem__body}>
              <span className={styles.contactItem__label}>Số điện thoại trực tiếp</span>
              <span className={styles.contactItem__value}>{customer.phone}</span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy('phone', customer.phone)}
              className={styles.contactItem__copyBtn}
              aria-label="Sao chép số điện thoại"
              title="Sao chép SĐT"
            >
              {copiedField === 'phone' ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>

          <div className={styles.contactItem}>
            <Building2 size={15} className={styles.contactItem__icon} />
            <div className={styles.contactItem__body}>
              <span className={styles.contactItem__label}>Doanh nghiệp & Lĩnh vực</span>
              <span className={styles.contactItem__value}>
                {customer.company} · {customer.industry}
              </span>
            </div>
          </div>

          <div className={styles.contactItem}>
            <Globe size={15} className={styles.contactItem__icon} />
            <div className={styles.contactItem__body}>
              <span className={styles.contactItem__label}>Tên miền doanh nghiệp</span>
              <span className={styles.contactItem__value}>{customer.companyDomain}</span>
            </div>
          </div>

          <div className={styles.contactItem}>
            <MapPin size={15} className={styles.contactItem__icon} />
            <div className={styles.contactItem__body}>
              <span className={styles.contactItem__label}>Trụ sở chính</span>
              <span className={styles.contactItem__value}>{customer.location}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Thẻ Phân loại Tags */}
      <Card padding="md" className={styles.panelSection}>
        <div className={styles.panelSection__titleRow}>
          <Tag size={15} className={styles.panelSection__icon} />
          <h3 className={styles.panelSection__heading}>Nhãn phân loại (Tags)</h3>
        </div>
        <div className={styles.tagsWrap}>
          <Badge tone="accent" size="md">
            {customer.tier}
          </Badge>
          {customer.tags.map((tag) => (
            <Badge key={tag} tone="primary" size="md">
              {tag}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Thẻ Trường Thông tin Tùy chỉnh (Custom Fields) */}
      {customer.custom_fields && Object.keys(customer.custom_fields).length > 0 && (
        <Card padding="md" className={styles.panelSection}>
          <div className={styles.panelSection__titleRow}>
            <Sliders size={15} className={styles.panelSection__icon} />
            <h3 className={styles.panelSection__heading}>Trường Thông tin Tùy chỉnh</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
            {Object.entries(customer.custom_fields).map(([key, value]) => {
              const labelMap: Record<string, string> = {
                tax_code: 'Mã số thuế',
                employee_count: 'Quy mô nhân sự',
                deployment_type: 'Hình thức triển khai',
                target_launch_date: 'Ngày dự kiến vận hành',
              };
              const displayLabel = labelMap[key] || key.replace(/_/g, ' ');
              return (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(100, 116, 139, 0.08)',
                  }}
                >
                  <span style={{ color: '#64748b', textTransform: 'capitalize' }}>
                    {displayLabel}
                  </span>
                  <strong style={{ fontWeight: 600 }}>{String(value)}</strong>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Người phụ trách Tài khoản */}
      <Card padding="md" className={styles.panelSection}>
        <div className={styles.panelSection__titleRow}>
          <UserCheck size={15} className={styles.panelSection__icon} />
          <h3 className={styles.panelSection__heading}>Người phụ trách Tài khoản</h3>
        </div>

        <div className={styles.ownerBox}>
          <Avatar
            src={customer.owner.avatarUrl}
            name={customer.owner.name}
            size="md"
            status="online"
          />
          <div className={styles.ownerBox__info}>
            <strong>{customer.owner.name}</strong>
            <span>{customer.owner.email}</span>
          </div>
        </div>

        <div className={styles.healthMeter}>
          <div className={styles.healthMeter__top}>
            <span>
              <HeartHandshake size={13} /> Chỉ số Gắn kết Hệ thống
            </span>
            <strong className="tabular-nums">{customer.healthScore}%</strong>
          </div>
          <div className={styles.healthMeter__bar}>
            <div
              className={styles.healthMeter__fill}
              style={{ width: `${customer.healthScore}%` }}
            />
          </div>
        </div>

        {onOpenFullProfile && (
          <Button
            variant="primary"
            fullWidth
            rightIcon={<ExternalLink size={15} />}
            onClick={onOpenFullProfile}
          >
            Mở Hồ sơ Chi tiết 360°
          </Button>
        )}
      </Card>
    </aside>
  );
};
