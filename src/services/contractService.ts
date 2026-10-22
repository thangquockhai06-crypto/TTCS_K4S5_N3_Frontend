import { axiosInstance, API_BASE_URL } from '../utils/axiosInstance';
import {
  IContract,
  ICreateContractDTO,
  ICreateContractFromQuoteDTO,
  IContractRenewalDTO,
  IContractItem,
} from '../interfaces/contract.interface';
import { IQuote } from '../interfaces/quote.interface';
import { IDeal } from '../interfaces/deal.interface';
import { quoteService } from './quoteService';

export interface IGetContractsParams {
  search?: string;
  status?: string;
  customerId?: string;
  expiringWithinDays?: number;
  skip?: number;
  limit?: number;
}

class ContractService {
  generateContractNumber(quoteNumber?: string): string {
    const year = new Date().getFullYear();
    const cleanQuote = quoteNumber ? quoteNumber.replace(/^BG-/, '').replace(/\s+/g, '') : '';
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    return `HD-${year}-${cleanQuote || randomSuffix}`;
  }

  isContractNumberUnique(contractNumber: string): boolean {
    const list = this.getLocalContracts();
    return !list.some(
      (c) => c.contractNumber.trim().toLowerCase() === contractNumber.trim().toLowerCase()
    );
  }

  async createContractFromQuote(
    quote: IQuote,
    payload: ICreateContractFromQuoteDTO,
    actorName: string,
    _actorRole?: string
  ): Promise<{ contract: IContract; backendDealUpdated: boolean }> {
    const today = new Date();
    const expiry = new Date(payload.endDate || payload.signingDate);
    const diffTime = expiry.getTime() - today.getTime();
    const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const contractItems: IContractItem[] = (quote.items || []).map((item, idx) => ({
      id: `ci-${Date.now()}-${idx}`,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      discountAmount: item.discountAmount,
      lineTotal: item.lineTotal,
    }));

    const newContract: IContract = {
      id: `ctr-${Date.now()}`,
      contractNumber: payload.contractNumber,
      title: payload.title,
      quotationId: quote.id,
      quotationNumber: quote.quoteNumber,
      dealId: quote.dealId,
      dealTitle: quote.dealTitle,
      customerId: quote.customerId,
      customerName: quote.customerName,
      customerCompany: quote.customerCompany,
      customerTaxCode: quote.customerTaxCode,
      ownerId: 'usr-admin-01',
      ownerName: actorName,
      totalValue: quote.grandTotal,
      grandTotal: quote.grandTotal,
      totalInWords: quote.totalInWords,
      signingDate: payload.signingDate,
      effectiveDate: payload.startDate,
      expiryDate: payload.endDate,
      remainingDays: Math.max(0, remainingDays),
      isExpiringSoon: remainingDays >= 0 && remainingDays <= 30,
      isExpired: remainingDays < 0,
      paymentTerms: payload.paymentTerms,
      deliveryTerms: payload.deliveryTerms,
      status: remainingDays < 0 ? 'expired' : remainingDays <= 30 ? 'expiring_soon' : 'active',
      items: contractItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.saveLocalContract(newContract);

    quote.contractId = newContract.id;
    quote.contractNumber = newContract.contractNumber;
    quote.status = 'accepted';
    quoteService.saveDraft(quote);

    let backendDealUpdated = false;
    try {
      if (quote.dealId) {
        await axiosInstance.put(`/deals/${quote.dealId}/stage`, {
          stage: 'won',
          probability: 100,
          value: quote.grandTotal,
        });
        backendDealUpdated = true;
      }
    } catch {
      try {
        const storedDealsRaw = window.localStorage.getItem('nexus_deals_cache');
        if (storedDealsRaw) {
          const list = JSON.parse(storedDealsRaw);
          const found = list.find((d: { id: string; stage?: string; probability?: number; value?: number }) => d.id === quote.dealId);
          if (found) {
            found.stage = 'won';
            found.probability = 100;
            found.value = quote.grandTotal;
            window.localStorage.setItem('nexus_deals_cache', JSON.stringify(list));
            backendDealUpdated = true;
          }
        }
      } catch {
        // ignore
      }
    }

    try {
      await axiosInstance.post('/contracts', {
        quotationId: quote.id,
        contractNumber: newContract.contractNumber,
        title: newContract.title,
        signingDate: newContract.signingDate,
        effectiveDate: newContract.effectiveDate,
        expiryDate: newContract.expiryDate,
        paymentTerms: newContract.paymentTerms,
        deliveryTerms: newContract.deliveryTerms,
        notes: payload.notes,
      });
    } catch {
      // Backend optional
    }

    return { contract: newContract, backendDealUpdated };
  }
  async getContracts(params?: IGetContractsParams): Promise<IContract[]> {
    try {
      const response = await axiosInstance.get<IContract[]>('/contracts', { params });
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
      return this.getLocalContracts();
    } catch (err: unknown) {
      console.warn('Backend /contracts unavailable, falling back to local contracts cache:', err);
      return this.getLocalContracts();
    }
  }

  async getContract(id: string): Promise<IContract> {
    const response = await axiosInstance.get<IContract>(`/contracts/${id}`);
    return response.data;
  }

  async createContract(payload: ICreateContractDTO): Promise<IContract> {
    const response = await axiosInstance.post<IContract>('/contracts', payload);
    const saved = response.data;
    this.saveLocalContract(saved);
    return saved;
  }

  async renewContract(id: string, payload: IContractRenewalDTO): Promise<IDeal> {
    const response = await axiosInstance.post<IDeal>(`/contracts/${id}/renew`, payload);
    return response.data;
  }

  getPdfUrl(contractId: string): string {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('access_token') : '';
    const query = token ? `?token=${encodeURIComponent(token)}` : '';
    return `${API_BASE_URL}/contracts/${contractId}/pdf${query}`;
  }

  openPrintWindow(contract: IContract): void {
    if (typeof window === 'undefined') return;

    const itemsRows = (contract.items || []).map((it, idx) => `
      <tr>
        <td style="text-align: center; padding: 10px; border: 1px solid #cbd5e1;">${idx + 1}</td>
        <td style="padding: 10px; border: 1px solid #cbd5e1;"><strong>${it.productName}</strong></td>
        <td style="text-align: center; padding: 10px; border: 1px solid #cbd5e1;">${it.unit}</td>
        <td style="text-align: center; padding: 10px; border: 1px solid #cbd5e1; font-weight: 600;">${it.quantity}</td>
        <td style="text-align: right; padding: 10px; border: 1px solid #cbd5e1;">${Number(it.unitPrice).toLocaleString('vi-VN')} đ</td>
        <td style="text-align: right; padding: 10px; border: 1px solid #cbd5e1; color: #d97706;">${it.discountAmount > 0 ? '-' + Number(it.discountAmount).toLocaleString('vi-VN') + ' đ' : '—'}</td>
        <td style="text-align: right; padding: 10px; border: 1px solid #cbd5e1; font-weight: 700;">${Number(it.lineTotal).toLocaleString('vi-VN')} đ</td>
      </tr>
    `).join('');

    const formattedTotal = Number(contract.totalValue || contract.grandTotal || 0).toLocaleString('vi-VN');
    const inWords = contract.totalInWords || 'Theo giá trị ghi nhận trong hợp đồng.';

    const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Hợp Đồng Kinh Tế ${contract.contractNumber} - NexusCRM</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #0f172a;
      margin: 0;
      padding: 40px;
      background: #ffffff;
      line-height: 1.6;
      font-size: 14px;
    }
    .national-header {
      text-align: center;
      margin-bottom: 25px;
    }
    .national-header strong {
      font-size: 15px;
      letter-spacing: 0.05em;
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .brand-title {
      font-size: 18px;
      font-weight: 800;
      color: #2563eb;
    }
    .meta-box {
      text-align: right;
      font-size: 13px;
    }
    .contract-num {
      font-size: 16px;
      font-weight: 800;
      color: #1e3a8a;
    }
    .page-title {
      text-align: center;
      margin: 20px 0 6px;
      text-transform: uppercase;
      color: #1e3a8a;
      font-size: 22px;
      font-weight: 800;
    }
    .parties-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 24px 0;
    }
    .party-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 16px;
      border-radius: 8px;
      font-size: 13px;
    }
    .party-title {
      color: #2563eb;
      font-weight: 800;
      margin-bottom: 6px;
      text-transform: uppercase;
      font-size: 13px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 13px;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      padding: 10px;
      border: 1px solid #cbd5e1;
      text-align: left;
      font-size: 12px;
      text-transform: uppercase;
    }
    .total-box {
      text-align: right;
      font-size: 16px;
      font-weight: 800;
      color: #2563eb;
      margin: 14px 0 6px;
    }
    .words-box {
      background: #eff6ff;
      border-left: 4px solid #2563eb;
      padding: 12px 16px;
      margin-bottom: 24px;
      font-style: italic;
      font-size: 13px;
    }
    .terms-box {
      margin: 20px 0;
      font-size: 13px;
      color: #475569;
      line-height: 1.7;
    }
    .signatures-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      text-align: center;
      margin-top: 40px;
    }
    .sig-block {
      padding: 10px;
    }
    .sig-space {
      height: 90px;
    }
    .no-print-bar {
      position: sticky;
      top: 0;
      background: #1e293b;
      color: #ffffff;
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: -40px -40px 30px -40px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .btn-print {
      background: #2563eb;
      color: #ffffff;
      border: none;
      padding: 8px 18px;
      border-radius: 6px;
      font-weight: 700;
      cursor: pointer;
      font-size: 14px;
    }
    .btn-print:hover {
      background: #1d4ed8;
    }
    @media print {
      body { padding: 0; }
      .no-print-bar { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div>
      <strong>Bản Xem Trước Hợp Đồng Kinh Tế — ${contract.contractNumber}</strong>
      <span style="margin-left: 10px; opacity: 0.8; font-size: 12px;">(Sử dụng hộp thoại in để lưu thành tệp PDF chuẩn A4)</span>
    </div>
    <button class="btn-print" onclick="window.print()">🖨 In Hợp Đồng / Lưu PDF</button>
  </div>

  <div class="national-header">
    <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br>
    <strong>Độc lập - Tự do - Hạnh phúc</strong><br>
    <span>---o0o---</span>
  </div>

  <div class="header-bar">
    <div>
      <div class="brand-title">CÔNG TY CỔ PHẦN CÔNG NGHỆ NEXUS VIỆT NAM</div>
      <div style="font-size: 12px; color: #475569; margin-top: 4px;">Tòa nhà Nexus Tower, 180 Đường Cầu Giấy, Quận Cầu Giấy, Hà Nội</div>
      <div style="font-size: 12px; color: #475569;">Hotline: 1900 6868 · Email: contact@nexuscrm.vn · MST: 0108889999</div>
    </div>
    <div class="meta-box">
      <div class="contract-num">SỐ HĐ: ${contract.contractNumber}</div>
      <div style="color: #64748b; margin-top: 2px;">Ngày ký: ${contract.signingDate || '—'}</div>
      <div style="color: #059669; font-weight: 600; margin-top: 2px;">Hiệu lực: ${contract.effectiveDate || '—'} đến ${contract.expiryDate || '—'}</div>
    </div>
  </div>

  <h1 class="page-title">${contract.title || 'HỢP ĐỒNG KINH TẾ'}</h1>
  <div style="text-align: center; color: #64748b; font-size: 13px; margin-bottom: 20px;">
    (V/v: Cung cấp giải pháp phần mềm Quản lý Bán hàng & Dịch vụ Cloud NexusCRM)
  </div>

  <div class="parties-grid">
    <div class="party-card">
      <div class="party-title">BÊN A (BÊN KHÁCH HÀNG / SỬ DỤNG DỊCH VỤ):</div>
      <div><strong>Đơn vị:</strong> ${contract.customerCompany || contract.customerName || '—'}</div>
      <div><strong>Người đại diện:</strong> ${contract.customerName || 'Đại diện Khách hàng'}</div>
      <div><strong>Mã số thuế:</strong> ${contract.customerTaxCode || 'Chưa cập nhật'}</div>
      <div><strong>Điều khoản thanh toán:</strong> ${contract.paymentTerms || 'Theo thỏa thuận hai bên.'}</div>
    </div>
    <div class="party-card">
      <div class="party-title">BÊN B (BÊN CUNG CẤP DỊCH VỤ):</div>
      <div><strong>Đơn vị:</strong> CÔNG TY CỔ PHẦN CÔNG NGHỆ NEXUS VIỆT NAM</div>
      <div><strong>Người đại diện:</strong> ${contract.ownerName || 'Tổng Giám Đốc'}</div>
      <div><strong>Mã số thuế:</strong> 0108889999</div>
      <div><strong>Địa chỉ:</strong> Tòa nhà Nexus Tower, Cầu Giấy, Hà Nội</div>
    </div>
  </div>

  <p>Hai bên cùng thống nhất ký kết hợp đồng kinh tế với các điều khoản và danh mục dịch vụ dưới đây:</p>

  <table>
    <thead>
      <tr>
        <th style="width: 36px; text-align: center;">STT</th>
        <th>Sản phẩm / Dịch vụ</th>
        <th style="width: 60px; text-align: center;">ĐVT</th>
        <th style="width: 50px; text-align: center;">SL</th>
        <th style="width: 120px; text-align: right;">Đơn giá</th>
        <th style="width: 110px; text-align: right;">Chiết khấu</th>
        <th style="width: 130px; text-align: right;">Thành tiền</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows}
    </tbody>
  </table>

  <div class="total-box">
    TỔNG GIÁ TRỊ HỢP ĐỒNG: ${formattedTotal} VNĐ
  </div>

  <div class="words-box">
    <strong>Số tiền viết bằng chữ:</strong> ${inWords}
  </div>

  <div class="terms-box">
    <strong>ĐIỀU KHOẢN VÀ CAM KẾT CHUNG:</strong><br>
    1. <strong>Tiến độ bàn giao:</strong> ${contract.deliveryTerms || 'Bàn giao tài khoản quản trị và kích hoạt hệ thống trong vòng 24 giờ sau khi ký hợp đồng.'}<br>
    2. <strong>Quy chuẩn dịch vụ & Bảo mật:</strong> Bên B cam kết bảo mật tuyệt đối toàn bộ cơ sở dữ liệu khách hàng, duy trì hạ tầng Cloud ổn định với chỉ số cam kết SLA &ge; 99.9%.<br>
    3. <strong>Hỗ trợ kỹ thuật:</strong> Đội ngũ kỹ sư hỗ trợ 24/7 trong suốt thời hạn hiệu lực của hợp đồng.
  </div>

  <div class="signatures-grid">
    <div class="sig-block">
      <strong style="text-transform: uppercase;">ĐẠI DIỆN BÊN A</strong><br>
      <span style="font-size: 12px; color: #64748b;">(Ký, ghi rõ họ tên và đóng dấu)</span>
      <div class="sig-space"></div>
      <strong>${contract.customerName || 'Đại diện Khách hàng'}</strong>
    </div>
    <div class="sig-block">
      <strong style="text-transform: uppercase;">ĐẠI DIỆN BÊN B</strong><br>
      <span style="font-size: 12px; color: #64748b;">(Ký, ghi rõ họ tên và đóng dấu)</span>
      <div class="sig-space"></div>
      <strong>${contract.ownerName || 'CÔNG TY CP CÔNG NGHỆ NEXUS'}</strong>
    </div>
  </div>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }
  }

  // Local caching fallback
  private getLocalContracts(): IContract[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem('nexus_contracts_master_list');
      if (raw) {
        return JSON.parse(raw);
      }
      const initialContracts: IContract[] = [
        {
          id: 'ctr-2026-001',
          contractNumber: 'HD-2026-NEXUS-01',
          title: 'Hợp đồng Bản quyền Phần mềm NexusCRM Enterprise & Dịch vụ Cloud',
          quotationId: 'quote-demo-01',
          quotationNumber: 'BG-2026-0089',
          dealId: 'deal-01',
          dealTitle: 'Triển khai CRM cho Tập đoàn FPT Software',
          customerId: 'cust-01',
          customerName: 'Nguyễn Văn An',
          customerCompany: 'Tập đoàn FPT Software',
          customerTaxCode: '0101248141',
          ownerId: 'usr-01',
          ownerName: 'Trần Thị Thu Hà',
          totalValue: 245000000,
          totalInWords: 'Hai trăm bốn mươi lăm triệu đồng',
          signingDate: '2025-11-15',
          effectiveDate: '2025-11-20',
          expiryDate: '2026-11-20',
          remainingDays: 30,
          isExpiringSoon: true,
          isExpired: false,
          paymentTerms: 'Thanh toán 100% trong vòng 15 ngày kể từ ngày nghiệm thu.',
          status: 'expiring_soon',
          items: [
            {
              id: 'ci-1',
              productName: 'Gói NexusCRM Enterprise Bản quyền 50 Users',
              quantity: 1,
              unit: 'Gói',
              unitPrice: 180000000,
              discountAmount: 18000000,
              lineTotal: 162000000,
            },
            {
              id: 'ci-2',
              productName: 'Dịch vụ Đào tạo & Chuyển giao công nghệ Onsite (3 ngày)',
              quantity: 3,
              unit: 'Buổi',
              unitPrice: 20000000,
              discountAmount: 0,
              lineTotal: 60000000,
            },
          ],
          createdAt: '2025-11-15T09:00:00Z',
        },
        {
          id: 'ctr-2026-002',
          contractNumber: 'HD-2026-VIETTEL-02',
          title: 'Hợp đồng Nâng cấp Module Quản lý Báo giá & Phê duyệt Phân cấp',
          quotationId: 'quote-demo-02',
          quotationNumber: 'BG-2026-0102',
          dealId: 'deal-02',
          dealTitle: 'Gia hạn gói dịch vụ Viettel Telecom',
          customerId: 'cust-02',
          customerName: 'Lê Hoàng Nam',
          customerCompany: 'Tập đoàn Công nghiệp - Viễn thông Quân đội (Viettel)',
          customerTaxCode: '0100109106',
          ownerId: 'usr-admin-01',
          ownerName: 'Quản Trị Viên Hệ Thống',
          totalValue: 480000000,
          totalInWords: 'Bốn trăm tám mươi triệu đồng',
          signingDate: '2026-02-10',
          effectiveDate: '2026-02-15',
          expiryDate: '2027-02-15',
          remainingDays: 117,
          isExpiringSoon: false,
          isExpired: false,
          paymentTerms: 'Chia làm 2 đợt: 50% sau khi ký, 50% sau khi bàn giao.',
          status: 'active',
          items: [
            {
              id: 'ci-3',
              productName: 'Gói Mở rộng Tính năng Tự động hóa IF-THEN & Quote Portal',
              quantity: 1,
              unit: 'Gói',
              unitPrice: 480000000,
              discountAmount: 0,
              lineTotal: 480000000,
            },
          ],
          createdAt: '2026-02-10T14:30:00Z',
        },
      ];
      window.localStorage.setItem('nexus_contracts_master_list', JSON.stringify(initialContracts));
      return initialContracts;
    } catch {
      return [];
    }
  }

  private saveLocalContract(contract: IContract): void {
    if (typeof window === 'undefined') return;
    try {
      const list = this.getLocalContracts();
      const idx = list.findIndex((c) => c.id === contract.id);
      if (idx >= 0) {
        list[idx] = contract;
      } else {
        list.unshift(contract);
      }
      window.localStorage.setItem('nexus_contracts_master_list', JSON.stringify(list));
    } catch {
      // ignore
    }
  }
}

export const contractService = new ContractService();
