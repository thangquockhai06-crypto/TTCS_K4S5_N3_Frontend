import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
  PhoneCall,
  RefreshCw,
} from 'lucide-react';
import { IStagnantCustomer } from '../../interfaces/customer.interface';
import { customerService } from '../../services/customerService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Button, Card } from '../common';
import { RiskBadge } from './RiskBadge';

export const StagnantCustomerList: React.FC = () => {
  const navigate = useNavigate();
  const [daysThreshold, setDaysThreshold] = useState<number>(30);
  const [stagnantList, setStagnantList] = useState<IStagnantCustomer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [touchingId, setTouchingId] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    loadStagnantCustomers();
  }, [daysThreshold]);

  const loadStagnantCustomers = async () => {
    setIsLoading(true);
    try {
      const data = await customerService.getStagnantCustomers(daysThreshold);
      setStagnantList(data);
    } catch (err) {
      console.error('Lỗi khi tải danh sách khách hàng cần chăm sóc:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickTouch = async (customer: IStagnantCustomer) => {
    setTouchingId(customer.id);
    try {
      await customerService.quickTouchCustomer(customer.id);
      setSuccessNotice(`Đã ghi nhận chăm sóc thành công cho "${customer.company || customer.fullName}"!`);
      setTimeout(() => setSuccessNotice(null), 3000);
      loadStagnantCustomers();
    } catch (err) {
      console.error('Lỗi ghi nhận tương tác nhanh:', err);
    } finally {
      setTouchingId(null);
    }
  };

  const totalValueAtRisk = stagnantList.reduce(
    (sum, c) => sum + (c.totalContractValue || 0),
    0
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
            Danh Sách Cần Chăm Sóc Định Kỳ (S3-09)
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: 4 }}>
            Tự động lọc các khách hàng chưa có tương tác trong hơn <strong>{daysThreshold} ngày</strong>.
            Ưu tiên sắp xếp theo giá trị hợp đồng (ARR) cao nhất để giảm thiểu nguy cơ rời bỏ (churn).
          </p>
        </div>

        {/* Filter threshold dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>
            Thời gian không tương tác:
          </span>
          <select
            value={daysThreshold}
            onChange={(e) => setDaysThreshold(Number(e.target.value))}
            style={{
              padding: '8px 14px',
              borderRadius: 6,
              border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            <option value={15}>Hơn 15 ngày</option>
            <option value={30}>Hơn 30 ngày (Tiêu chuẩn)</option>
            <option value={45}>Hơn 45 ngày</option>
            <option value={60}>Hơn 60 ngày</option>
            <option value={90}>Hơn 90 ngày (Khẩn cấp)</option>
          </select>

          <Button
            variant="secondary"
            size="sm"
            onClick={loadStagnantCustomers}
            leftIcon={<RefreshCw size={14} />}
          >
            Làm mới
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <Card padding="md">
          <div style={{ fontSize: '0.8125rem', color: '#64748B', fontWeight: 500 }}>
            Tổng số khách hàng cần chăm sóc
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
            {stagnantList.length} doanh nghiệp
          </div>
        </Card>

        <Card padding="md">
          <div style={{ fontSize: '0.8125rem', color: '#64748B', fontWeight: 500 }}>
            Tổng giá trị hợp đồng có rủi ro
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#DC2626', marginTop: 4 }}>
            {formatCurrency(totalValueAtRisk)}
          </div>
        </Card>

        <Card padding="md">
          <div style={{ fontSize: '0.8125rem', color: '#64748B', fontWeight: 500 }}>
            Số khách hàng đang bị cắm Cờ Rủi ro
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#D97706', marginTop: 4 }}>
            {stagnantList.filter((c) => c.riskFlag).length}
          </div>
        </Card>
      </div>

      {successNotice && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#ECFDF5',
            border: '1px solid #A7F3D0',
            borderRadius: 8,
            color: '#065F46',
            fontSize: '0.875rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <CheckCircle2 size={18} color="#059669" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Main Table */}
      <Card padding="none">
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#64748B' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <div>Đang truy vấn danh sách khách hàng tồn đọng...</div>
          </div>
        ) : stagnantList.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <CheckCircle2 size={48} color="#16A34A" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#166534', marginBottom: 4 }}>
              Tuyệt vời! Không có khách hàng nào bị bỏ quên.
            </h3>
            <p style={{ color: '#64748B', fontSize: '0.875rem' }}>
              Mọi khách hàng đều đã được liên hệ tương tác trong vòng {daysThreshold} ngày qua.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>
                    Khách hàng / Doanh nghiệp
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>
                    Giá trị hợp đồng (ARR)
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#475569' }}>
                    Không tương tác
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>
                    Tương tác gần nhất
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#475569' }}>
                    Cờ rủi ro
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>
                    Thao tác nhanh
                  </th>
                </tr>
              </thead>
              <tbody>
                {stagnantList.map((c) => {
                  const arr = c.totalContractValue || 0;
                  const isTouching = touchingId === c.id;

                  return (
                    <tr
                      key={c.id}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        transition: 'background-color 0.15s',
                      }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = '#F8FAFC')}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#0F172A' }}>
                          {c.company || c.fullName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          {c.email || c.phone || 'Chưa có thông tin liên lạc'}
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <strong style={{ color: '#0F172A' }}>{formatCurrency(arr)}</strong>
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 8px',
                            borderRadius: 12,
                            backgroundColor: c.daysInactive > 60 ? '#FEE2E2' : '#FEF3C7',
                            color: c.daysInactive > 60 ? '#991B1B' : '#92400E',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                          }}
                        >
                          <Clock size={12} /> {c.daysInactive} ngày
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px', color: '#64748B', fontSize: '0.8125rem' }}>
                        {c.lastInteractionAt ? formatDate(c.lastInteractionAt) : 'Chưa từng tương tác'}
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <RiskBadge isRisk={Boolean(c.riskFlag)} />
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                          <Button
                            variant="primary"
                            size="sm"
                            leftIcon={
                              isTouching ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <PhoneCall size={13} />
                              )
                            }
                            onClick={() => handleQuickTouch(c)}
                            disabled={isTouching}
                          >
                            {isTouching ? 'Đang cập nhật...' : 'Đã liên hệ'}
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate(`/customers/${c.id}`)}
                            title="Xem chi tiết 360"
                          >
                            <Eye size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
