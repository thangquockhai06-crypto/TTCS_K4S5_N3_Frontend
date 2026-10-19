/**
 * S7-04: Service xử lý Hợp đồng & Chuyển đổi Báo giá thành Hợp đồng
 * Tuyệt đối 0% kiểu any, tuân thủ nghiêm ngặt TypeScript.
 */

import { IContract, ICreateContractFromQuoteDTO } from '../interfaces/contract.interface';
import { IQuote } from '../interfaces/quote.interface';
import { quoteService } from './quoteService';
import { dealService } from './dealService';
import { INITIAL_DEALS } from '../mock/deals';
import { CONTRACT_DEAL_UPDATED_EVENT, IContractDealUpdate } from '../interfaces/deal.interface';

const CONTRACTS_STORAGE_KEY = 'nexus_contracts_master_list';
const DEALS_OVERRIDE_STORAGE_KEY = 'nexus_deals_override';

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsedDate = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === value;
}

function isStoredContract(value: unknown): value is IContract {
  if (typeof value !== 'object' || value === null) return false;
  const c = value as Partial<IContract>;
  return (
    typeof c.id === 'string' &&
    typeof c.contractNumber === 'string' &&
    typeof c.title === 'string' &&
    typeof c.quoteId === 'string' &&
    typeof c.quoteNumber === 'string' &&
    typeof c.dealId === 'string' &&
    typeof c.customerId === 'string' &&
    typeof c.subtotal === 'number' &&
    typeof c.grandTotal === 'number' &&
    typeof c.signingDate === 'string' &&
    typeof c.startDate === 'string' &&
    typeof c.endDate === 'string' &&
    typeof c.paymentTerms === 'string' &&
    Array.isArray(c.items)
  );
}

class ContractService {
  /**
   * Lấy danh sách toàn bộ hợp đồng trong hệ thống
   */
  public getAllContracts(): IContract[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(CONTRACTS_STORAGE_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.every(isStoredContract)) {
        return parsed;
      }
      return [];
    } catch (err: unknown) {
      console.error('Lỗi khi đọc danh sách hợp đồng:', err);
      return [];
    }
  }

  /**
   * Tìm hợp đồng theo ID
   */
  public getContractById(id: string): IContract | null {
    return this.getAllContracts().find((c) => c.id === id) || null;
  }

  /**
   * Tìm hợp đồng theo quoteId
   */
  public getContractByQuoteId(quoteId: string): IContract | null {
    return this.getAllContracts().find((c) => c.quoteId === quoteId) || null;
  }

  /**
   * Tìm hợp đồng theo dealId
   */
  public getContractByDealId(dealId: string): IContract | null {
    return this.getAllContracts().find((c) => c.dealId === dealId) || null;
  }

  /**
   * Kiểm tra số hợp đồng có là duy nhất không (S7-04: Số hợp đồng là duy nhất)
   */
  public isContractNumberUnique(contractNumber: string, excludeContractId?: string): boolean {
    const normalized = contractNumber.trim().toUpperCase();
    if (!normalized) return false;

    const all = this.getAllContracts();
    const existing = all.find(
      (c) =>
        c.contractNumber.trim().toUpperCase() === normalized &&
        c.id !== excludeContractId
    );

    return !existing;
  }

  /**
   * Tự động sinh số hợp đồng gợi ý chuẩn nghiệp vụ: HD-YYYY-XXX
   */
  public generateContractNumber(quoteNumber?: string): string {
    const year = new Date().getFullYear();
    const all = this.getAllContracts();

    // Nếu mã báo giá có dạng BG-2026-089 thì gợi ý số HĐ là HD-2026-089
    if (quoteNumber) {
      const match = quoteNumber.match(/BG-(\d{4})-(\d+)/i);
      if (match) {
        const candidate = `HD-${match[1]}-${match[2]}`;
        if (this.isContractNumberUnique(candidate)) {
          return candidate;
        }
      }
    }

    const currentYearNumbers = all
      .map((contract) => contract.contractNumber.match(new RegExp(`^HD-${year}-(\\d+)$`, 'i')))
      .filter((match): match is RegExpMatchArray => match !== null)
      .map((match) => Number(match[1]))
      .filter(Number.isFinite);
    let sequence = Math.max(0, ...currentYearNumbers) + 1;
    let candidate = `HD-${year}-${String(sequence).padStart(3, '0')}`;
    while (!this.isContractNumberUnique(candidate)) {
      sequence += 1;
      candidate = `HD-${year}-${String(sequence).padStart(3, '0')}`;
    }
    return candidate;
  }

  /**
   * Chuyển Báo giá thành Hợp đồng (S7-04)
   * 1. Kế thừa toàn bộ dòng sản phẩm và giá đã chốt từ báo giá, không gõ lại
   * 2. Kiểm tra số hợp đồng là duy nhất
   * 3. Cơ hội tương ứng tự động chuyển sang Đóng thắng với giá trị đúng bằng giá trị hợp đồng
   */
  public async createContractFromQuote(
    quote: IQuote,
    dto: ICreateContractFromQuoteDTO,
    actorName: string = 'Kế toán viên',
    actorRole: string = 'Kế toán'
  ): Promise<{ contract: IContract; dealUpdated: boolean; backendDealUpdated: boolean }> {
    if (dto.quoteId !== quote.id) {
      throw new Error('Báo giá không khớp với yêu cầu tạo hợp đồng.');
    }
    if (quote.status !== 'approved' && quote.status !== 'sent' && quote.status !== 'accepted') {
      throw new Error('Chỉ có thể lập hợp đồng từ báo giá đã được duyệt hoặc phát hành.');
    }
    if (this.getContractByQuoteId(quote.id) || quote.contractId || quote.contractNumber) {
      throw new Error('Báo giá này đã được chuyển thành hợp đồng.');
    }
    if (!quote.items.length || !Number.isFinite(quote.grandTotal) || quote.grandTotal < 0) {
      throw new Error('Báo giá không có dòng sản phẩm hoặc giá trị hợp đồng hợp lệ.');
    }

    // 1. Kiểm tra tính hợp lệ của số hợp đồng
    const contractNum = dto.contractNumber.trim().toUpperCase();
    if (!contractNum) {
      throw new Error('Vui lòng nhập số hợp đồng.');
    }

    if (!this.isContractNumberUnique(contractNum)) {
      throw new Error(
        `Số hợp đồng "${contractNum}" đã tồn tại trong hệ thống. Quy định: Số hợp đồng là duy nhất.`
      );
    }

    // 2. Kiểm tra ngày hiệu lực & ngày hết hạn
    if (
      !isValidIsoDate(dto.signingDate) ||
      !isValidIsoDate(dto.startDate) ||
      !isValidIsoDate(dto.endDate)
    ) {
      throw new Error('Vui lòng nhập ngày ký, ngày hiệu lực và ngày hết hạn hợp lệ.');
    }

    if (dto.endDate < dto.startDate) {
      throw new Error('Ngày hết hạn hợp đồng không được trước ngày hiệu lực.');
    }
    if (dto.signingDate > dto.endDate) {
      throw new Error('Ngày ký hợp đồng không được sau ngày hết hạn.');
    }

    if (!dto.title.trim()) {
      throw new Error('Vui lòng nhập tiêu đề hợp đồng.');
    }
    if (!dto.paymentTerms.trim()) {
      throw new Error('Vui lòng khai báo điều khoản thanh toán của hợp đồng.');
    }

    const now = new Date().toISOString();

    // 3. Kế thừa toàn bộ dòng sản phẩm và giá đã chốt từ báo giá (không nhập lại)
    const clonedItems = quote.items.map((item, idx) => ({
      ...item,
      id: `contract-item-${Date.now()}-${idx}`,
    }));

    const newContract: IContract = {
      id: `contract-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      contractNumber: contractNum,
      title: dto.title.trim() || `Hợp đồng kinh tế triển khai dịch vụ cho ${quote.customerCompany || quote.customerName}`,
      quoteId: quote.id,
      quoteNumber: quote.quoteNumber,
      quoteVersion: quote.version,
      dealId: quote.dealId,
      dealTitle: quote.dealTitle,
      customerId: quote.customerId,
      customerName: quote.customerName,
      customerCompany: quote.customerCompany,
      customerEmail: quote.customerEmail,
      customerPhone: quote.customerPhone,
      customerAddress: quote.customerAddress,
      customerTaxCode: quote.customerTaxCode,

      // Kế thừa nguyên vẹn số liệu tài chính đã chốt
      items: clonedItems,
      subtotal: quote.subtotal,
      totalDiscountAmount: quote.totalDiscountAmount,
      totalDiscountPercent: quote.totalDiscountPercent,
      totalVatAmount: quote.totalVatAmount,
      grandTotal: quote.grandTotal,

      signingDate: dto.signingDate || now.split('T')[0],
      startDate: dto.startDate,
      endDate: dto.endDate,
      paymentTerms: dto.paymentTerms.trim(),
      deliveryTerms: dto.deliveryTerms?.trim() || quote.deliveryTerms,
      notes: dto.notes?.trim() || quote.notes,
      signatoryPartyA: dto.signatoryPartyA?.trim() || quote.customerName,
      signatoryPartyB: dto.signatoryPartyB?.trim() || actorName,
      status: 'active',

      createdAt: now,
      updatedAt: now,
      createdBy: actorName,
      creatorRole: actorRole,
    };

    // 4. Lưu hợp đồng vào danh sách
    const allContracts = this.getAllContracts();
    allContracts.unshift(newContract);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CONTRACTS_STORAGE_KEY, JSON.stringify(allContracts));
    }

    // 5. Cập nhật trạng thái Báo giá sang 'accepted' và gắn mã hợp đồng
    const updatedQuote: IQuote = {
      ...quote,
      status: 'accepted',
      contractId: newContract.id,
      contractNumber: newContract.contractNumber,
      updatedAt: now,
    };
    quoteService.saveDraft(updatedQuote);
    quoteService.saveVersion(updatedQuote);

    // 6. Cơ hội tương ứng tự động chuyển sang Đóng thắng với giá trị đúng bằng giá trị hợp đồng
    let dealUpdated = false;
    let backendDealUpdated = false;
    try {
      // Gọi API cập nhật giai đoạn Deal nếu backend khả dụng
      await dealService.moveDealStage(quote.dealId, 'won', true, {
        value: newContract.grandTotal,
        probability: 100,
      });
      backendDealUpdated = true;
    } catch (apiErr: unknown) {
      console.warn('Backend API moveDealStage không phản hồi, thực hiện cập nhật cục bộ:', apiErr);
    }

    // Luôn luôn cập nhật cache cục bộ & INITIAL_DEALS để đồng bộ toàn bộ Frontend ngay lập tức
    const dealUpdate: IContractDealUpdate = {
      dealId: quote.dealId,
      stage: 'Won',
      value: newContract.grandTotal,
      probability: 100,
      closeDate: newContract.signingDate,
    };
    const mockDeal = INITIAL_DEALS.find((deal) => deal.id === quote.dealId);
    if (mockDeal) {
      mockDeal.stage = dealUpdate.stage;
      mockDeal.value = dealUpdate.value;
      mockDeal.actualValue = dealUpdate.value;
      mockDeal.probability = dealUpdate.probability;
      mockDeal.closeDate = dealUpdate.closeDate;
    }

    if (typeof window !== 'undefined') {
      const rawDealsOverride = window.localStorage.getItem(DEALS_OVERRIDE_STORAGE_KEY);
      let dealsOverrides: Record<
        string,
        Pick<IContractDealUpdate, 'stage' | 'value' | 'probability' | 'closeDate'>
      > = {};
      if (rawDealsOverride) {
        const parsed: unknown = JSON.parse(rawDealsOverride);
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          throw new Error('Không thể đồng bộ cơ hội: dữ liệu lưu cục bộ không hợp lệ.');
        }
        dealsOverrides = parsed as typeof dealsOverrides;
      }
      dealsOverrides[quote.dealId] = {
        stage: dealUpdate.stage,
        value: dealUpdate.value,
        probability: dealUpdate.probability,
        closeDate: dealUpdate.closeDate,
      };
      window.localStorage.setItem(DEALS_OVERRIDE_STORAGE_KEY, JSON.stringify(dealsOverrides));
      window.dispatchEvent(new CustomEvent<unknown>(CONTRACT_DEAL_UPDATED_EVENT, { detail: dealUpdate }));
    }
    dealUpdated = true;

    return { contract: newContract, dealUpdated, backendDealUpdated };
  }
}

export const contractService = new ContractService();
