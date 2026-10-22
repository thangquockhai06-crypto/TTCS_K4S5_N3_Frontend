import { axiosInstance, API_BASE_URL } from '../utils/axiosInstance';
import {
  IQuote,
  IQuoteLineItem,
  IProductCatalogItem,
  IQuoteApprovalHistoryEntry,
  QuoteApprovalActionType,
  QuoteApprovalLevelType,
  QuoteStatusType,
  IQuoteCompareResult,
  IQuoteComparison,
  IQuoteLineItemDiff,
  ITermsDiff,
  ICreateQuoteDTO,
  IUpdateQuoteDTO,
} from '../interfaces/quote.interface';
import { IDeal } from '../interfaces/deal.interface';
import { IContract, ICreateContractDTO } from '../interfaces/contract.interface';

const QUOTES_STORAGE_KEY = 'nexus_quotes_master_list';
const DEFAULT_DISCOUNT_THRESHOLD_PERCENT = 15;
const DIRECTOR_DISCOUNT_THRESHOLD_PERCENT = 20;

const PRODUCT_CATALOG: IProductCatalogItem[] = [
  {
    id: 'prod-crm-ent',
    code: 'NEX-CRM-ENT',
    name: 'Phần mềm Nexus CRM Doanh Nghiệp (Enterprise Edition)',
    category: 'Phần mềm SaaS',
    unit: 'User/Năm',
    unitPrice: 3600000,
    description: 'Bản quyền phân hệ Khách hàng 360, Quản lý Cơ hội & Pipeline, Tự động hóa CSKH',
    defaultVatRate: 10,
  },
  {
    id: 'prod-crm-pro',
    code: 'NEX-CRM-PRO',
    name: 'Phần mềm Nexus CRM Chuyên Nghiệp (Professional)',
    category: 'Phần mềm SaaS',
    unit: 'User/Năm',
    unitPrice: 2400000,
    description: 'Phân hệ Lead, Deal, Quản lý đội ngũ kinh doanh và báo cáo trực quan',
    defaultVatRate: 10,
  },
  {
    id: 'prod-voip-cloud',
    code: 'NEX-VOIP-CLD',
    name: 'Tổng đài VoIP Cloud tích hợp Click-to-Call & Ghi âm',
    category: 'Viễn thông & Tích hợp',
    unit: 'Line/Tháng',
    unitPrice: 350000,
    description: 'Tự động hiển thị popup hồ sơ khách khi có cuộc gọi đến, ghi âm cuộc gọi gắn vào Timeline',
    defaultVatRate: 10,
  },
  {
    id: 'prod-zns-gateway',
    code: 'NEX-ZNS-GATE',
    name: 'Cổng tích hợp Zalo ZNS & SMS Brandname đa nhà mạng',
    category: 'Giao tiếp & Tin nhắn',
    unit: 'Gói tích hợp',
    unitPrice: 15000000,
    description: 'Tự động gửi thông báo hóa đơn, nhắc lịch hẹn và chăm sóc khách hàng tự động',
    defaultVatRate: 10,
  },
  {
    id: 'prod-ai-scoring',
    code: 'NEX-AI-SCORE',
    name: 'Module AI Lead Scoring & Tự động phân bổ thông minh',
    category: 'Trí tuệ nhân tạo (AI)',
    unit: 'Gói triển khai',
    unitPrice: 25000000,
    description: 'Chấm điểm Lead tự động theo hành vi, phân bổ nhân viên theo chuyên môn',
    defaultVatRate: 10,
  },
  {
    id: 'prod-onboarding',
    code: 'NEX-SVC-TRAIN',
    name: 'Dịch vụ Onboarding & Đào tạo chuyển giao công nghệ',
    category: 'Dịch vụ chuyên gia',
    unit: 'Gói dịch vụ',
    unitPrice: 12000000,
    description: 'Khảo sát quy trình, import dữ liệu từ Excel cũ và đào tạo thực chiến 4 buổi',
    defaultVatRate: 8,
  },
  {
    id: 'prod-custom-api',
    code: 'NEX-SVC-API',
    name: 'Tích hợp hai chiều API với Hệ thống Kế toán (MISA / Fast)',
    category: 'Dịch vụ chuyên gia',
    unit: 'Cổng tích hợp',
    unitPrice: 30000000,
    description: 'Đồng bộ tự động thông tin khách hàng, đơn hàng, hóa đơn và công nợ',
    defaultVatRate: 10,
  },
];

const SAMPLE_QUOTES: IQuote[] = [
  {
    id: 'quote-s7-01',
    quoteNumber: 'BG-2026-0089',
    version: 2,
    versionLabel: 'v2.0 (Đàm phán giảm 5% & bổ sung VoIP)',
    changeSummary: 'Giảm 5% đơn giá phần mềm SaaS và giữ nguyên chi phí triển khai theo thỏa thuận',
    dealId: 'deal-101',
    dealTitle: 'Mistral AI — Hạ tầng Đám mây Enterprise',
    customerId: 'cust-005',
    customerName: 'Amélie Laurent',
    customerCompany: 'Mistral AI Labs',
    customerEmail: 'amelie@mistral.ai',
    customerPhone: '0908889999',
    customerAddress: 'Tòa nhà Landmark 81, P. 22, Q. Bình Thạnh, TP. HCM',
    customerTaxCode: '0108899881',
    items: [
      {
        id: 'item-01-1',
        productId: 'prod-crm-ent',
        productCode: 'NEX-CRM-ENT',
        productName: 'Phần mềm Nexus CRM Doanh Nghiệp (Enterprise Edition)',
        description: 'Bản quyền phân hệ Khách hàng 360, Quản lý Cơ hội & Pipeline, Tự động hóa CSKH (50 Users)',
        quantity: 50,
        unit: 'User/Năm',
        unitPrice: 3600000,
        discountType: 'percent',
        discountValue: 5,
        discountAmount: 9000000,
        floorPrice: 2000000,
        vatRate: 10,
        vatAmount: 17100000,
        lineTotal: 188100000,
      },
      {
        id: 'item-01-2',
        productId: 'prod-voip-cloud',
        productCode: 'NEX-VOIP-CLD',
        productName: 'Tổng đài VoIP Cloud tích hợp Click-to-Call & Ghi âm',
        description: 'Tự động hiển thị popup hồ sơ khách khi có cuộc gọi đến, ghi âm cuộc gọi gắn vào Timeline',
        quantity: 20,
        unit: 'Line/Tháng',
        unitPrice: 350000,
        discountType: 'percent',
        discountValue: 0,
        discountAmount: 0,
        floorPrice: 200000,
        vatRate: 10,
        vatAmount: 700000,
        lineTotal: 7700000,
      },
      {
        id: 'item-01-3',
        productId: 'prod-ai-scoring',
        productCode: 'NEX-AI-SCORE',
        productName: 'Module AI Lead Scoring & Tự động phân bổ thông minh',
        description: 'Chấm điểm Lead tự động theo hành vi, phân bổ nhân viên theo chuyên môn',
        quantity: 1,
        unit: 'Gói triển khai',
        unitPrice: 25000000,
        discountType: 'percent',
        discountValue: 0,
        discountAmount: 0,
        floorPrice: 15000000,
        vatRate: 10,
        vatAmount: 2500000,
        lineTotal: 27500000,
      },
    ],
    subtotal: 212000000,
    totalDiscountAmount: 9000000,
    totalDiscountPercent: 4.25,
    totalVatAmount: 20300000,
    grandTotal: 223300000,
    discountThresholdPercent: 15,
    requiresApproval: false,
    validUntil: '2026-12-31',
    paymentTerms: 'Chia làm 2 đợt: Đợt 1 thanh toán 50% sau khi ký hợp đồng, đợt 2 thanh toán 50% sau khi nghiệm thu.',
    deliveryTerms: 'Kích hoạt tài khoản và triển khai hệ thống trong vòng 24 giờ sau khi ký hợp đồng.',
    notes: 'Báo giá đã bao gồm gói đào tạo sử dụng hệ thống trực tuyến cho toàn bộ nhân viên.',
    status: 'accepted',
    isEffective: true,
    parentQuoteId: 'quote-s7-01-v1',
    accessToken: 'token-portal-mistral-2026',
    shareUrl: '/portal/quotes/token-portal-mistral-2026',
    totalInWords: 'Hai trăm hai mươi ba triệu ba trăm nghìn đồng chẵn',
    createdAt: '2026-10-18T08:00:00.000Z',
    updatedAt: '2026-10-20T10:15:00.000Z',
    createdBy: 'Trần Văn Hùng',
    creatorRole: 'Chuyên viên Tư vấn Doanh nghiệp',
    approvalHistory: [
      {
        id: 'appr-01-1',
        action: 'auto_approved',
        performedBy: 'Hệ thống NexusCRM',
        performedByRole: 'Hệ thống',
        comment: 'Tự động duyệt: Mức chiết khấu 4.25% nằm trong hạn mức cho phép (<= 10%).',
        createdAt: '2026-10-18T08:30:00.000Z',
      },
      {
        id: 'appr-01-2',
        action: 'sent',
        performedBy: 'Trần Văn Hùng',
        performedByRole: 'Chuyên viên Kinh doanh',
        comment: 'Đã phát hành báo giá tới Cổng thông tin khách hàng trực tuyến.',
        createdAt: '2026-10-18T09:00:00.000Z',
      },
      {
        id: 'appr-01-3',
        action: 'approved',
        performedBy: 'Amélie Laurent (Khách hàng)',
        performedByRole: 'Đại diện Khách hàng',
        comment: 'Khách hàng đã ký duyệt chấp thuận trực tuyến qua Portal.',
        createdAt: '2026-10-20T10:15:00.000Z',
      },
    ],
  },
  {
    id: 'quote-s7-01-v1',
    quoteNumber: 'BG-2026-0089',
    version: 1,
    versionLabel: 'v1.0 (Bản thảo đề xuất ban đầu)',
    changeSummary: 'Khởi tạo báo giá ban đầu theo giá niêm yết',
    dealId: 'deal-101',
    dealTitle: 'Mistral AI — Hạ tầng Đám mây Enterprise',
    customerId: 'cust-005',
    customerName: 'Amélie Laurent',
    customerCompany: 'Mistral AI Labs',
    customerEmail: 'amelie@mistral.ai',
    customerPhone: '0908889999',
    customerAddress: 'Tòa nhà Landmark 81, P. 22, Q. Bình Thạnh, TP. HCM',
    customerTaxCode: '0108899881',
    items: [
      {
        id: 'item-01v1-1',
        productId: 'prod-crm-ent',
        productCode: 'NEX-CRM-ENT',
        productName: 'Phần mềm Nexus CRM Doanh Nghiệp (Enterprise Edition)',
        description: 'Bản quyền phân hệ Khách hàng 360, Quản lý Cơ hội & Pipeline, Tự động hóa CSKH (50 Users)',
        quantity: 50,
        unit: 'User/Năm',
        unitPrice: 3600000,
        discountType: 'percent',
        discountValue: 0,
        discountAmount: 0,
        floorPrice: 2000000,
        vatRate: 10,
        vatAmount: 18000000,
        lineTotal: 198000000,
      },
      {
        id: 'item-01v1-2',
        productId: 'prod-voip-cloud',
        productCode: 'NEX-VOIP-CLD',
        productName: 'Tổng đài VoIP Cloud tích hợp Click-to-Call & Ghi âm',
        description: 'Tự động hiển thị popup hồ sơ khách khi có cuộc gọi đến, ghi âm cuộc gọi gắn vào Timeline',
        quantity: 20,
        unit: 'Line/Tháng',
        unitPrice: 350000,
        discountType: 'percent',
        discountValue: 0,
        discountAmount: 0,
        floorPrice: 200000,
        vatRate: 10,
        vatAmount: 700000,
        lineTotal: 7700000,
      },
    ],
    subtotal: 187000000,
    totalDiscountAmount: 0,
    totalDiscountPercent: 0,
    totalVatAmount: 18700000,
    grandTotal: 205700000,
    discountThresholdPercent: 15,
    requiresApproval: false,
    validUntil: '2026-12-31',
    paymentTerms: 'Thanh toán 100% trong vòng 15 ngày kể từ ngày nghiệm thu.',
    deliveryTerms: 'Bàn giao trong vòng 24 giờ.',
    status: 'draft',
    isEffective: false,
    totalInWords: 'Hai trăm linh năm triệu bảy trăm nghìn đồng chẵn',
    createdAt: '2026-10-15T09:00:00.000Z',
    updatedAt: '2026-10-15T09:00:00.000Z',
    createdBy: 'Trần Văn Hùng',
    creatorRole: 'Chuyên viên Tư vấn Doanh nghiệp',
  },
  {
    id: 'quote-s7-02',
    quoteNumber: 'BG-2026-0092',
    version: 1,
    versionLabel: 'v1.0 (Đề xuất chiết khấu 18% cho FPT Software)',
    dealId: 'deal-01',
    dealTitle: 'Triển khai CRM cho Tập đoàn FPT Software',
    customerId: 'cust-01',
    customerName: 'Nguyễn Văn An',
    customerCompany: 'Tập đoàn FPT Software',
    customerTaxCode: '0101248141',
    customerEmail: 'annv@fpt.com',
    customerPhone: '0912345678',
    customerAddress: 'Tòa nhà FPT Cầu Giấy, Duy Tân, Hà Nội',
    items: [
      {
        id: 'item-02-1',
        productId: 'prod-ai-scoring',
        productCode: 'NEX-AI-SCORE',
        productName: 'Module AI Lead Scoring & Tự động phân bổ thông minh',
        description: 'Chấm điểm Lead tự động theo hành vi, phân bổ nhân viên theo chuyên môn',
        quantity: 2,
        unit: 'Gói triển khai',
        unitPrice: 25000000,
        discountType: 'percent',
        discountValue: 18,
        discountAmount: 9000000,
        floorPrice: 15000000,
        vatRate: 10,
        vatAmount: 4100000,
        lineTotal: 45100000,
      },
      {
        id: 'item-02-2',
        productId: 'prod-zns-gateway',
        productCode: 'NEX-ZNS-GATE',
        productName: 'Cổng tích hợp Zalo ZNS & SMS Brandname đa nhà mạng',
        description: 'Tự động gửi thông báo hóa đơn, nhắc lịch hẹn và chăm sóc khách hàng tự động',
        quantity: 1,
        unit: 'Gói tích hợp',
        unitPrice: 15000000,
        discountType: 'percent',
        discountValue: 18,
        discountAmount: 2700000,
        floorPrice: 10000000,
        vatRate: 10,
        vatAmount: 1230000,
        lineTotal: 13530000,
      },
    ],
    subtotal: 65000000,
    totalDiscountAmount: 11700000,
    totalDiscountPercent: 18,
    totalVatAmount: 5330000,
    grandTotal: 58630000,
    discountThresholdPercent: 10,
    requiresApproval: true,
    approvalLevel: 'team_leader',
    validUntil: '2026-11-30',
    paymentTerms: 'Thanh toán 100% trong vòng 30 ngày.',
    deliveryTerms: 'Triển khai trong 14 ngày làm việc.',
    notes: 'Khách hàng yêu cầu hỗ trợ tích hợp Zalo OA có sẵn của doanh nghiệp.',
    status: 'pending_approval',
    isEffective: true,
    totalInWords: 'Năm mươi tám triệu sáu trăm ba mươi nghìn đồng chẵn',
    createdAt: '2026-10-21T08:30:00.000Z',
    updatedAt: '2026-10-21T08:30:00.000Z',
    createdBy: 'Lê Minh Tuấn',
    creatorRole: 'Chuyên viên Kinh doanh',
    approvalHistory: [
      {
        id: 'appr-02-1',
        action: 'sent',
        performedBy: 'Lê Minh Tuấn',
        performedByRole: 'Chuyên viên Kinh doanh',
        comment: 'Trình Trưởng nhóm phê duyệt mức chiết khấu 18% cho khách hàng VIP FPT.',
        createdAt: '2026-10-21T08:30:00.000Z',
      },
    ],
  },
  {
    id: 'quote-s7-03',
    quoteNumber: 'BG-2026-0095',
    version: 1,
    versionLabel: 'v1.0 (Chiết khấu 25% gói Enterprise 100 Users)',
    dealId: 'deal-103',
    dealTitle: 'Vingroup Enterprise — Chuyển đổi số Quản trị',
    customerId: 'cust-003',
    customerName: 'Phạm Nhật Minh',
    customerCompany: 'Vingroup Corporation',
    customerTaxCode: '0101234567',
    customerEmail: 'minh.pn@vingroup.net',
    customerPhone: '0988776655',
    customerAddress: 'Số 7 Đường Bằng Lăng 1, KĐT Vinhomes Riverside, Long Biên, Hà Nội',
    items: [
      {
        id: 'item-03-1',
        productId: 'prod-crm-ent',
        productCode: 'NEX-CRM-ENT',
        productName: 'Phần mềm Nexus CRM Doanh Nghiệp (Enterprise Edition)',
        description: 'Bản quyền trọn gói 100 Users cho toàn bộ khối kinh doanh Bất động sản và Dịch vụ',
        quantity: 100,
        unit: 'User/Năm',
        unitPrice: 3600000,
        discountType: 'percent',
        discountValue: 25,
        discountAmount: 90000000,
        floorPrice: 2000000,
        vatRate: 10,
        vatAmount: 27000000,
        lineTotal: 297000000,
      },
      {
        id: 'item-03-2',
        productId: 'prod-custom-api',
        productCode: 'NEX-SVC-API',
        productName: 'Tích hợp hai chiều API với Hệ thống Kế toán (MISA / Fast)',
        description: 'Đồng bộ tự động thông tin khách hàng, đơn hàng, hóa đơn và công nợ',
        quantity: 1,
        unit: 'Cổng tích hợp',
        unitPrice: 30000000,
        discountType: 'percent',
        discountValue: 25,
        discountAmount: 7500000,
        floorPrice: 18000000,
        vatRate: 10,
        vatAmount: 2250000,
        lineTotal: 24750000,
      },
    ],
    subtotal: 390000000,
    totalDiscountAmount: 97500000,
    totalDiscountPercent: 25,
    totalVatAmount: 29250000,
    grandTotal: 321750000,
    discountThresholdPercent: 20,
    requiresApproval: true,
    approvalLevel: 'director',
    validUntil: '2026-11-25',
    paymentTerms: 'Thanh toán 100% trong 45 ngày.',
    deliveryTerms: 'Bàn giao và triển khai toàn diện trong 30 ngày.',
    notes: 'Chiết khấu 25% vượt thẩm quyền Trưởng nhóm, yêu cầu Giám đốc kinh doanh duyệt.',
    status: 'pending_approval',
    isEffective: true,
    totalInWords: 'Ba trăm hai mươi mốt triệu bảy trăm năm mươi nghìn đồng chẵn',
    createdAt: '2026-10-21T14:00:00.000Z',
    updatedAt: '2026-10-21T14:00:00.000Z',
    createdBy: 'Hoàng Minh Châu',
    creatorRole: 'Trưởng nhóm Kinh doanh',
    approvalHistory: [
      {
        id: 'appr-03-1',
        action: 'sent',
        performedBy: 'Hoàng Minh Châu',
        performedByRole: 'Trưởng nhóm Kinh doanh',
        comment: 'Đề xuất Giám đốc phê duyệt mức giảm giá 25% cho hợp đồng dài hạn của Vingroup.',
        createdAt: '2026-10-21T14:00:00.000Z',
      },
    ],
  },
  {
    id: 'quote-s7-04',
    quoteNumber: 'BG-2026-0078',
    version: 1,
    versionLabel: 'v1.0 (Phần mềm chuyên nghiệp & Đào tạo Onboarding)',
    dealId: 'deal-102',
    dealTitle: 'Viettel Solutions — Giải pháp CRM Bưu chính',
    customerId: 'cust-002',
    customerName: 'Lê Hoàng Nam',
    customerCompany: 'Viettel Solutions',
    customerTaxCode: '0100109106',
    customerEmail: 'namlh@viettel.com.vn',
    customerPhone: '0981234567',
    customerAddress: 'Số 1 Giang Văn Minh, Ba Đình, Hà Nội',
    items: [
      {
        id: 'item-04-1',
        productId: 'prod-crm-pro',
        productCode: 'NEX-CRM-PRO',
        productName: 'Phần mềm Nexus CRM Chuyên Nghiệp (Professional)',
        description: 'Phân hệ Lead, Deal, Quản lý đội ngũ kinh doanh và báo cáo trực quan (20 Users)',
        quantity: 20,
        unit: 'User/Năm',
        unitPrice: 2400000,
        discountType: 'percent',
        discountValue: 8,
        discountAmount: 3840000,
        floorPrice: 1500000,
        vatRate: 10,
        vatAmount: 4416000,
        lineTotal: 48576000,
      },
      {
        id: 'item-04-2',
        productId: 'prod-onboarding',
        productCode: 'NEX-SVC-TRAIN',
        productName: 'Dịch vụ Onboarding & Đào tạo chuyển giao công nghệ',
        description: 'Khảo sát quy trình, import dữ liệu từ Excel cũ và đào tạo thực chiến 4 buổi',
        quantity: 1,
        unit: 'Gói dịch vụ',
        unitPrice: 12000000,
        discountType: 'percent',
        discountValue: 8,
        discountAmount: 960000,
        floorPrice: 8000000,
        vatRate: 8,
        vatAmount: 883200,
        lineTotal: 11923200,
      },
    ],
    subtotal: 60000000,
    totalDiscountAmount: 4800000,
    totalDiscountPercent: 8,
    totalVatAmount: 5299200,
    grandTotal: 60499200,
    discountThresholdPercent: 10,
    requiresApproval: false,
    approvalLevel: 'team_leader',
    validUntil: '2026-11-15',
    paymentTerms: 'Thanh toán 100% trong vòng 15 ngày kể từ ngày nghiệm thu.',
    deliveryTerms: 'Bàn giao tài khoản trong vòng 24 giờ sau khi ký kết.',
    status: 'approved',
    isEffective: true,
    totalInWords: 'Sáu mươi triệu bốn trăm chín mươi chín nghìn hai trăm đồng',
    createdAt: '2026-10-17T11:00:00.000Z',
    updatedAt: '2026-10-17T11:00:00.000Z',
    createdBy: 'Vũ Quốc Khánh',
    creatorRole: 'Chuyên viên Tư vấn Doanh nghiệp',
    approvalHistory: [
      {
        id: 'appr-04-1',
        action: 'auto_approved',
        performedBy: 'Hệ thống NexusCRM',
        performedByRole: 'Hệ thống',
        comment: 'Tự động thông qua: Chiết khấu 8% trong hạn mức cho phép (<= 10%).',
        createdAt: '2026-10-17T11:00:00.000Z',
      },
    ],
  },
  {
    id: 'quote-s7-05',
    quoteNumber: 'BG-2026-0065',
    version: 1,
    versionLabel: 'v1.0 (Bản nháp đang soạn thảo)',
    dealId: 'deal-104',
    dealTitle: 'Techcombank — Nâng cấp Core CSKH',
    customerId: 'cust-004',
    customerName: 'Trần Thu Thảo',
    customerCompany: 'Techcombank',
    customerTaxCode: '0100230800',
    customerEmail: 'thaott@techcombank.com.vn',
    customerPhone: '0903456789',
    customerAddress: 'Số 6 Quang Trung, Hoàn Kiếm, Hà Nội',
    items: [
      {
        id: 'item-05-1',
        productId: 'prod-onboarding',
        productCode: 'NEX-SVC-TRAIN',
        productName: 'Dịch vụ Onboarding & Đào tạo chuyển giao công nghệ',
        description: 'Khảo sát quy trình, import dữ liệu từ Excel cũ và đào tạo thực chiến 4 buổi',
        quantity: 2,
        unit: 'Gói dịch vụ',
        unitPrice: 12000000,
        discountType: 'percent',
        discountValue: 0,
        discountAmount: 0,
        floorPrice: 8000000,
        vatRate: 8,
        vatAmount: 1920000,
        lineTotal: 25920000,
      },
    ],
    subtotal: 24000000,
    totalDiscountAmount: 0,
    totalDiscountPercent: 0,
    totalVatAmount: 1920000,
    grandTotal: 25920000,
    discountThresholdPercent: 15,
    requiresApproval: false,
    validUntil: '2026-12-10',
    paymentTerms: 'Thanh toán 100% trong 15 ngày.',
    deliveryTerms: 'Đào tạo onsite tại trụ sở ngân hàng.',
    status: 'draft',
    isEffective: true,
    totalInWords: 'Hai mươi lăm triệu chín trăm hai mươi nghìn đồng chẵn',
    createdAt: '2026-10-20T16:00:00.000Z',
    updatedAt: '2026-10-20T16:00:00.000Z',
    createdBy: 'Phạm Minh Hạnh',
    creatorRole: 'Chuyên viên Kinh doanh',
  },
];

function isStoredQuote(value: unknown): value is IQuote {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as Partial<IQuote>;
  const hasRequiredFields =
    typeof candidate.id === 'string' &&
    typeof candidate.quoteNumber === 'string' &&
    typeof candidate.dealId === 'string' &&
    typeof candidate.dealTitle === 'string' &&
    typeof candidate.customerId === 'string' &&
    typeof candidate.customerName === 'string' &&
    typeof candidate.subtotal === 'number' &&
    typeof candidate.totalDiscountAmount === 'number' &&
    typeof candidate.totalDiscountPercent === 'number' &&
    typeof candidate.totalVatAmount === 'number' &&
    typeof candidate.grandTotal === 'number' &&
    typeof candidate.discountThresholdPercent === 'number' &&
    typeof candidate.requiresApproval === 'boolean' &&
    typeof candidate.validUntil === 'string' &&
    typeof candidate.paymentTerms === 'string' &&
    typeof candidate.deliveryTerms === 'string' &&
    (candidate.status === 'draft' ||
      candidate.status === 'pending_approval' ||
      candidate.status === 'approved' ||
      candidate.status === 'sent' ||
      candidate.status === 'accepted' ||
      candidate.status === 'rejected') &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.updatedAt === 'string' &&
    typeof candidate.createdBy === 'string' &&
    typeof candidate.creatorRole === 'string' &&
    Array.isArray(candidate.items);

  if (!hasRequiredFields || !Array.isArray(candidate.items)) return false;
  if (
    candidate.approvalLevel !== undefined &&
    candidate.approvalLevel !== 'team_leader' &&
    candidate.approvalLevel !== 'director'
  ) return false;
  if (
    candidate.approvalHistory !== undefined &&
    (!Array.isArray(candidate.approvalHistory) ||
      !candidate.approvalHistory.every(isApprovalHistoryEntry))
  ) return false;

  return candidate.items.every((item: unknown) => {
    if (typeof item !== 'object' || item === null) return false;
    const lineItem = item as Partial<IQuoteLineItem>;
    return (
      typeof lineItem.id === 'string' &&
      typeof lineItem.productName === 'string' &&
      typeof lineItem.quantity === 'number' &&
      Number.isFinite(lineItem.quantity) &&
      typeof lineItem.unit === 'string' &&
      typeof lineItem.unitPrice === 'number' &&
      Number.isFinite(lineItem.unitPrice) &&
      (lineItem.discountType === 'percent' || lineItem.discountType === 'amount') &&
      typeof lineItem.discountValue === 'number' &&
      Number.isFinite(lineItem.discountValue) &&
      typeof lineItem.discountAmount === 'number' &&
      (lineItem.floorPrice === undefined ||
        (typeof lineItem.floorPrice === 'number' &&
          Number.isFinite(lineItem.floorPrice) &&
          lineItem.floorPrice >= 0)) &&
      typeof lineItem.vatRate === 'number' &&
      Number.isFinite(lineItem.vatRate) &&
      typeof lineItem.vatAmount === 'number' &&
      typeof lineItem.lineTotal === 'number'
    );
  });
}

function isApprovalHistoryEntry(value: unknown): value is IQuoteApprovalHistoryEntry {
  if (typeof value !== 'object' || value === null) return false;
  const entry = value as Partial<IQuoteApprovalHistoryEntry>;
  return (
    typeof entry.id === 'string' &&
    (entry.action === 'auto_approved' ||
      entry.action === 'approved' ||
      entry.action === 'rejected' ||
      entry.action === 'returned_for_edit' ||
      entry.action === 'sent') &&
    (entry.approvalLevel === undefined ||
      entry.approvalLevel === 'team_leader' ||
      entry.approvalLevel === 'director') &&
    typeof entry.performedBy === 'string' &&
    typeof entry.performedByRole === 'string' &&
    typeof entry.comment === 'string' &&
    typeof entry.createdAt === 'string'
  );
}

class QuoteService {
  /**
   * Lấy danh mục sản phẩm mẫu để kinh doanh chọn nhanh vào báo giá
   */
  public getProductCatalog(): IProductCatalogItem[] {
    return PRODUCT_CATALOG;
  }

  /**
   * Tính toán lại thành tiền, chiết khấu và thuế cho một dòng sản phẩm
   */
  public calculateLineItem(item: IQuoteLineItem): IQuoteLineItem {
    const requestedQuantity = Number(item.quantity);
    const qty = Number.isFinite(requestedQuantity) ? Math.max(1, requestedQuantity) : 1;
    const requestedUnitPrice = Number(item.unitPrice);
    const unitPrice = Number.isFinite(requestedUnitPrice) ? Math.max(0, requestedUnitPrice) : 0;
    const grossAmount = qty * unitPrice;

    let discountAmount = 0;
    const requestedDiscount = Number(item.discountValue);
    const discountVal = Number.isFinite(requestedDiscount) ? Math.max(0, requestedDiscount) : 0;

    if (item.discountType === 'percent') {
      const cappedPercent = Math.min(100, discountVal);
      discountAmount = Math.round((grossAmount * cappedPercent) / 100);
    } else {
      // Giảm theo số tiền tuyệt đối
      discountAmount = Math.min(grossAmount, discountVal);
    }

    const netAmount = Math.max(0, grossAmount - discountAmount);
    const requestedVatRate = Number(item.vatRate);
    const vatRate = Number.isFinite(requestedVatRate)
      ? Math.min(100, Math.max(0, requestedVatRate))
      : 0;
    const vatAmount = Math.round((netAmount * vatRate) / 100);

    return {
      ...item,
      quantity: qty,
      unitPrice,
      discountValue:
        item.discountType === 'percent'
          ? Math.min(100, discountVal)
          : Math.min(grossAmount, discountVal),
      discountAmount,
      lineTotal: netAmount,
      vatRate,
      vatAmount,
    };
  }

  /**
   * Tính toán lại toàn bộ báo giá: tổng tiền, tổng chiết khấu, VAT, tổng thanh toán
   * và xác định cấp phê duyệt cần thiết.
   */
  public recalculateQuote(quote: IQuote): IQuote {
    const updatedItems = quote.items.map((item) => this.calculateLineItem(item));

    const subtotal = updatedItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
    const totalDiscountAmount = updatedItems.reduce((acc, item) => acc + item.discountAmount, 0);
    const totalVatAmount = updatedItems.reduce((acc, item) => acc + item.vatAmount, 0);
    const grandTotal = Math.max(0, subtotal - totalDiscountAmount) + totalVatAmount;

    const totalDiscountPercent = subtotal > 0 ? (totalDiscountAmount / subtotal) * 100 : 0;
    const requestedThreshold = Number(quote.discountThresholdPercent);
    const thresholdPercent =
      Number.isFinite(requestedThreshold) && requestedThreshold > 0
        ? requestedThreshold
        : DEFAULT_DISCOUNT_THRESHOLD_PERCENT;

    const ruleViolations: string[] = [];
    const belowFloorItems = updatedItems.filter((item) => {
      if (item.floorPrice === undefined) return false;
      const netUnitPrice = item.quantity > 0 ? item.lineTotal / item.quantity : item.unitPrice;
      return netUnitPrice < item.floorPrice;
    });
    if (belowFloorItems.length > 0) {
      ruleViolations.push(
        `Giá bán sau chiết khấu thấp hơn giá sàn của ${belowFloorItems
          .map((item) => `"${item.productName}"`)
          .join(', ')}.`
      );
    }

    let approvalLevel: QuoteApprovalLevelType | undefined;
    if (totalDiscountPercent >= thresholdPercent) {
      ruleViolations.push(
        `Mức chiết khấu tổng thể đạt ${totalDiscountPercent.toFixed(1)}%, chạm ngưỡng Trưởng nhóm (${thresholdPercent}%).`
      );
      approvalLevel = 'team_leader';
    }
    if (totalDiscountPercent > DIRECTOR_DISCOUNT_THRESHOLD_PERCENT) {
      ruleViolations.push(
        `Mức chiết khấu tổng thể vượt ngưỡng Giám đốc (${DIRECTOR_DISCOUNT_THRESHOLD_PERCENT}%).`
      );
      approvalLevel = 'director';
    }

    const highDiscountLine = updatedItems.find((i) => {
      const lineGross = i.unitPrice * i.quantity;
      const linePercent = lineGross > 0 ? (i.discountAmount / lineGross) * 100 : 0;
      return linePercent > 20;
    });

    if (highDiscountLine) {
      ruleViolations.push(
        `Dòng "${highDiscountLine.productName}" có mức chiết khấu cao bất thường (>20%).`
      );
      approvalLevel = 'director';
    }

    if (belowFloorItems.length > 0) approvalLevel = 'director';
    const requiresApproval = ruleViolations.length > 0;
    const exceededByPercent = Math.max(0, totalDiscountPercent - thresholdPercent);

    return {
      ...quote,
      items: updatedItems,
      subtotal,
      totalDiscountAmount,
      totalDiscountPercent: Number(totalDiscountPercent.toFixed(2)),
      totalVatAmount,
      grandTotal,
      discountThresholdPercent: thresholdPercent,
      requiresApproval,
      approvalLevel,
      approvalAlert: requiresApproval
        ? {
            requiresApproval: true,
            thresholdPercent,
            currentDiscountPercent: Number(totalDiscountPercent.toFixed(1)),
            exceededByPercent: Number(exceededByPercent.toFixed(1)),
            reason:
              approvalLevel === 'director'
                ? 'Báo giá cần Giám đốc Kinh doanh phê duyệt trước khi phát hành.'
                : 'Báo giá cần Trưởng nhóm kinh doanh phê duyệt trước khi phát hành.',
            ruleViolations,
          }
        : undefined,
    };
  }

  /**
   * Kế thừa dòng sản phẩm từ Cơ hội (Deal) để khởi tạo báo giá ban đầu
   */
  public createInitialQuoteFromDeal(deal: IDeal): IQuote {
    const now = new Date();
    const validUntilDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 ngày hiệu lực

    let initialItems: IQuoteLineItem[] = [];

    // 1. Kế thừa các dòng sản phẩm từ Deal nếu có
    if (Array.isArray(deal.items) && deal.items.length > 0) {
      initialItems = deal.items.map((di, idx) => {
        const billingUnit =
          di.billingCycle === 'monthly'
            ? 'Tháng'
            : di.billingCycle === 'quarterly'
            ? 'Quý'
            : 'Năm';
        const item: IQuoteLineItem = {
          id: `item-${Date.now()}-${idx}`,
          productId: di.productId || undefined,
          productCode: di.productId ? `PRD-${di.productId.substring(0, 6).toUpperCase()}` : `PRD-ITEM-${idx + 1}`,
          productName: di.productName || '',
          quantity: di.quantity ?? 1,
          unit: billingUnit,
          unitPrice: di.unitPrice ?? 0,
          discountType: 'percent',
          discountValue: di.discountPercent ?? 0,
          discountAmount: 0,
          vatRate: 10,
          vatAmount: 0,
          lineTotal: 0,
        };
        return this.calculateLineItem(item);
      });
    } else {
      // Không tự suy đoán sản phẩm/giá khi Deal chưa có dòng hàng.
      initialItems = [
        this.calculateLineItem({
          id: `item-${Date.now()}-empty`,
          productName: '',
          description: '',
          quantity: 1,
          unit: 'Gói',
          unitPrice: 0,
          discountType: 'percent',
          discountValue: 0,
          discountAmount: 0,
          vatRate: 10,
          vatAmount: 0,
          lineTotal: 0,
        }),
      ];
    }

    const quoteNumber = this.generateQuoteNumber();

    const rawQuote: IQuote = {
      id: `quote-${deal.id}-${Date.now()}`,
      quoteNumber,
      version: 1,
      dealId: deal.id,
      dealTitle: deal.title,
      customerId: deal.customerId,
      customerName: deal.customerName || deal.company || 'Doanh nghiệp',
      customerCompany: deal.company || deal.customerName,
      items: initialItems,
      subtotal: 0,
      totalDiscountAmount: 0,
      totalDiscountPercent: 0,
      totalVatAmount: 0,
      grandTotal: 0,
      discountThresholdPercent: DEFAULT_DISCOUNT_THRESHOLD_PERCENT,
      requiresApproval: false,
      validUntil: validUntilDate.toISOString().split('T')[0],
      paymentTerms: '',
      deliveryTerms: '',
      notes: '',
      status: 'draft',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      createdBy: deal.ownerName || 'Chuyên viên Kinh doanh',
      creatorRole: 'Chuyên viên Tư vấn Doanh nghiệp',
    };

    return this.recalculateQuote(rawQuote);
  }

  /**
   * Sinh mã báo giá chuẩn nghiệp vụ: BG-YYYY-XXX
   */
  public generateQuoteNumber(): string {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `BG-${year}-${randomNum}`;
  }

  public validateForSubmission(quote: IQuote): string[] {
    const errors: string[] = [];
    const today = new Date();
    const todayString = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-');
    const validUntil = new Date(`${quote.validUntil}T00:00:00`);
    const validDateString =
      !Number.isNaN(validUntil.getTime()) &&
      [
        validUntil.getFullYear(),
        String(validUntil.getMonth() + 1).padStart(2, '0'),
        String(validUntil.getDate()).padStart(2, '0'),
      ].join('-') === quote.validUntil;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(quote.validUntil) || !validDateString) {
      errors.push('Vui lòng chọn ngày hết hiệu lực hợp lệ.');
    } else if (quote.validUntil < todayString) {
      errors.push('Ngày hết hiệu lực không được nằm trong quá khứ.');
    }

    if (quote.items.length === 0) {
      errors.push('Báo giá cần có ít nhất một dòng sản phẩm.');
    }

    quote.items.forEach((item, index) => {
      if (!item.productName.trim()) {
        errors.push(`Vui lòng nhập tên sản phẩm ở dòng ${index + 1}.`);
      }
      if (!item.unit.trim()) {
        errors.push(`Vui lòng nhập đơn vị tính ở dòng ${index + 1}.`);
      }
      if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
        errors.push(`Số lượng ở dòng ${index + 1} phải lớn hơn 0.`);
      }
      if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) {
        errors.push(`Đơn giá ở dòng ${index + 1} không hợp lệ.`);
      }
    });

    if (!quote.paymentTerms.trim()) {
      errors.push('Vui lòng khai báo điều khoản thanh toán.');
    }
    if (!quote.deliveryTerms.trim()) {
      errors.push('Vui lòng khai báo điều khoản giao hàng và triển khai.');
    }

    return errors;
  }

  /**
   * Lưu bản nháp báo giá vào LocalStorage (Lưu nháp và sửa tiếp được)
   */
  public saveDraft(quote: IQuote): IQuote {
    const recalculated = this.recalculateQuote({
      ...quote,
      updatedAt: new Date().toISOString(),
    });

    if (typeof window === 'undefined') {
      throw new Error('Không thể truy cập bộ nhớ trình duyệt để lưu báo giá.');
    }

    try {
      const allQuotes = this.getAllQuotes();
      const existingIdx = allQuotes.findIndex(
        (q) => q.id === recalculated.id || q.dealId === recalculated.dealId
      );
      if (existingIdx >= 0) {
        allQuotes[existingIdx] = recalculated;
      } else {
        allQuotes.unshift(recalculated);
      }

      window.localStorage.setItem(`nexus_quote_draft_${recalculated.dealId}`, JSON.stringify(recalculated));
      window.localStorage.setItem(`nexus_quote_${recalculated.id}`, JSON.stringify(recalculated));
      window.localStorage.setItem(QUOTES_STORAGE_KEY, JSON.stringify(allQuotes));
    } catch (error: unknown) {
      console.error('Lỗi khi lưu báo giá vào localStorage:', error);
      throw new Error('Không thể lưu báo giá. Vui lòng kiểm tra dung lượng bộ nhớ trình duyệt và thử lại.');
    }

    return recalculated;
  }

  /**
   * Tải bản nháp báo giá đã lưu theo dealId nếu có
   */
  public getDraftByDealId(dealId: string): IQuote | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(`nexus_quote_draft_${dealId}`);
      if (!raw) return null;
      const quote: unknown = JSON.parse(raw);
      if (!isStoredQuote(quote) || quote.dealId !== dealId) {
        throw new Error('Dữ liệu báo giá đã lưu không hợp lệ.');
      }
      return quote;
    } catch (error: unknown) {
      console.error('Lỗi khi đọc bản nháp báo giá:', error);
      throw new Error('Không thể đọc bản nháp báo giá đã lưu.');
    }
  }

  /**
   * Tải toàn bộ danh sách báo giá đã tạo trong hệ thống (Tự động nạp dữ liệu mẫu ban đầu nếu trống)
   */
  public getAllQuotes(): IQuote[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(QUOTES_STORAGE_KEY);
      if (!raw) {
        // Nạp tự động 5 bộ Báo giá mẫu chuẩn nghiệp vụ Sprint 7
        this.seedInitialQuotes();
        return SAMPLE_QUOTES.map((q) => this.recalculateQuote(q));
      }
      const quotes: unknown = JSON.parse(raw);
      if (!Array.isArray(quotes) || quotes.length === 0) {
        this.seedInitialQuotes();
        return SAMPLE_QUOTES.map((q) => this.recalculateQuote(q));
      }
      return quotes.map((quote) => this.recalculateQuote(quote as IQuote));
    } catch (error: unknown) {
      console.warn('Khôi phục danh sách báo giá từ bộ nhớ mẫu:', error);
      this.seedInitialQuotes();
      return SAMPLE_QUOTES.map((q) => this.recalculateQuote(q));
    }
  }

  private seedInitialQuotes(): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(QUOTES_STORAGE_KEY, JSON.stringify(SAMPLE_QUOTES));
      // Lưu các draft & versions tương ứng
      SAMPLE_QUOTES.forEach((q) => {
        window.localStorage.setItem(`nexus_quote_${q.id}`, JSON.stringify(q));
      });
      // Lưu lịch sử phiên bản cho deal-101
      const deal101Versions = SAMPLE_QUOTES.filter((q) => q.dealId === 'deal-101');
      window.localStorage.setItem(
        'nexus_quote_versions_deal-101',
        JSON.stringify(deal101Versions)
      );
    } catch {
      // ignore
    }
  }

  public getQuoteById(id: string): IQuote | null {
    const quotes = this.getAllQuotes();
    const found = quotes.find((q) => q.id === id);
    if (found) return found;
    try {
      const raw = window.localStorage.getItem(`nexus_quote_${id}`);
      if (raw) return this.recalculateQuote(JSON.parse(raw));
    } catch {
      // ignore
    }
    return null;
  }

  public getQuoteVersions(dealId: string): IQuote[] {
    const all = this.getAllQuotes();
    const versions = all.filter((q) => q.dealId === dealId);
    if (versions.length > 0) {
      return versions.sort((a, b) => (a.version || 1) - (b.version || 1));
    }
    try {
      const cached = window.localStorage.getItem(`nexus_quote_versions_${dealId}`);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // ignore
    }
    return [];
  }

  public saveVersion(quote: IQuote): void {
    const recalculated = this.recalculateQuote(quote);
    try {
      const versions = this.getQuoteVersions(recalculated.dealId);
      const idx = versions.findIndex((v) => v.id === recalculated.id);
      if (idx >= 0) {
        versions[idx] = recalculated;
      } else {
        versions.push(recalculated);
      }
      window.localStorage.setItem(
        `nexus_quote_versions_${recalculated.dealId}`,
        JSON.stringify(versions)
      );
      this.saveDraft(recalculated);
    } catch (e) {
      console.error('Lỗi khi lưu phiên bản báo giá:', e);
    }
  }

  public createNewVersion(
    baseQuoteId: string,
    summary: string,
    performedBy: string = 'Chuyên viên Kinh doanh',
    performedByRole: string = 'Kinh doanh'
  ): IQuote {
    const base = this.getQuoteById(baseQuoteId);
    if (!base) {
      throw new Error('Không tìm thấy phiên bản báo giá gốc để tạo mới.');
    }

    const versions = this.getQuoteVersions(base.dealId);
    const maxVer = Math.max(...versions.map((v) => v.version || 1), base.version || 1);
    const nextVersionNum = maxVer + 1;
    const now = new Date().toISOString();

    const newVersion: IQuote = {
      ...base,
      id: `quote-${base.dealId}-v${nextVersionNum}-${Date.now()}`,
      version: nextVersionNum,
      versionLabel: `v${nextVersionNum}.0 (${summary})`,
      changeSummary: summary,
      parentQuoteId: base.id,
      status: 'draft',
      isEffective: false,
      createdAt: now,
      updatedAt: now,
      createdBy: performedBy,
      creatorRole: performedByRole,
      approvalHistory: [],
      contractId: undefined,
      contractNumber: undefined,
    };

    this.saveVersion(newVersion);
    return newVersion;
  }

  public setEffectiveVersion(dealId: string, versionId: string): IQuote {
    const versions = this.getQuoteVersions(dealId);
    let updatedEffective: IQuote | null = null;

    const updatedList = versions.map((v) => {
      if (v.id === versionId) {
        updatedEffective = { ...v, isEffective: true, updatedAt: new Date().toISOString() };
        return updatedEffective;
      }
      return { ...v, isEffective: false };
    });

    if (!updatedEffective) {
      throw new Error('Không tìm thấy phiên bản cần kích hoạt hiệu lực.');
    }

    window.localStorage.setItem(
      `nexus_quote_versions_${dealId}`,
      JSON.stringify(updatedList)
    );

    this.saveDraft(updatedEffective);
    return updatedEffective;
  }

  public compareQuotes(baseQuote: IQuote, targetQuote: IQuote): IQuoteComparison {
    const lineItemDiffs: IQuoteLineItemDiff[] = [];
    const baseItems = baseQuote.items || [];
    const targetItems = targetQuote.items || [];

    const baseMap = new Map<string, IQuoteLineItem>();
    baseItems.forEach((item) => {
      const key = (item.productId || item.productCode || item.productName || item.id).trim().toLowerCase();
      baseMap.set(key, item);
    });

    const targetMap = new Map<string, IQuoteLineItem>();
    targetItems.forEach((item) => {
      const key = (item.productId || item.productCode || item.productName || item.id).trim().toLowerCase();
      targetMap.set(key, item);
    });

    let itemsAddedCount = 0;
    let itemsRemovedCount = 0;
    let itemsModifiedCount = 0;

    targetItems.forEach((targetItem) => {
      const key = (targetItem.productId || targetItem.productCode || targetItem.productName || targetItem.id).trim().toLowerCase();
      const baseItem = baseMap.get(key);

      if (!baseItem) {
        itemsAddedCount++;
        lineItemDiffs.push({
          id: targetItem.id,
          productId: targetItem.productId || targetItem.productCode,
          productName: targetItem.productName,
          unit: targetItem.unit,
          changeType: 'added',
          oldItem: undefined,
          newItem: targetItem,
          quantityDiff: targetItem.quantity,
          lineTotalDiff: targetItem.lineTotal,
        });
      } else {
        const isModified =
          baseItem.quantity !== targetItem.quantity ||
          baseItem.unitPrice !== targetItem.unitPrice ||
          baseItem.discountValue !== targetItem.discountValue ||
          baseItem.vatRate !== targetItem.vatRate ||
          baseItem.lineTotal !== targetItem.lineTotal;

        if (isModified) {
          itemsModifiedCount++;
          lineItemDiffs.push({
            id: targetItem.id,
            productId: targetItem.productId || targetItem.productCode,
            productName: targetItem.productName,
            unit: targetItem.unit || baseItem.unit,
            changeType: 'modified',
            oldItem: baseItem,
            newItem: targetItem,
            quantityDiff: targetItem.quantity - baseItem.quantity,
            lineTotalDiff: targetItem.lineTotal - baseItem.lineTotal,
          });
        } else {
          lineItemDiffs.push({
            id: targetItem.id,
            productId: targetItem.productId || targetItem.productCode,
            productName: targetItem.productName,
            unit: targetItem.unit || baseItem.unit,
            changeType: 'unchanged',
            oldItem: baseItem,
            newItem: targetItem,
            quantityDiff: 0,
            lineTotalDiff: 0,
          });
        }
      }
    });

    baseItems.forEach((baseItem) => {
      const key = (baseItem.productId || baseItem.productCode || baseItem.productName || baseItem.id).trim().toLowerCase();
      if (!targetMap.has(key)) {
        itemsRemovedCount++;
        lineItemDiffs.push({
          id: baseItem.id,
          productId: baseItem.productId || baseItem.productCode,
          productName: baseItem.productName,
          unit: baseItem.unit,
          changeType: 'removed',
          oldItem: baseItem,
          newItem: undefined,
          quantityDiff: -baseItem.quantity,
          lineTotalDiff: -baseItem.lineTotal,
        });
      }
    });

    const validUntilChanged = baseQuote.validUntil !== targetQuote.validUntil;
    const paymentTermsChanged = baseQuote.paymentTerms !== targetQuote.paymentTerms;
    const deliveryTermsChanged = baseQuote.deliveryTerms !== targetQuote.deliveryTerms;
    const notesChanged = (baseQuote.notes || '') !== (targetQuote.notes || '');
    const hasAnyTermsChanged = validUntilChanged || paymentTermsChanged || deliveryTermsChanged || notesChanged;

    const termsDiff: ITermsDiff = {
      validUntilChanged,
      oldValidUntil: baseQuote.validUntil || '—',
      newValidUntil: targetQuote.validUntil || '—',
      paymentTermsChanged,
      oldPaymentTerms: baseQuote.paymentTerms || '—',
      newPaymentTerms: targetQuote.paymentTerms || '—',
      deliveryTermsChanged,
      oldDeliveryTerms: baseQuote.deliveryTerms || '—',
      newDeliveryTerms: targetQuote.deliveryTerms || '—',
      notesChanged,
      oldNotes: baseQuote.notes || '—',
      newNotes: targetQuote.notes || '—',
      hasAnyTermsChanged,
    };

    const subtotalDiff = targetQuote.subtotal - baseQuote.subtotal;
    const discountAmountDiff = targetQuote.totalDiscountAmount - baseQuote.totalDiscountAmount;
    const discountPercentDiff = targetQuote.totalDiscountPercent - baseQuote.totalDiscountPercent;
    const vatAmountDiff = targetQuote.totalVatAmount - baseQuote.totalVatAmount;
    const grandTotalDiff = targetQuote.grandTotal - baseQuote.grandTotal;
    const totalUnchangedItems = lineItemDiffs.filter((item) => item.changeType === 'unchanged').length;

    return {
      baseQuote,
      targetQuote,
      lineItemDiffs,
      subtotalDiff,
      discountAmountDiff,
      discountPercentDiff,
      vatAmountDiff,
      grandTotalDiff,
      itemsAddedCount,
      itemsRemovedCount,
      itemsModifiedCount,
      totalAddedItems: itemsAddedCount,
      totalRemovedItems: itemsRemovedCount,
      totalModifiedItems: itemsModifiedCount,
      totalUnchangedItems,
      termsDiff,
      summary: {
        itemsAdded: itemsAddedCount,
        itemsRemoved: itemsRemovedCount,
        itemsModified: itemsModifiedCount,
        subtotalDiff,
        discountDiff: discountAmountDiff,
        vatDiff: vatAmountDiff,
        grandTotalDiff,
        termsModified: hasAnyTermsChanged,
      },
    };
  }

  public deleteQuote(id: string): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const list = this.getAllQuotes().filter((q) => q.id !== id);
      window.localStorage.setItem(QUOTES_STORAGE_KEY, JSON.stringify(list));
      window.localStorage.removeItem(`nexus_quote_${id}`);
      return true;
    } catch {
      return false;
    }
  }

  public duplicateQuote(id: string): IQuote {
    const existing = this.getQuoteById(id);
    if (!existing) throw new Error('Không tìm thấy báo giá để nhân bản.');
    const now = new Date().toISOString();
    const cloned: IQuote = {
      ...existing,
      id: `quote-${existing.dealId}-${Date.now()}`,
      quoteNumber: this.generateQuoteNumber(),
      version: 1,
      versionLabel: 'v1.0 (Bản sao)',
      status: 'draft',
      isEffective: false,
      contractId: undefined,
      contractNumber: undefined,
      accessToken: undefined,
      shareUrl: undefined,
      approvalHistory: [],
      createdAt: now,
      updatedAt: now,
    };
    return this.saveDraft(cloned);
  }

  /**
   * Gửi báo giá duyệt cấp trên (chuyển trạng thái sang pending_approval hoặc approved)
   */
  public submitQuote(quote: IQuote): IQuote {
    const recalculated = this.recalculateQuote(quote);
    const nextStatus: QuoteStatusType = recalculated.requiresApproval ? 'pending_approval' : 'approved';
    const now = new Date().toISOString();
    const approvalHistory = [...(recalculated.approvalHistory ?? [])];
    if (!recalculated.requiresApproval) {
      approvalHistory.push({
        id: `approval-${Date.now()}`,
        action: 'auto_approved',
        performedBy: 'Hệ thống',
        performedByRole: 'Hệ thống',
        comment: 'Tự động thông qua: báo giá nằm trong ngưỡng phê duyệt.',
        createdAt: now,
      });
    }

    const finalizedQuote: IQuote = {
      ...recalculated,
      status: nextStatus,
      approvalHistory,
      updatedAt: now,
    };

    return this.saveDraft(finalizedQuote);
  }

  public decideApproval(
    quoteId: string,
    action: Extract<QuoteApprovalActionType, 'approved' | 'rejected' | 'returned_for_edit'>,
    comment: string,
    actorName: string,
    actorRole: string
  ): IQuote {
    const normalizedComment = comment.trim();
    if (!normalizedComment) throw new Error('Vui lòng nhập ý kiến xử lý.');

    const quote = this.getAllQuotes().find((candidate) => candidate.id === quoteId);
    if (!quote || quote.status !== 'pending_approval' || !quote.approvalLevel) {
      throw new Error('Báo giá không còn ở trạng thái chờ duyệt.');
    }

    const normalizedRole = actorRole.trim().toLowerCase();
    const isDirector =
      normalizedRole.includes('director') ||
      normalizedRole.includes('vp') ||
      normalizedRole.includes('giám đốc') ||
      normalizedRole.includes('admin');
    const isTeamLeader =
      isDirector ||
      normalizedRole.includes('manager') ||
      normalizedRole.includes('leader') ||
      normalizedRole.includes('trưởng nhóm');
    if (!isTeamLeader || (quote.approvalLevel === 'director' && !isDirector)) {
      throw new Error('Bạn không có quyền xử lý cấp duyệt của báo giá này.');
    }

    const now = new Date().toISOString();
    const nextStatus: QuoteStatusType =
      action === 'approved' ? 'approved' : action === 'rejected' ? 'rejected' : 'draft';
    const actionHistory: IQuoteApprovalHistoryEntry = {
      id: `approval-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      action,
      approvalLevel: quote.approvalLevel,
      performedBy: actorName,
      performedByRole: actorRole,
      comment: normalizedComment,
      createdAt: now,
    };
    return this.saveDraft({
      ...quote,
      status: nextStatus,
      approvalHistory: [...(quote.approvalHistory ?? []), actionHistory],
      updatedAt: now,
    });
  }

  public sendApprovedQuote(
    quoteId: string,
    actorName: string,
    actorRole: string
  ): IQuote {
    const quote = this.getAllQuotes().find((candidate) => candidate.id === quoteId);
    if (!quote || quote.status !== 'approved') {
      throw new Error('Chỉ báo giá đã được duyệt mới có thể gửi cho khách hàng.');
    }
    const now = new Date().toISOString();
    const sentEntry: IQuoteApprovalHistoryEntry = {
      id: `approval-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      action: 'sent',
      performedBy: actorName,
      performedByRole: actorRole,
      comment: 'Đã phát hành báo giá cho khách hàng.',
      createdAt: now,
    };
    return this.saveDraft({
      ...quote,
      status: 'sent',
      approvalHistory: [...(quote.approvalHistory ?? []), sentEntry],
      updatedAt: now,
    });
  }

  // --- Asynchronous Backend API Methods (S7-01 -> S7-06) ---

  public async getQuotesAsync(params?: {
    search?: string;
    status?: string;
    customerId?: string;
    dealId?: string;
    skip?: number;
    limit?: number;
  }): Promise<IQuote[]> {
    try {
      const response = await axiosInstance.get<IQuote[]>('/quotations', { params });
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
      return this.getAllQuotes();
    } catch (err: unknown) {
      console.warn('Backend /quotations unavailable, falling back to local storage:', err);
      return this.getAllQuotes();
    }
  }

  public async getQuoteAsync(id: string): Promise<IQuote> {
    const response = await axiosInstance.get<IQuote>(`/quotations/${id}`);
    return response.data;
  }

  public async createQuoteAsync(dto: ICreateQuoteDTO): Promise<IQuote> {
    const response = await axiosInstance.post<IQuote>('/quotations', dto);
    this.saveDraft(response.data);
    return response.data;
  }

  public async updateQuoteAsync(id: string, dto: IUpdateQuoteDTO): Promise<IQuote> {
    const response = await axiosInstance.put<IQuote>(`/quotations/${id}`, dto);
    this.saveDraft(response.data);
    return response.data;
  }

  public async submitQuoteAsync(id: string): Promise<IQuote> {
    const response = await axiosInstance.post<IQuote>(`/quotations/${id}/submit`);
    this.saveDraft(response.data);
    return response.data;
  }

  public async decideApprovalAsync(
    id: string,
    action: 'approved' | 'rejected' | 'returned_for_edit',
    comment: string
  ): Promise<IQuote> {
    const response = await axiosInstance.post<IQuote>(`/quotations/${id}/approval`, {
      action,
      comment,
    });
    this.saveDraft(response.data);
    return response.data;
  }

  public async sendQuoteAsync(id: string): Promise<IQuote> {
    const response = await axiosInstance.post<IQuote>(`/quotations/${id}/send`);
    this.saveDraft(response.data);
    return response.data;
  }

  public async compareVersionsAsync(idA: string, idB: string): Promise<IQuoteCompareResult> {
    const response = await axiosInstance.get<IQuoteCompareResult>(
      `/quotations/${idA}/compare/${idB}`
    );
    return response.data;
  }

  public async convertQuoteToContractAsync(
    quotationId: string,
    payload: ICreateContractDTO
  ): Promise<IContract> {
    const response = await axiosInstance.post<IContract>(
      `/quotations/${quotationId}/convert-to-contract`,
      payload
    );
    return response.data;
  }

  public createSampleQuote(accessToken: string): IQuote {
    const raw: IQuote = {
      id: accessToken || 'quote-demo-01',
      quoteNumber: 'BG-2026-0089',
      version: 1,
      dealId: 'deal-01',
      dealTitle: 'Triển khai CRM cho Tập đoàn FPT Software',
      customerId: 'cust-01',
      customerName: 'Nguyễn Văn An',
      customerCompany: 'Tập đoàn FPT Software',
      items: [
        {
          id: 'item-1',
          productCode: 'NEX-ENT-50',
          productName: 'Gói NexusCRM Enterprise Bản quyền 50 Users',
          description: 'Bản quyền trọn gói hệ thống quản lý quan hệ khách hàng và phễu bán hàng đa chi nhánh',
          quantity: 1,
          unit: 'Gói',
          unitPrice: 180000000,
          discountType: 'percent',
          discountValue: 10,
          discountAmount: 18000000,
          vatRate: 10,
          vatAmount: 16200000,
          lineTotal: 178200000,
        },
        {
          id: 'item-2',
          productCode: 'NEX-SVC-TRAIN',
          productName: 'Dịch vụ Onboarding & Đào tạo chuyển giao công nghệ',
          description: 'Khảo sát quy trình, import dữ liệu từ Excel cũ và đào tạo thực chiến 4 buổi',
          quantity: 3,
          unit: 'Buổi',
          unitPrice: 12000000,
          discountType: 'percent',
          discountValue: 0,
          discountAmount: 0,
          vatRate: 8,
          vatAmount: 2880000,
          lineTotal: 38880000,
        },
      ],
      subtotal: 216000000,
      totalDiscountAmount: 18000000,
      totalDiscountPercent: 8.3,
      totalVatAmount: 19080000,
      grandTotal: 217080000,
      discountThresholdPercent: 10,
      requiresApproval: false,
      validUntil: '2026-11-30',
      paymentTerms:
        'Thanh toán đợt 1: 50% ngay sau khi ký duyệt báo giá. Thanh toán đợt 2: 50% sau khi hoàn thành chuyển giao dữ liệu.',
      deliveryTerms:
        'Bàn giao tài khoản quản trị hệ thống Cloud trong vòng 24h kể từ khi xác nhận thanh toán đợt 1.',
      notes:
        'Báo giá đã bao gồm chi phí bảo hành phần mềm và hỗ trợ kỹ thuật 24/7 trong 12 tháng.',
      status: 'sent',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'Trần Thị Thu Hà',
      creatorRole: 'Chuyên viên Tư vấn Doanh nghiệp',
    };
    return this.recalculateQuote(raw);
  }

  public async getPublicQuoteAsync(accessToken: string): Promise<IQuote> {
    try {
      const response = await axiosInstance.get<IQuote>(`/public/quotes/${accessToken}`);
      return response.data;
    } catch (err: unknown) {
      console.warn('Backend /public/quotes unavailable, falling back to local storage quote:', err);
      if (typeof window !== 'undefined') {
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key && (key.startsWith('nexus_quote_') || key.startsWith('nexus_quote_draft_'))) {
            try {
              const val = JSON.parse(window.localStorage.getItem(key) || '{}');
              if (val && val.id) {
                if (
                  val.id === accessToken ||
                  val.shareAccessToken === accessToken ||
                  accessToken.includes(val.id) ||
                  val.id.includes(accessToken)
                ) {
                  return val;
                }
              }
            } catch {
              // ignore
            }
          }
        }
      }
      return this.createSampleQuote(accessToken);
    }
  }

  public async respondPublicQuoteAsync(
    accessToken: string,
    action: 'accepted' | 'rejected',
    comment?: string,
    signerName?: string
  ): Promise<IQuote> {
    try {
      const response = await axiosInstance.post<IQuote>(`/public/quotes/${accessToken}/respond`, {
        action,
        comment: comment || '',
        signerName: signerName || 'Khách hàng',
      });
      return response.data;
    } catch (err: unknown) {
      console.warn('Backend /public/quotes/respond unavailable, updating local quote:', err);
      const current = await this.getPublicQuoteAsync(accessToken);
      const updated: IQuote = {
        ...current,
        status: action === 'accepted' ? 'accepted' : 'rejected',
        rejectionReason: action === 'rejected' ? comment : undefined,
      };
      this.saveDraft(updated);
      return updated;
    }
  }

  public getPdfUrl(quoteId: string, templateId?: string): string {
    const param = templateId ? `?templateId=${encodeURIComponent(templateId)}` : '';
    return `${API_BASE_URL}/quotations/${quoteId}/pdf${param}`;
  }

  public getExportExcelUrl(search?: string, status?: string): string {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    return `${API_BASE_URL}/quotations/export?${params.toString()}`;
  }
}

export const quoteService = new QuoteService();
