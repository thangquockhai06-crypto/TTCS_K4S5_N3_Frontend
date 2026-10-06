import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Download,
  FileSpreadsheet,
  FileText,
  Mail,
  MessageSquarePlus,
  PhoneCall,
  Pin,
  Presentation,
  Send,
  Sparkles,
} from 'lucide-react';
import {
  getCustomerStatusLabel,
  getCustomerStatusTone,
} from '../components/customer/CustomerCard';
import { CustomerDetailPanel } from '../components/customer/CustomerDetailPanel';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Dropdown,
  Input,
  Modal,
} from '../components/common';
import { useCRMData } from '../context/CRMDataContext';
import { useAuth } from '../hooks/useAuth';
import { ActivityType, CustomerStatusType } from '../interfaces';
import { formatCurrency } from '../utils/formatters';
import { useToast } from '../context/ToastContext';
import styles from './CustomerDetailPage.module.css';

type DetailTabType = 'overview' | 'activities' | 'notes' | 'files';

const STATUS_OPTIONS: ReadonlyArray<{ label: string; value: CustomerStatusType }> = [
  { label: 'Đang hợp tác', value: 'Active' },
  { label: 'Đang đàm phán', value: 'Negotiation' },
  { label: 'Tiềm năng mới', value: 'New Lead' },
  { label: 'Cần chú ý', value: 'At Risk' },
  { label: 'Đã ngừng hợp tác', value: 'Churned' },
];

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const {
    customers,
    updateCustomerStatus,
    addCustomerNote,
    addCustomerActivity,
  } = useCRMData();

  const customer = customers.find((c) => c.id === id) ?? customers[0];

  const [activeTab, setActiveTab] = useState<DetailTabType>('overview');
  const [noteInput, setNoteInput] = useState<string>('');
  const [isActivityModalOpen, setIsActivityModalOpen] = useState<boolean>(false);
  const [activityForm, setActivityForm] = useState<{
    type: ActivityType;
    title: string;
    description: string;
  }>({
    type: 'call',
    title: '',
    description: '',
  });

  const handleAddNote = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!noteInput.trim()) return;
    addCustomerNote(
      customer.id,
      noteInput.trim(),
      user?.fullName ?? 'Quản Trị Viên Hệ Thống'
    );
    setNoteInput('');
    showToast('success', 'Đã thêm ghi chú khách hàng thành công!');
  };

  const handleCreateActivity = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!activityForm.title.trim()) return;
    addCustomerActivity(
      customer.id,
      activityForm.title.trim(),
      activityForm.description.trim() ||
        `Đã thực hiện tương tác với ${customer.fullName} (${customer.company}).`,
      activityForm.type,
      user?.fullName ?? 'Quản Trị Viên Hệ Thống'
    );
    setActivityForm({ type: 'call', title: '', description: '' });
    setIsActivityModalOpen(false);
    setActiveTab('activities');
    showToast('success', 'Đã ghi nhận hoạt động chăm sóc khách hàng thành công!');
  };

  return (
    <div className={styles.detailPage}>
      {/* Thanh điều hướng quay lại */}
      <div className={styles.breadcrumbBar}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => navigate('/customers')}
        >
          <ArrowLeft size={16} />
          <span>Quay lại Danh bạ Khách hàng</span>
        </button>

        <div className={styles.breadcrumbBar__right}>
          <Dropdown<CustomerStatusType>
            label="Trạng thái"
            value={customer.status}
            options={STATUS_OPTIONS}
            onChange={(nextStatus) => {
              updateCustomerStatus(customer.id, nextStatus);
              showToast('success', 'Đã cập nhật trạng thái khách hàng!');
            }}
            ariaLabel="Thay đổi trạng thái khách hàng"
          />
        </div>
      </div>

      {/* Khối thông tin chính (Hero Profile) */}
      <motion.section
        className={styles.profileHero}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
      >
        <div className={styles.profileHero__left}>
          <Avatar src={customer.avatarUrl} name={customer.fullName} size="xl" status="online" />
          <div className={styles.profileHero__identity}>
            <div className={styles.profileHero__titleRow}>
              <h1 className={styles.profileHero__name}>{customer.fullName}</h1>
              <Badge tone={getCustomerStatusTone(customer.status)} dot>
                {getCustomerStatusLabel(customer.status)}
              </Badge>
              <Badge tone="accent">{customer.tier}</Badge>
            </div>
            <p className={styles.profileHero__companyLine}>
              <strong>{customer.role}</strong> tại <strong>{customer.company}</strong> ·{' '}
              <span>{customer.location}</span>
            </p>
            <p className={styles.profileHero__summary}>{customer.summary}</p>
          </div>
        </div>

        {/* Cụm nút Thao tác nhanh (Quick Actions) */}
        <div className={styles.quickActions}>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<PhoneCall size={15} />}
            onClick={() => {
              setActivityForm({
                type: 'call',
                title: `Cuộc gọi trao đổi với ${customer.fullName}`,
                description: `Rà soát tiến độ triển khai Quý 3 và nhu cầu mở rộng tài khoản cho ${customer.company}.`,
              });
              setIsActivityModalOpen(true);
            }}
          >
            Ghi nhận Cuộc gọi
          </Button>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Mail size={15} />}
            onClick={() => {
              setActivityForm({
                type: 'email',
                title: `Gửi đề xuất gia hạn hợp đồng cho ${customer.company}`,
                description: `Đã gửi bảng báo giá gói ưu đãi đa năm (${formatCurrency(
                  customer.dealValue
                )} ARR).`,
              });
              setIsActivityModalOpen(true);
            }}
          >
            Gửi Email
          </Button>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Calendar size={15} />}
            onClick={() => {
              setActivityForm({
                type: 'meeting',
                title: `Họp đánh giá định kỳ (QBR) — ${customer.company}`,
                description: `Lên lịch họp trực tuyến 45 phút cùng ${customer.fullName}.`,
              });
              setIsActivityModalOpen(true);
            }}
          >
            Đặt lịch Họp
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<MessageSquarePlus size={15} />}
            onClick={() => setActiveTab('notes')}
          >
            Thêm Ghi chú
          </Button>
        </div>
      </motion.section>

      {/* Bố cục 2 cột: Cột chính (Tabs) + Cột phải (Inspector Panel) */}
      <div className={styles.workspaceGrid}>
        <div className={styles.mainColumn}>
          <div className={styles.tabsBar} role="tablist" aria-label="Phân mục hồ sơ khách hàng">
            {(
              [
                { id: 'overview', label: 'Tổng quan (Overview)' },
                {
                  id: 'activities',
                  label: `Lịch sử Hoạt động (${customer.activities.length})`,
                },
                { id: 'notes', label: `Ghi chú Nội bộ (${customer.notes.length})` },
                { id: 'files', label: `Tài liệu & Hợp đồng (${customer.files.length})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`${styles.tabBtn} ${
                  activeTab === tab.id ? styles['tabBtn--active'] : ''
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <motion.div
              className={styles.tabContent}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Thẻ Phân tích AI */}
              <Card padding="md" className={styles.aiInsightCard}>
                <div className={styles.aiInsightCard__header}>
                  <span className={styles.aiInsightCard__badge}>
                    <Sparkles size={13} /> PHÂN TÍCH TRÍ TUỆ DOANH THU NEXUS AI
                  </span>
                  <span className={styles.aiInsightCard__confidence}>
                    {customer.arrProbability}% Xác suất Mở rộng Gói
                  </span>
                </div>
                <p className={styles.aiInsightCard__body}>
                  <strong>{customer.company}</strong> đang duy trì điểm sức khỏe hệ thống ở mức{' '}
                  <strong>{customer.healthScore}/100</strong>. Lưu lượng truy cập API tăng{' '}
                  <strong>+34% so với tháng trước</strong>. Khuyến nghị: Đề xuất gói hợp đồng đa
                  năm trước ngày <strong>{customer.nextFollowUp}</strong>.
                </p>
              </Card>

              {/* 3 Chỉ số tóm tắt */}
              <div className={styles.overviewMetricsGrid}>
                <Card padding="md">
                  <span className={styles.metricMiniLabel}>GIÁ TRỊ HỢP ĐỒNG NĂM</span>
                  <strong className={`${styles.metricMiniValue} tabular-nums`}>
                    {formatCurrency(customer.dealValue)}
                  </strong>
                  <span className={styles.metricMiniSub}>Thanh toán theo năm · Net 30</span>
                </Card>

                <Card padding="md">
                  <span className={styles.metricMiniLabel}>TƯƠNG TÁC GẦN NHẤT</span>
                  <strong className={styles.metricMiniValue}>{customer.lastContactedAt}</strong>
                  <span className={styles.metricMiniSub}>Bởi {customer.owner.name}</span>
                </Card>

                <Card padding="md">
                  <span className={styles.metricMiniLabel}>LỊCH HỌP ĐỊNH KỲ KẾ TIẾP</span>
                  <strong className={styles.metricMiniValue}>{customer.nextFollowUp}</strong>
                  <span className={styles.metricMiniSub}>Họp QBR & Đánh giá Bảo mật</span>
                </Card>
              </div>

              {/* Dòng thời gian hoạt động */}
              <Card padding="md">
                <div className={styles.cardSectionHeader}>
                  <h3>Dòng thời gian Hoạt động</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsActivityModalOpen(true)}
                  >
                    + Ghi nhận Hoạt động
                  </Button>
                </div>
                <ActivityFeed activities={customer.activities} showCompanyLink={false} />
              </Card>
            </motion.div>
          )}

          {activeTab === 'activities' && (
            <motion.div
              className={styles.tabContent}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card padding="md">
                <div className={styles.cardSectionHeader}>
                  <div>
                    <h3>Toàn bộ Lịch sử Tương tác</h3>
                    <p className={styles.cardSectionSub}>
                      Nhật ký chi tiết các cuộc gọi, email, biên bản họp và rà soát hợp đồng
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsActivityModalOpen(true)}
                  >
                    + Thêm Hoạt động
                  </Button>
                </div>
                <ActivityFeed activities={customer.activities} showCompanyLink={false} />
              </Card>
            </motion.div>
          )}

          {activeTab === 'notes' && (
            <motion.div
              className={styles.tabContent}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card padding="md">
                <form onSubmit={handleAddNote} className={styles.noteComposer}>
                  <label htmlFor="customer-note-input" className={styles.noteComposer__label}>
                    Thêm Ghi chú Nội bộ
                  </label>
                  <textarea
                    id="customer-note-input"
                    rows={3}
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder={`Nhập ghi chú về ngân sách, yêu cầu kỹ thuật hoặc tiến độ đàm phán với ${customer.company}...`}
                    className={styles.noteComposer__textarea}
                  />
                  <div className={styles.noteComposer__footer}>
                    <span>Hiển thị nội bộ cho Ban Quản trị & Kinh doanh</span>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      leftIcon={<Send size={14} />}
                    >
                      Lưu Ghi chú
                    </Button>
                  </div>
                </form>
              </Card>

              <div className={styles.notesList}>
                {customer.notes.map((note) => (
                  <Card key={note.id} padding="md" className={styles.noteCard}>
                    <div className={styles.noteCard__header}>
                      <div className={styles.noteCard__author}>
                        <Avatar src={note.authorAvatar} name={note.authorName} size="xs" />
                        <strong>{note.authorName}</strong>
                        <span>· {note.createdAt}</span>
                      </div>
                      {note.isPinned && (
                        <Badge tone="warning" size="sm">
                          <Pin size={11} /> Đã ghim
                        </Badge>
                      )}
                    </div>
                    <p className={styles.noteCard__content}>{note.content}</p>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'files' && (
            <motion.div
              className={styles.tabContent}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card padding="md">
                <div className={styles.cardSectionHeader}>
                  <div>
                    <h3>Kho Tài liệu & Hợp đồng Pháp lý</h3>
                    <p className={styles.cardSectionSub}>
                      Hợp đồng nguyên tắc (MSA), bảng câu hỏi bảo mật và tài liệu thuyết trình
                    </p>
                  </div>
                </div>

                <div className={styles.filesList}>
                  {customer.files.map((file) => (
                    <div key={file.id} className={styles.fileItem}>
                      <div className={styles.fileItem__icon}>
                        {file.type === 'PDF' ? (
                          <FileText size={20} />
                        ) : file.type === 'XLSX' ? (
                          <FileSpreadsheet size={20} />
                        ) : (
                          <Presentation size={20} />
                        )}
                      </div>
                      <div className={styles.fileItem__info}>
                        <strong>{file.name}</strong>
                        <span>
                          {file.size} · Tải lên ngày {file.uploadedAt} bởi {file.uploadedBy}
                        </span>
                      </div>
                      <Badge tone="neutral" size="sm">
                        {file.type}
                      </Badge>
                      <button
                        type="button"
                        className={styles.fileItem__downloadBtn}
                        aria-label={`Tải xuống ${file.name}`}
                        title="Tải xuống tài liệu"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Cột phải: Contact Card, Tags, Deal Value, Owner */}
        <CustomerDetailPanel customer={customer} />
      </div>

      {/* Modal Ghi nhận Hoạt động mới */}
      <Modal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        title={`Ghi nhận Tương tác — ${customer.company}`}
        subtitle={`Lưu nhật ký cuộc gọi, email hoặc buổi họp với ${customer.fullName}`}
      >
        <form onSubmit={handleCreateActivity} className={styles.activityModalForm}>
          <Input
            label="Tiêu đề hoạt động *"
            value={activityForm.title}
            onChange={(e) =>
              setActivityForm((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder="VD: Họp thống nhất báo giá Quý 3"
            required
          />
          <div className={styles.activityModalForm__field}>
            <label htmlFor="activity-desc">Nội dung chi tiết</label>
            <textarea
              id="activity-desc"
              rows={3}
              value={activityForm.description}
              onChange={(e) =>
                setActivityForm((prev) => ({ ...prev, description: e.target.value }))
              }
              className={styles.noteComposer__textarea}
              placeholder="Tóm tắt kết quả trao đổi và bước tiếp theo..."
            />
          </div>
          <div className={styles.activityModalForm__actions}>
            <Button variant="secondary" onClick={() => setIsActivityModalOpen(false)}>
              Hủy bỏ
            </Button>
            <Button type="submit" variant="primary">
              Lưu vào Dòng thời gian
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
