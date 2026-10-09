import React, { useState, useEffect } from 'react';
import {
  Building2,
  ChevronRight,
  ChevronDown,
  GitBranch,
} from 'lucide-react';
import { ICorporateHierarchyNode, ICustomer } from '../../interfaces';
import { customerService } from '../../services/customerService';
import { formatCurrency } from '../../utils/formatters';
import { Button, Modal } from '../common';
import { showGlobalToast } from '../../context/ToastContext';

interface ICorporateTreeProps {
  customerId: string;
  onHierarchyUpdated?: () => void;
}

interface ITreeNodeItemProps {
  node: ICorporateHierarchyNode;
  currentCustomerId: string;
  level: number;
}

const TreeNodeItem: React.FC<ITreeNodeItemProps> = ({ node, currentCustomerId, level }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const isCurrent = node.id === currentCustomerId;
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div style={{ marginLeft: level === 0 ? '0px' : '24px', marginTop: '8px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 14px',
          borderRadius: '8px',
          backgroundColor: isCurrent ? '#EFF6FF' : '#FFFFFF',
          border: isCurrent ? '1.5px solid #3B82F6' : '1px solid #E5E7EB',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '2px',
              color: '#6B7280',
            }}
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        ) : (
          <span style={{ width: '16px', display: 'inline-block' }} />
        )}

        <Building2 size={18} style={{ color: isCurrent ? '#2563EB' : '#6B7280' }} />

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: isCurrent ? 700 : 600, fontSize: '14px', color: '#111827' }}>
            {node.company}
          </span>

          {isCurrent && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: '#DBEAFE',
                color: '#1E40AF',
                padding: '2px 6px',
                borderRadius: '4px',
              }}
            >
              Hiện tại
            </span>
          )}

          {node.taxCode && (
            <span style={{ fontSize: '12px', color: '#6B7280' }}>
              (MST: {node.taxCode})
            </span>
          )}

          {level === 0 && hasChildren && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: '#FEF3C7',
                color: '#92400E',
                padding: '2px 6px',
                borderRadius: '4px',
              }}
            >
              Tập đoàn Mẹ
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ display: 'block', fontSize: '11px', color: '#6B7280' }}>Doanh số riêng</span>
            <span style={{ fontWeight: 600, fontSize: '13px', color: '#111827' }}>
              {formatCurrency(node.totalContractValue)}
            </span>
          </div>

          {hasChildren && (
            <div style={{ textAlign: 'right' }}>
              <span style={{ display: 'block', fontSize: '11px', color: '#2563EB', fontWeight: 600 }}>
                Tổng tập đoàn
              </span>
              <span style={{ fontWeight: 700, fontSize: '14px', color: '#2563EB' }}>
                {formatCurrency(node.groupContractValue)}
              </span>
            </div>
          )}
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div style={{ borderLeft: '2px dashed #D1D5DB', marginLeft: '12px' }}>
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              currentCustomerId={currentCustomerId}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const CorporateTree: React.FC<ICorporateTreeProps> = ({
  customerId,
  onHierarchyUpdated,
}) => {
  const [treeRoot, setTreeRoot] = useState<ICorporateHierarchyNode | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Parent setting modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [availableParents, setAvailableParents] = useState<ICustomer[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchTree = async () => {
    setIsLoading(true);
    try {
      const data = await customerService.getCorporateHierarchy(customerId);
      setTreeRoot(data);
      setError(null);
    } catch (err: any) {
      setError('Không thể tải cấu trúc cây phân cấp công ty mẹ - con.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTree();
  }, [customerId]);

  const handleOpenSetParent = async () => {
    setSaveError(null);
    setSelectedParentId('');
    try {
      const customers = await customerService.getCustomers({ limit: 200 });
      // Không chọn chính mình
      setAvailableParents(customers.filter((c) => c.id !== customerId));
      setIsModalOpen(true);
    } catch (err) {
      showGlobalToast('Lỗi tải danh sách khách hàng', 'error');
    }
  };

  const handleSaveParent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    try {
      await customerService.setParentCustomer(customerId, selectedParentId || undefined);
      showGlobalToast('Cập nhật cấu trúc công ty mẹ - con thành công!', 'success');
      setIsModalOpen(false);
      fetchTree();
      onHierarchyUpdated?.();
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Lỗi khi gán công ty mẹ (Có thể do tạo vòng lặp tham chiếu)';
      setSaveError(errMsg);
      showGlobalToast(errMsg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div style={{ padding: '24px', textAlign: 'center', color: '#6B7280' }}>Đang nạp cấu trúc tập đoàn...</div>;
  }

  if (error || !treeRoot) {
    return <div style={{ padding: '16px', color: '#DC2626' }}>{error || 'Không có dữ liệu cây phân cấp.'}</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
            Mô hình Tập đoàn & Công ty Mẹ - Con
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#6B7280' }}>
            Tổng hợp quy mô doanh số toàn tập đoàn theo thuật toán đệ quy Recursive CTE.
          </p>
        </div>
        <Button variant="secondary" leftIcon={<GitBranch size={15} />} onClick={handleOpenSetParent}>
          Thay đổi công ty mẹ
        </Button>
      </div>

      {/* Corporate Summary Card */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          padding: '16px',
          backgroundColor: '#F8FAFC',
          borderRadius: '10px',
          border: '1px solid #E2E8F0',
        }}
      >
        <div>
          <span style={{ fontSize: '12px', color: '#64748B', display: 'block' }}>Công ty Mẹ / Gốc</span>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>{treeRoot.company}</span>
        </div>
        <div>
          <span style={{ fontSize: '12px', color: '#64748B', display: 'block' }}>Tổng giá trị tập đoàn (Group ARR)</span>
          <span style={{ fontSize: '16px', fontWeight: 800, color: '#2563EB' }}>
            {formatCurrency(treeRoot.groupContractValue)}
          </span>
        </div>
        <div>
          <span style={{ fontSize: '12px', color: '#64748B', display: 'block' }}>Số công ty con trực tiếp</span>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
            {treeRoot.children?.length || 0} đơn vị thành viên
          </span>
        </div>
      </div>

      {/* Tree Visualization */}
      <div
        style={{
          padding: '16px',
          backgroundColor: '#FAFAFA',
          borderRadius: '10px',
          border: '1px solid #E5E7EB',
        }}
      >
        <TreeNodeItem node={treeRoot} currentCustomerId={customerId} level={0} />
      </div>

      {/* Modal Thay đổi công ty mẹ */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Thiết lập / Thay đổi Công ty Mẹ"
        >
          <form onSubmit={handleSaveParent} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#4B5563' }}>
              Chọn doanh nghiệp đóng vai trò công ty mẹ (Holding / Parent company) để tổng hợp doanh thu và báo cáo phân cấp.
            </p>

            {saveError && (
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#FEF2F2',
                  color: '#DC2626',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              >
                {saveError}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Chọn Công ty Mẹ
              </label>
              <select
                value={selectedParentId}
                onChange={(e) => setSelectedParentId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  fontSize: '14px',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <option value="">-- Không có công ty mẹ (Độc lập / Là công ty mẹ gốc) --</option>
                {availableParents.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company || c.fullName} {c.taxCode ? `(MST: ${c.taxCode})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
                Hủy bỏ
              </Button>
              <Button variant="primary" type="submit" isLoading={isSaving}>
                Lưu liên kết mẹ - con
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
