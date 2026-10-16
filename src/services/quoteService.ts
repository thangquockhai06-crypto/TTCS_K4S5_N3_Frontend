import {
  IQuote,
  IQuoteLineItem,
  IProductCatalogItem,
  QuoteStatusType,
} from '../interfaces/quote.interface';
import { IDeal } from '../interfaces/deal.interface';

const QUOTES_STORAGE_KEY = 'nexus_quotes_master_list';
const DEFAULT_DISCOUNT_THRESHOLD_PERCENT = 15; // Ngưỡng chiết khấu 15% cần Giám đốc duyệt

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
      typeof lineItem.vatRate === 'number' &&
      Number.isFinite(lineItem.vatRate) &&
      typeof lineItem.vatAmount === 'number' &&
      typeof lineItem.lineTotal === 'number'
    );
  });
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
   * và kiểm tra ngưỡng cảnh báo đỏ cần Giám đốc duyệt (S7-01)
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

    // Kiểm tra ngưỡng cảnh báo đỏ:
    // 1. Tổng mức chiết khấu đạt hoặc vượt ngưỡng (mặc định 15%)
    // 2. Hoặc có dòng sản phẩm giảm quá 20%
    const ruleViolations: string[] = [];
    if (totalDiscountPercent >= thresholdPercent) {
      ruleViolations.push(
        `Mức chiết khấu tổng thể đạt ${totalDiscountPercent.toFixed(1)}%, chạm ngưỡng cần duyệt (${thresholdPercent}%).`
      );
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
    }

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
      approvalAlert: requiresApproval
        ? {
            requiresApproval: true,
            thresholdPercent,
            currentDiscountPercent: Number(totalDiscountPercent.toFixed(1)),
            exceededByPercent: Number(exceededByPercent.toFixed(1)),
            reason: 'Báo giá có mức chiết khấu cần Giám đốc Kinh doanh phê duyệt trước khi phát hành.',
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
   * Tải toàn bộ danh sách báo giá đã tạo trong hệ thống
   */
  public getAllQuotes(): IQuote[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(QUOTES_STORAGE_KEY);
      if (!raw) return [];
      const quotes: unknown = JSON.parse(raw);
      if (!Array.isArray(quotes) || !quotes.every(isStoredQuote)) {
        throw new Error('Danh sách báo giá đã lưu không hợp lệ.');
      }
      return quotes;
    } catch (error: unknown) {
      console.error('Lỗi khi đọc danh sách báo giá:', error);
      throw new Error('Không thể đọc danh sách báo giá đã lưu.');
    }
  }

  /**
   * Gửi báo giá duyệt cấp trên (chuyển trạng thái sang pending_approval hoặc approved)
   */
  public submitQuote(quote: IQuote): IQuote {
    const recalculated = this.recalculateQuote(quote);
    const nextStatus: QuoteStatusType = recalculated.requiresApproval ? 'pending_approval' : 'approved';

    const finalizedQuote: IQuote = {
      ...recalculated,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    };

    return this.saveDraft(finalizedQuote);
  }
}

export const quoteService = new QuoteService();
