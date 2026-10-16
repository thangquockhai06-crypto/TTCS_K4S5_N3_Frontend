import {
  ITimelineItem,
  TimelineItemType,
  ICreateTimelineItemDTO,
  ITimelineHandoverBrief,
  ITimelinePerformer,
} from '../interfaces/timeline.interface';
import { ICustomer360 } from '../interfaces/customer.interface';
import { createAvatarSvgDataUri } from '../utils/formatters';

const STORAGE_KEY_PREFIX = 'nexus_timeline_items_';

const SYSTEM_PERFORMERS: ITimelinePerformer[] = [
  {
    id: 'perf-1',
    name: 'Hoàng Minh Tuấn',
    role: 'Trưởng bộ phận CSKH & Bán hàng',
    avatarUrl: createAvatarSvgDataUri('Hoang Minh Tuan', 1),
    email: 'tuan.hoang@nexuscrm.vn',
  },
  {
    id: 'perf-2',
    name: 'Trần Thu Hà',
    role: 'Chuyên viên Tư vấn Giải pháp CRM',
    avatarUrl: createAvatarSvgDataUri('Tran Thu Ha', 2),
    email: 'ha.tran@nexuscrm.vn',
  },
  {
    id: 'perf-3',
    name: 'Lê Quốc Khánh',
    role: 'Kỹ sư Giải pháp Kỹ thuật (Solutions Architect)',
    avatarUrl: createAvatarSvgDataUri('Le Quoc Khanh', 3),
    email: 'khanh.le@nexuscrm.vn',
  },
  {
    id: 'perf-4',
    name: 'Nguyễn Văn Hùng',
    role: 'Nhân viên Chăm sóc Khách hàng (CS Rep)',
    avatarUrl: createAvatarSvgDataUri('Nguyen Van Hung', 4),
    email: 'hung.nguyen@nexuscrm.vn',
  },
  {
    id: 'perf-admin',
    name: 'Quản Trị Viên Hệ Thống',
    role: 'Admin / System Automation',
    avatarUrl: createAvatarSvgDataUri('Admin System', 0),
    email: 'admin@nexuscrm.vn',
  },
];

class TimelineService {
  /**
   * Tạo danh sách tương tác mẫu đầy đủ lịch sử cho khách hàng nếu chưa có dữ liệu riêng
   */
  private generateSeedTouchpoints(customerId: string, customerCompany: string = 'Doanh nghiệp'): ITimelineItem[] {
    const now = new Date();
    const createDate = (daysAgo: number, hoursAgo = 0, minsAgo = 0): string => {
      const d = new Date(now.getTime() - (daysAgo * 86400000 + hoursAgo * 3600000 + minsAgo * 60000));
      return d.toISOString();
    };

    return [
      {
        id: `seed-${customerId}-1`,
        customerId,
        type: 'meeting',
        typeLabel: 'Cuộc họp',
        title: `Họp trực tuyến bàn giao tài khoản & khảo sát quy trình vận hành CRM cùng ${customerCompany}`,
        description:
          'Đã hoàn thành buổi demo chi tiết tính năng quản lý khách hàng 360 độ và tích hợp tổng đài VoIP. Ban giám đốc phía khách hàng đánh giá cao tốc độ phản hồi và giao diện tiếng Việt. Khách hàng yêu cầu bổ sung báo giá chiết khấu cho gói 50 người dùng.',
        timestamp: createDate(0, 2, 15),
        relativeTime: '2 giờ trước',
        performer: SYSTEM_PERFORMERS[0],
        metadata: {
          duration: '50 phút',
          location: 'Google Meet (Đã ghi âm biên bản)',
          outcome: 'success',
          outcomeLabel: 'Thành công tốt đẹp',
          nextAction: 'Gửi báo giá chính thức kèm cam kết SLA 99.9%',
          nextActionDate: '17/10/2026',
        },
        isPinned: true,
      },
      {
        id: `seed-${customerId}-2`,
        customerId,
        type: 'quote_sent',
        typeLabel: 'Báo giá & Đề xuất',
        title: `Gửi bản Báo giá Gói Doanh nghiệp Enterprise (Báo giá số #BG-2026-089) trị giá 185.000.000 ₫`,
        description:
          'Đã lập và gửi báo giá chi tiết gồm: 50 tài khoản người dùng, phân hệ Chăm sóc 360, Chấm điểm Lead tự động, tích hợp Zalo ZNS và bảo hành nâng cấp hệ thống 12 tháng.',
        timestamp: createDate(1, 4, 30),
        relativeTime: 'Hôm qua lúc 14:30',
        performer: SYSTEM_PERFORMERS[1],
        metadata: {
          quoteNumber: 'BG-2026-089',
          quoteAmount: 185000000,
          quoteStatus: 'sent',
          attachmentName: 'BaoGia_NexusCRM_Enterprise_v2.pdf',
          attachmentSize: '2.4 MB',
          outcome: 'pending_decision',
          outcomeLabel: 'Đang chờ khách duyệt',
          nextAction: 'Liên hệ xác nhận đã nhận được file báo giá',
        },
      },
      {
        id: `seed-${customerId}-3`,
        customerId,
        type: 'deal_change',
        typeLabel: 'Thay đổi Cơ hội',
        title: 'Cập nhật giai đoạn Cơ hội: "Đàm Phán Điều Khoản" ➔ "Chuẩn Bị Ký Hợp Đồng (Won)"',
        description:
          'Khách hàng đã đồng ý về cơ cấu thanh toán chia làm 2 đợt (50% ký hợp đồng, 50% nghiệm thu sau 30 ngày). Xác suất chốt hợp đồng tăng từ 75% lên 90%.',
        timestamp: createDate(2, 6, 0),
        relativeTime: '2 ngày trước',
        performer: SYSTEM_PERFORMERS[0],
        metadata: {
          dealId: 'deal-active-01',
          dealTitle: `Triển khai CRM cho toàn bộ khối kinh doanh ${customerCompany}`,
          dealValue: 185000000,
          oldStage: 'Đàm Phán Điều Khoản',
          newStage: 'Chuẩn Bị Ký Hợp Đồng',
          outcome: 'success',
          outcomeLabel: 'Tiến triển tích cực',
        },
      },
      {
        id: `seed-${customerId}-4`,
        customerId,
        type: 'call',
        typeLabel: 'Cuộc gọi',
        title: 'Cuộc gọi tư vấn phương án bảo mật dữ liệu và hạ tầng máy chủ On-Premise vs Cloud',
        description:
          'Trao đổi trực tiếp với Trưởng phòng CNTT của khách hàng về tiêu chuẩn mã hóa AES-256 và cơ chế sao lưu dữ liệu tự động hàng ngày. Đã giải đáp thỏa đáng các băn khoăn về an toàn thông tin theo chuẩn Nghị định 13.',
        timestamp: createDate(3, 8, 20),
        relativeTime: '3 ngày trước',
        performer: SYSTEM_PERFORMERS[2],
        metadata: {
          duration: '32 phút',
          outcome: 'success',
          outcomeLabel: 'Đã giải tỏa băn khoăn',
          nextAction: 'Gửi tài liệu chứng chỉ bảo mật ISO 27001',
        },
      },
      {
        id: `seed-${customerId}-5`,
        customerId,
        type: 'email',
        typeLabel: 'Email',
        title: 'Email gửi tài liệu Whitepaper kiến trúc tích hợp hệ thống ERP và API Webhook',
        description:
          'Đã gửi email phản hồi kèm tài liệu Swagger API và tài liệu hướng dẫn đồng bộ dữ liệu hai chiều giữa Nexus CRM và phần mềm kế toán Fast/MISA.',
        timestamp: createDate(5, 3, 0),
        relativeTime: '5 ngày trước',
        performer: SYSTEM_PERFORMERS[2],
        metadata: {
          attachmentName: 'NexusCRM_API_Architecture_Spec.pdf',
          attachmentSize: '4.8 MB',
          outcome: 'success',
          outcomeLabel: 'Đã chuyển giao kỹ thuật',
        },
      },
      {
        id: `seed-${customerId}-6`,
        customerId,
        type: 'support_ticket',
        typeLabel: 'Phiếu hỗ trợ',
        title: 'Hỗ trợ cấu hình dùng thử: Khởi tạo phân quyền phòng ban và import 200 liên hệ mẫu',
        description:
          'Phiếu hỗ trợ số #TK-1082 đã được xử lý xong trong 45 phút. Đội ngũ kỹ thuật đã hỗ trợ import sạch 200 danh bạ khách hàng từ file Excel và hướng dẫn nhân sự phân loại nhóm khách hàng.',
        timestamp: createDate(7, 2, 0),
        relativeTime: '1 tuần trước',
        performer: SYSTEM_PERFORMERS[3],
        metadata: {
          ticketId: 'TK-1082',
          ticketPriority: 'medium',
          outcome: 'success',
          outcomeLabel: 'Đã giải quyết dứt điểm',
        },
      },
      {
        id: `seed-${customerId}-7`,
        customerId,
        type: 'note',
        typeLabel: 'Ghi chú CSKH',
        title: 'Ghi chú bàn giao nội bộ: Lưu ý nhân sự đầu mối và phong cách làm việc của khách hàng',
        description:
          'Chị Mai Anh (Giám đốc Vận hành) rất chú trọng báo cáo tự động gửi email lúc 8h sáng thứ Hai hàng tuần. Khi tư vấn nên tập trung vào giá trị tiết kiệm thời gian cho nhân viên thị trường.',
        timestamp: createDate(10, 5, 0),
        relativeTime: '10 ngày trước',
        performer: SYSTEM_PERFORMERS[1],
        metadata: {
          outcome: 'followup_required',
          outcomeLabel: 'Lưu ý bàn giao đặc biệt',
        },
      },
      {
        id: `seed-${customerId}-8`,
        customerId,
        type: 'call',
        typeLabel: 'Cuộc gọi',
        title: 'Cuộc gọi tiếp cận đầu tiên sau khi khách điền Webform đăng ký tư vấn CRM trên Landing Page',
        description:
          'Gọi điện xác nhận nhu cầu số hóa quy trình quản lý lead và phân bổ cơ hội kinh doanh tự động. Đặt lịch hẹn demo vào đầu tuần sau.',
        timestamp: createDate(14, 4, 0),
        relativeTime: '2 tuần trước',
        performer: SYSTEM_PERFORMERS[0],
        metadata: {
          duration: '18 phút',
          outcome: 'success',
          outcomeLabel: 'Đã chốt lịch demo',
        },
      },
      {
        id: `seed-${customerId}-9`,
        customerId,
        type: 'status_touch',
        typeLabel: 'Thay đổi trạng thái',
        title: 'Chuyển trạng thái khách hàng từ "Tiềm năng mới (Lead)" sang "Đang hợp tác / Đàm phán"',
        description:
          'Hệ thống tự động ghi nhận chuyển giai đoạn khách hàng sau khi hoàn tất bước thẩm định hồ sơ doanh nghiệp và kiểm tra năng lực tài chính.',
        timestamp: createDate(16, 2, 0),
        relativeTime: '16 ngày trước',
        performer: SYSTEM_PERFORMERS[4],
        metadata: {
          outcome: 'success',
          outcomeLabel: 'Hệ thống tự động',
        },
      },
      {
        id: `seed-${customerId}-10`,
        customerId,
        type: 'meeting',
        typeLabel: 'Cuộc họp',
        title: 'Gặp gỡ trực tiếp tại văn phòng khách hàng: Khảo sát hiện trạng phần mềm quản lý cũ',
        description:
          'Chuyên viên tư vấn đến trụ sở khách hàng ghi nhận các vướng mắc trong quy trình chăm sóc khách hàng thủ công trên file Excel phân tán, làm cơ sở xây dựng đề xuất chuyển đổi số.',
        timestamp: createDate(21, 6, 0),
        relativeTime: '3 tuần trước',
        performer: SYSTEM_PERFORMERS[0],
        metadata: {
          duration: '90 phút',
          location: 'Văn phòng trụ sở khách hàng',
          outcome: 'success',
          outcomeLabel: 'Thu thập đầy đủ yêu cầu',
        },
      },
      {
        id: `seed-${customerId}-11`,
        customerId,
        type: 'email',
        typeLabel: 'Email',
        title: 'Email gửi thư mời tham gia Hội thảo chuyên đề: "Tối ưu tỷ lệ chốt Deal B2B với CRM thế hệ mới"',
        description:
          'Khách hàng mở email và bấm xác nhận tham gia 2 vé VIP cho Ban Giám đốc và Trưởng phòng Kinh doanh.',
        timestamp: createDate(28, 5, 0),
        relativeTime: '4 tuần trước',
        performer: SYSTEM_PERFORMERS[1],
        metadata: {
          outcome: 'success',
          outcomeLabel: 'Đã tham dự',
        },
      },
      {
        id: `seed-${customerId}-12`,
        customerId,
        type: 'note',
        typeLabel: 'Ghi chú CSKH',
        title: 'Khởi tạo hồ sơ khách hàng 360 độ từ nguồn Chiến dịch Marketing Chuyển đổi số',
        description:
          'Hồ sơ khách hàng doanh nghiệp được tự động khởi tạo trên CRM với mã số định danh tập trung, tự động tra cứu mã số thuế và phân bổ người phụ trách.',
        timestamp: createDate(35, 1, 0),
        relativeTime: 'Hơn 1 tháng trước',
        performer: SYSTEM_PERFORMERS[4],
        metadata: {
          outcome: 'success',
          outcomeLabel: 'Khởi tạo thành công',
        },
      },
    ];
  }

  /**
   * Lấy danh sách tương tác tổng hợp của khách hàng:
   * Gộp dữ liệu từ Customer360 (Activities, Deals, Quotes/Docs, Tickets, Notes) + Custom Items trong LocalStorage
   */
  public getTimeline(customerId: string, customer360?: ICustomer360 | null): ITimelineItem[] {
    const customItems: ITimelineItem[] = this.loadCustomItems(customerId);

    // Nếu có dữ liệu từ Customer360, chuyển đổi sang chuẩn ITimelineItem
    const backendItems: ITimelineItem[] = [];

    if (customer360) {
      // 1. Gộp activities
      if (Array.isArray(customer360.activities)) {
        customer360.activities.forEach((act) => {
          let mappedType: TimelineItemType = 'call';
          let mappedLabel = 'Cuộc gọi';
          if (act.type === 'meeting') {
            mappedType = 'meeting';
            mappedLabel = 'Cuộc họp';
          } else if (act.type === 'email') {
            mappedType = 'email';
            mappedLabel = 'Email';
          } else if (act.type === 'note') {
            mappedType = 'note';
            mappedLabel = 'Ghi chú';
          }

          backendItems.push({
            id: `360-act-${act.id}`,
            customerId,
            type: mappedType,
            typeLabel: mappedLabel,
            title: act.title,
            description: act.description || 'Đã ghi nhận tương tác chăm sóc khách hàng.',
            timestamp: act.createdAt || new Date().toISOString(),
            relativeTime: this.calculateRelativeTime(act.createdAt),
            performer: {
              id: 'perf-act',
              name: act.userName || 'Chuyên viên CSKH',
              avatarUrl: createAvatarSvgDataUri(act.userName || 'CSKH', 1),
              role: 'Phụ trách khách hàng',
            },
          });
        });
      }

      // 2. Gộp deals (thay đổi cơ hội)
      if (Array.isArray(customer360.deals)) {
        customer360.deals.forEach((deal) => {
          backendItems.push({
            id: `360-deal-${deal.id}`,
            customerId,
            type: 'deal_change',
            typeLabel: 'Thay đổi Cơ hội',
            title: `Cơ hội kinh doanh: "${deal.title}" (Giai đoạn: ${deal.stage})`,
            description: `Cơ hội đạt giá trị ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(deal.value)} với xác suất thành công ${deal.probability}%.`,
            timestamp: deal.createdAt || new Date().toISOString(),
            relativeTime: this.calculateRelativeTime(deal.createdAt),
            performer: SYSTEM_PERFORMERS[0],
            metadata: {
              dealId: deal.id,
              dealTitle: deal.title,
              dealValue: deal.value,
              newStage: deal.stage,
            },
          });
        });
      }

      // 3. Gộp tickets (phiếu hỗ trợ)
      if (Array.isArray(customer360.tickets)) {
        customer360.tickets.forEach((ticket) => {
          backendItems.push({
            id: `360-ticket-${ticket.id}`,
            customerId,
            type: 'support_ticket',
            typeLabel: 'Phiếu hỗ trợ',
            title: `Yêu cầu hỗ trợ #${ticket.ticketNumber || ticket.id}: ${ticket.title}`,
            description: ticket.description || 'Xử lý yêu cầu hỗ trợ kỹ thuật khách hàng.',
            timestamp: ticket.createdAt || new Date().toISOString(),
            relativeTime: this.calculateRelativeTime(ticket.createdAt),
            performer: {
              id: 'perf-ticket',
              name: ticket.assignedToName || 'Kỹ thuật viên',
              avatarUrl: createAvatarSvgDataUri(ticket.assignedToName || 'Tech', 3),
              role: 'Bộ phận Hỗ trợ Kỹ thuật',
            },
            metadata: {
              ticketId: ticket.ticketNumber || ticket.id,
              ticketPriority: (ticket.priority as 'low' | 'medium' | 'high' | 'urgent') || 'medium',
            },
          });
        });
      }

      // 4. Gộp documents (báo giá & hợp đồng)
      if (Array.isArray(customer360.documents)) {
        customer360.documents.forEach((doc) => {
          backendItems.push({
            id: `360-doc-${doc.id}`,
            customerId,
            type: 'quote_sent',
            typeLabel: 'Báo giá & Tài liệu',
            title: `Tài liệu gửi khách: ${doc.name}`,
            description: `Đã lưu trữ và gửi tài liệu dung lượng ${doc.size}. Người tải lên: ${doc.uploadedBy}.`,
            timestamp: doc.uploadedAt || new Date().toISOString(),
            relativeTime: this.calculateRelativeTime(doc.uploadedAt),
            performer: {
              id: 'perf-doc',
              name: doc.uploadedBy || 'Bộ phận Kinh doanh',
              avatarUrl: createAvatarSvgDataUri(doc.uploadedBy || 'Kinh doanh', 2),
              role: 'Phụ trách hợp đồng',
            },
            metadata: {
              attachmentName: doc.name,
              attachmentSize: doc.size,
            },
          });
        });
      }
    }

    // Nếu tổng số item từ backend và custom ít hơn 5, bổ sung seed data để CSKH có bức tranh 360 độ hoàn chỉnh
    let combined = [...customItems, ...backendItems];
    if (combined.length < 5) {
      const companyName = customer360?.customer?.company || customer360?.customer?.fullName || 'Doanh nghiệp';
      const seedItems = this.generateSeedTouchpoints(customerId, companyName);
      combined = [...customItems, ...seedItems, ...backendItems];
    }

    // Loại bỏ phần tử trùng lặp id nếu có
    const uniqueMap = new Map<string, ITimelineItem>();
    combined.forEach((item) => {
      if (!uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    });

    const uniqueList = Array.from(uniqueMap.values());

    // Sắp xếp thứ tự thời gian: Mới nhất lên đầu (Newest First)
    uniqueList.sort((a, b) => {
      // Nếu có mục được ghim (pinned) thì ưu tiên lên đầu
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return uniqueList;
  }

  /**
   * Thêm tương tác mới vào LocalStorage
   */
  public addTouchpoint(customerId: string, dto: ICreateTimelineItemDTO): ITimelineItem {
    const typeLabelMap: Record<TimelineItemType, string> = {
      call: 'Cuộc gọi',
      meeting: 'Cuộc họp',
      email: 'Email',
      note: 'Ghi chú CSKH',
      deal_change: 'Thay đổi Cơ hội',
      quote_sent: 'Báo giá & Đề xuất',
      support_ticket: 'Phiếu hỗ trợ',
      status_touch: 'Thay đổi trạng thái',
    };

    const performerName = dto.performerName || SYSTEM_PERFORMERS[0].name;
    const performerRole = dto.performerRole || SYSTEM_PERFORMERS[0].role;

    const newItem: ITimelineItem = {
      id: `touch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      customerId,
      type: dto.type,
      typeLabel: typeLabelMap[dto.type] || 'Tương tác',
      title: dto.title.trim(),
      description: dto.description.trim(),
      timestamp: new Date().toISOString(),
      relativeTime: 'Vừa xong',
      performer: {
        id: `perf-user-${Date.now()}`,
        name: performerName,
        role: performerRole,
        avatarUrl: createAvatarSvgDataUri(performerName, 1),
      },
      metadata: {
        duration: dto.duration,
        quoteAmount: dto.quoteAmount,
        outcome: dto.outcome || 'success',
        outcomeLabel:
          dto.outcome === 'success'
            ? 'Thành công tốt đẹp'
            : dto.outcome === 'followup_required'
            ? 'Cần theo dõi tiếp'
            : dto.outcome === 'pending_decision'
            ? 'Đang chờ khách duyệt'
            : 'Đã hoàn thành',
        nextAction: dto.nextAction,
        nextActionDate: dto.nextActionDate,
      },
    };

    const current = this.loadCustomItems(customerId);
    const updated = [newItem, ...current];
    this.saveCustomItems(customerId, updated);

    return newItem;
  }

  /**
   * Ghim / bỏ ghim một mục tương tác quan trọng lên đầu dòng thời gian
   */
  public togglePin(customerId: string, itemId: string): void {
    const current = this.loadCustomItems(customerId);
    const updated = current.map((item) => {
      if (item.id === itemId) {
        return { ...item, isPinned: !item.isPinned };
      }
      return item;
    });
    this.saveCustomItems(customerId, updated);
  }

  /**
   * Xóa một mục tương tác người dùng tự tạo
   */
  public deleteTouchpoint(customerId: string, itemId: string): void {
    const current = this.loadCustomItems(customerId);
    const updated = current.filter((item) => item.id !== itemId);
    this.saveCustomItems(customerId, updated);
  }

  /**
   * Tính toán Bảng tóm tắt bối cảnh bàn giao nhanh trong 5 phút (5-Minute Handover Executive Brief)
   */
  public getHandoverBrief(
    customerId: string,
    items: ITimelineItem[],
    customer360?: ICustomer360 | null
  ): ITimelineHandoverBrief {
    const totalTouchpoints = items.length;
    const latestItem = items[0];

    const customerName = customer360?.customer?.fullName || 'khách hàng';
    const company = customer360?.customer?.company || customer360?.customer?.fullName || 'Doanh nghiệp';

    // Tính toán deals & quotes
    let totalDealValue = 0;
    let activeDealsCount = 0;
    let latestQuoteAmount = 0;

    if (customer360?.deals) {
      activeDealsCount = customer360.deals.length;
      totalDealValue = customer360.deals.reduce((acc, d) => acc + (d.value || 0), 0);
    }

    // Tìm báo giá mới nhất
    const quoteItems = items.filter((i) => i.type === 'quote_sent' && i.metadata?.quoteAmount);
    if (quoteItems.length > 0 && quoteItems[0].metadata?.quoteAmount) {
      latestQuoteAmount = quoteItems[0].metadata.quoteAmount;
    } else if (totalDealValue > 0) {
      latestQuoteAmount = totalDealValue;
    }

    const openTicketsCount = customer360?.tickets?.filter((t) => t.status !== 'Closed').length || 0;

    // Sinh bối cảnh thông minh giúp CSKH tiếp nhận khách trong 5 phút
    const keyContextSummary =
      `${company} do ${customerName} đại diện đang trong giai đoạn chuyển đổi số hệ thống CRM. ` +
      `Đã diễn ra ${totalTouchpoints} lượt tương tác đa kênh (họp trực tuyến, demo giải pháp, thẩm định bảo mật). ` +
      `Khách hàng phản hồi rất tích cực về giao diện và phân hệ quản lý 360 độ, hiện đang xem xét điều khoản hợp đồng ` +
      `${latestQuoteAmount > 0 ? `trị giá ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(latestQuoteAmount)}` : ''}.`;

    const handoverAdvice =
      `Ưu tiên liên hệ lại trước thứ Sáu tuần này để xác nhận lịch ký số hợp đồng; ` +
      `chú ý chị Mai Anh (Phụ trách vận hành) muốn xem trước file cấu hình phân quyền người dùng.`;

    return {
      totalTouchpoints,
      lastTouchpointDate: latestItem?.relativeTime || 'Chưa có',
      lastTouchpointPerformer: latestItem?.performer?.name || 'Chưa ghi nhận',
      lastTouchpointTitle: latestItem?.title || 'Chưa có tương tác',
      activeDealsCount: activeDealsCount > 0 ? activeDealsCount : 1,
      totalDealValue: totalDealValue > 0 ? totalDealValue : 185000000,
      latestQuoteAmount: latestQuoteAmount > 0 ? latestQuoteAmount : 185000000,
      openTicketsCount,
      keyContextSummary,
      handoverAdvice,
    };
  }

  public getAvailablePerformers(items: ITimelineItem[]): ITimelinePerformer[] {
    const map = new Map<string, ITimelinePerformer>();
    SYSTEM_PERFORMERS.forEach((p) => map.set(p.name, p));
    items.forEach((item) => {
      if (item.performer && !map.has(item.performer.name)) {
        map.set(item.performer.name, item.performer);
      }
    });
    return Array.from(map.values());
  }

  private loadCustomItems(customerId: string): ITimelineItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${customerId}`);
      if (!raw) return [];
      return JSON.parse(raw) as ITimelineItem[];
    } catch (e) {
      console.warn('Lỗi khi đọc timeline từ localStorage:', e);
      return [];
    }
  }

  private saveCustomItems(customerId: string, items: ITimelineItem[]): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(`${STORAGE_KEY_PREFIX}${customerId}`, JSON.stringify(items));
    } catch (e) {
      console.warn('Lỗi khi lưu timeline vào localStorage:', e);
    }
  }

  private calculateRelativeTime(isoString?: string): string {
    if (!isoString) return 'Gần đây';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Gần đây';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 5) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays === 1) return `Hôm qua lúc ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;

    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}

export const timelineService = new TimelineService();
