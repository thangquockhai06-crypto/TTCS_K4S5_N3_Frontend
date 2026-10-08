import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  Check,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react';
import {
  ISavedFilterPreset,
} from '../../interfaces/customer.interface';
import { customerService } from '../../services/customerService';
import { Button, Drawer } from '../common';

export interface ICustomerFilterParams {
  search?: string;
  status?: string;
  industry?: string;
  tier?: string;
  taxCode?: string;
  risk_only?: boolean;
  min_value?: number;
  max_value?: number;
}

export interface IFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: ICustomerFilterParams;
  onApplyFilters: (newFilters: ICustomerFilterParams) => void;
  onResetFilters: () => void;
}

const INDUSTRY_OPTIONS = [
  'Công nghệ thông tin & Viễn thông',
  'Sản xuất & Chế tạo',
  'Bán lẻ & Thương mại điện tử',
  'Tài chính & Ngân hàng',
  'Y tế & Dược phẩm',
  'Bất động sản & Xây dựng',
  'Giáo dục & Đào tạo',
  'Logistics & Chuỗi cung ứng',
];

const TIER_OPTIONS = [
  { label: 'Enterprise (Doanh nghiệp VIP/Chiến lược)', value: 'Enterprise' },
  { label: 'Mid-Market (Doanh nghiệp quy mô vừa)', value: 'Mid-Market' },
  { label: 'Growth (Doanh nghiệp tăng trưởng)', value: 'Growth' },
  { label: 'Startup (Khởi nghiệp / SME)', value: 'Startup' },
];

const STATUS_OPTIONS = [
  { label: 'Đang hợp tác (Active)', value: 'Active' },
  { label: 'Đang đàm phán (Negotiation)', value: 'Negotiation' },
  { label: 'Tiềm năng mới (New Lead)', value: 'New Lead' },
  { label: 'Cần chú ý (At Risk)', value: 'At Risk' },
  { label: 'Đã ngừng (Churned)', value: 'Churned' },
];

export const FilterDrawer: React.FC<IFilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  onResetFilters,
}) => {
  const [localFilters, setLocalFilters] = useState<ICustomerFilterParams>(filters);
  const [presets, setPresets] = useState<ISavedFilterPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
      loadPresets();
    }
  }, [isOpen, filters]);

  const loadPresets = async () => {
    try {
      const data = await customerService.getSavedFilters();
      setPresets(data);
    } catch (err) {
      console.error('Lỗi khi tải bộ lọc đã lưu:', err);
    }
  };

  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    if (!presetId) return;

    const preset = presets.find((p) => p.id === presetId);
    if (preset && preset.filterCriteria) {
      try {
        const parsed = JSON.parse(preset.filterCriteria);
        setLocalFilters({
          ...localFilters,
          ...parsed,
        });
      } catch (e) {
        console.error('Lỗi giải mã cấu hình bộ lọc:', e);
      }
    }
  };

  const handleSaveCurrentPreset = async () => {
    if (!presetNameInput.trim()) return;

    try {
      const created = await customerService.createSavedFilter({
        name: presetNameInput.trim(),
        entityType: 'customer',
        filterCriteria: JSON.stringify(localFilters),
        isDefault: false,
      });
      setPresets((prev) => [created, ...prev]);
      setSelectedPresetId(created.id);
      setIsSavingPreset(false);
      setPresetNameInput('');
      setSaveSuccessMsg(`Đã lưu mẫu lọc "${created.name}"`);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Lỗi khi lưu mẫu bộ lọc:', err);
    }
  };

  const handleDeletePreset = async (presetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await customerService.deleteSavedFilter(presetId);
      setPresets((prev) => prev.filter((p) => p.id !== presetId));
      if (selectedPresetId === presetId) {
        setSelectedPresetId('');
      }
    } catch (err) {
      console.error('Lỗi xóa mẫu lọc:', err);
    }
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    setLocalFilters({});
    setSelectedPresetId('');
    onResetFilters();
    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Bộ Lọc Nâng Cao"
      subtitle="Thiết lập tiêu chí chi tiết hoặc lưu mẫu bộ lọc cá nhân"
      position="right"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 24 }}>
        {/* Preset Selector Section */}
        <div
          style={{
            padding: 12,
            backgroundColor: '#F8FAFC',
            borderRadius: 8,
            border: '1px solid #E2E8F0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Bookmark size={15} color="#2563EB" /> Mẫu lọc cá nhân đã lưu:
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsSavingPreset(!isSavingPreset)}
              leftIcon={<Plus size={14} />}
            >
              Lưu mẫu mới
            </Button>
          </div>

          {saveSuccessMsg && (
            <div style={{ fontSize: '0.75rem', color: '#16A34A', marginBottom: 6, fontWeight: 500 }}>
              ✓ {saveSuccessMsg}
            </div>
          )}

          {isSavingPreset && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <input
                type="text"
                placeholder="Đặt tên cho bộ lọc..."
                value={presetNameInput}
                onChange={(e) => setPresetNameInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: 4,
                  border: '1px solid #CBD5E1',
                  fontSize: '0.8125rem',
                }}
              />
              <Button variant="primary" size="sm" onClick={handleSaveCurrentPreset} leftIcon={<Save size={13} />}>
                Lưu
              </Button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {presets.length === 0 ? (
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontStyle: 'italic' }}>
                Chưa có mẫu lọc nào được lưu.
              </div>
            ) : (
              presets.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleSelectPreset(p.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: 4,
                    cursor: 'pointer',
                    backgroundColor: selectedPresetId === p.id ? '#EFF6FF' : '#FFFFFF',
                    border: `1px solid ${selectedPresetId === p.id ? '#3B82F6' : '#E2E8F0'}`,
                    fontSize: '0.8125rem',
                  }}
                >
                  <span style={{ fontWeight: selectedPresetId === p.id ? 600 : 400, color: '#1E293B' }}>
                    {p.name}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleDeletePreset(p.id, e)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      padding: 2,
                    }}
                    title="Xóa mẫu lọc"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Filter 1: Free Search Query */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
            Từ khóa tìm kiếm:
          </label>
          <input
            type="text"
            placeholder="Tên công ty, MST, người đại diện, số điện thoại..."
            value={localFilters.search || ''}
            onChange={(e) => setLocalFilters({ ...localFilters, search: e.target.value })}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 6,
              border: '1px solid #CBD5E1',
              fontSize: '0.875rem',
            }}
          />
        </div>

        {/* Filter 2: Tax Code */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
            Mã số thuế (MST chính xác):
          </label>
          <input
            type="text"
            placeholder="Ví dụ: 0101234567"
            value={localFilters.taxCode || ''}
            onChange={(e) => setLocalFilters({ ...localFilters, taxCode: e.target.value })}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 6,
              border: '1px solid #CBD5E1',
              fontSize: '0.875rem',
            }}
          />
        </div>

        {/* Filter 3: Status */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
            Trạng thái hợp tác:
          </label>
          <select
            value={localFilters.status || ''}
            onChange={(e) => setLocalFilters({ ...localFilters, status: e.target.value || undefined })}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 6,
              border: '1px solid #CBD5E1',
              fontSize: '0.875rem',
            }}
          >
            <option value="">-- Tất cả trạng thái --</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filter 4: Industry */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
            Ngành nghề kinh doanh:
          </label>
          <select
            value={localFilters.industry || ''}
            onChange={(e) => setLocalFilters({ ...localFilters, industry: e.target.value || undefined })}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 6,
              border: '1px solid #CBD5E1',
              fontSize: '0.875rem',
            }}
          >
            <option value="">-- Tất cả ngành nghề --</option>
            {INDUSTRY_OPTIONS.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
        </div>

        {/* Filter 5: Tier */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
            Phân hạng doanh nghiệp (Tier):
          </label>
          <select
            value={localFilters.tier || ''}
            onChange={(e) => setLocalFilters({ ...localFilters, tier: e.target.value || undefined })}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 6,
              border: '1px solid #CBD5E1',
              fontSize: '0.875rem',
            }}
          >
            <option value="">-- Tất cả phân hạng --</option>
            {TIER_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filter 6: Risk Flag */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={localFilters.risk_only ?? false}
              onChange={(e) =>
                setLocalFilters({
                  ...localFilters,
                  risk_only: e.target.checked ? true : undefined,
                })
              }
            />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#B91C1C' }}>
              🚩 Chỉ lọc khách hàng có cờ rủi ro (Risk Flag)
            </span>
          </label>
        </div>

        {/* Filter 7: ARR Range */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
            Giá trị hợp đồng (USD):
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input
              type="number"
              placeholder="Từ (Tối thiểu)"
              value={localFilters.min_value ?? ''}
              onChange={(e) =>
                setLocalFilters({
                  ...localFilters,
                  min_value: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              style={{
                padding: '8px 10px',
                borderRadius: 6,
                border: '1px solid #CBD5E1',
                fontSize: '0.875rem',
              }}
            />
            <input
              type="number"
              placeholder="Đến (Tối đa)"
              value={localFilters.max_value ?? ''}
              onChange={(e) =>
                setLocalFilters({
                  ...localFilters,
                  max_value: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              style={{
                padding: '8px 10px',
                borderRadius: 6,
                border: '1px solid #CBD5E1',
                fontSize: '0.875rem',
              }}
            />
          </div>
        </div>

        {/* Actions Button */}
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <Button variant="secondary" onClick={handleReset} leftIcon={<RotateCcw size={15} />} style={{ flex: 1 }}>
            Đặt lại
          </Button>
          <Button variant="primary" onClick={handleApply} leftIcon={<Check size={15} />} style={{ flex: 2 }}>
            Áp dụng bộ lọc
          </Button>
        </div>
      </div>
    </Drawer>
  );
};
