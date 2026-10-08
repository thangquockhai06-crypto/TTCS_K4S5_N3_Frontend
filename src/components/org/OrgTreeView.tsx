import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronRight,
  UserCheck,
  MapPin,
  Edit2,
  Check,
  AlertCircle,
  X,
  RefreshCw,
  Building2,
} from 'lucide-react';
import { IOrgNode } from '../../interfaces';
import { sprint2Service } from '../../services/sprint2Service';

export const OrgTreeView: React.FC = () => {
  const [treeData, setTreeData] = useState<IOrgNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});
  const [editingNode, setEditingNode] = useState<IOrgNode | null>(null);
  const [leaderName, setLeaderName] = useState('');
  const [region, setRegion] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchTree = async () => {
    setIsLoading(true);
    setStatusMsg(null);
    try {
      const data = await sprint2Service.getOrgTree();
      setTreeData(data);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: 'Không thể tải cây tổ chức.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTree();
  }, []);

  const toggleCollapse = (nodeId: string) => {
    setCollapsedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const handleOpenEdit = (node: IOrgNode) => {
    setEditingNode(node);
    setLeaderName(node.leader_name || '');
    setRegion(node.region || 'Toàn quốc');
  };

  const handleSaveNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNode) return;

    try {
      await sprint2Service.updateOrgNode(editingNode.id, {
        leader_name: leaderName,
        region,
      });
      setStatusMsg({ type: 'success', text: `Cập nhật đơn vị "${editingNode.name}" thành công!` });
      setEditingNode(null);
      fetchTree();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.response?.data?.detail || 'Lỗi khi cập nhật đơn vị.' });
    }
  };

  const renderNode = (node: IOrgNode, level = 0) => {
    const isCollapsed = Boolean(collapsedNodes[node.id]);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            backgroundColor: level === 0 ? '#f8fafc' : '#ffffff',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            marginBottom: '6px',
            marginLeft: level > 0 ? `${level * 24}px` : 0,
            position: 'relative',
          }}
        >
          {/* Branch connector line */}
          {level > 0 && (
            <div
              style={{
                position: 'absolute',
                left: '-16px',
                top: '50%',
                width: '14px',
                height: '1px',
                backgroundColor: '#cbd5e1',
              }}
            />
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleCollapse(node.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  color: '#64748b',
                }}
              >
                {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
              </button>
            ) : (
              <div style={{ width: '16px' }} />
            )}

            <Building2 size={16} color={level === 0 ? '#2563eb' : '#64748b'} />
            <strong style={{ fontSize: '0.85rem', color: '#1e293b' }}>{node.name}</strong>

            <span
              style={{
                fontSize: '0.72rem',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: '#f1f5f9',
                color: '#475569',
              }}
            >
              {node.member_count} nhân sự
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Leader */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: '#334155' }}>
              <UserCheck size={13} color="#2563eb" />
              <span>{node.leader_name || <span style={{ color: '#94a3b8' }}>Chưa có Trưởng bộ phận</span>}</span>
            </div>

            {/* Region */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: '#64748b' }}>
              <MapPin size={13} color="#f59e0b" />
              <span>{node.region || 'Toàn quốc'}</span>
            </div>

            {/* Edit button */}
            <button
              type="button"
              onClick={() => handleOpenEdit(node)}
              style={{
                padding: '4px',
                border: 'none',
                background: 'none',
                color: '#2563eb',
                cursor: 'pointer',
              }}
              title="Gán Trưởng bộ phận & Địa bàn phụ trách"
            >
              <Edit2 size={14} />
            </button>
          </div>
        </div>

        {/* Children nodes */}
        {hasChildren && !isCollapsed && (
          <div
            style={{
              position: 'relative',
              marginLeft: level > 0 ? `${level * 24}px` : 0,
              paddingLeft: '16px',
              borderLeft: '2px solid #e2e8f0',
            }}
          >
            {node.children.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Sơ đồ Cây Tổ chức Đa cấp
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0' }}>
            Phân định quyền phân cấp, bổ nhiệm Trưởng bộ phận phụ trách và thiết lập địa bàn quản lý (Region)
          </p>
        </div>

        <button
          type="button"
          onClick={fetchTree}
          disabled={isLoading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            backgroundColor: '#ffffff',
            color: '#334155',
            fontSize: '0.8rem',
            cursor: isLoading ? 'not-allowed' : 'pointer',
          }}
        >
          <RefreshCw size={13} className={isLoading ? 'spin' : ''} />
          Làm mới
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

      {/* Tree container */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          padding: '20px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        }}
      >
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>Đang nạp sơ đồ cây...</div>
        ) : treeData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>Chưa có cây tổ chức nào.</div>
        ) : (
          treeData.map((rootNode) => renderNode(rootNode, 0))
        )}
      </div>

      {/* Edit Leader / Region Modal */}
      {editingNode && (
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
              maxWidth: '450px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                Phân bổ Lãnh đạo & Địa bàn
              </h3>
              <button
                type="button"
                onClick={() => setEditingNode(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569' }}>
              Đơn vị: <strong>{editingNode.name}</strong>
            </p>

            <form onSubmit={handleSaveNode} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Họ tên Trưởng bộ phận / Trưởng nhóm (Leader)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={leaderName}
                  onChange={(e) => setLeaderName(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Khu vực / Địa bàn phụ trách (Region)
                </label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                >
                  <option value="Toàn quốc">Toàn quốc</option>
                  <option value="Miền Bắc (Hà Nội & lân cận)">Miền Bắc (Hà Nội & lân cận)</option>
                  <option value="Miền Trung (Đà Nẵng & miền Trung)">Miền Trung (Đà Nẵng & miền Trung)</option>
                  <option value="Miền Nam (TP.HCM & Đông Nam Bộ)">Miền Nam (TP.HCM & Đông Nam Bộ)</option>
                  <option value="Tây Nam Bộ">Tây Nam Bộ</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setEditingNode(null)}
                  style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ padding: '6px 14px', borderRadius: '4px', border: 'none', backgroundColor: '#2563eb', color: '#ffffff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Lưu phân công
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
