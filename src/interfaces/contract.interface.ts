/**
 * S7-04: Chuyển Báo giá thành Hợp đồng (Convert Quote to Contract)
 * Quy chuẩn: Naming PascalCase, tiền tố I cho Interface, hậu tố Type cho Type
 * Tuyệt đối 0% kiểu any.
 */

import { IQuoteLineItem } from './quote.interface';

export type ContractStatusType = 'draft' | 'active' | 'expired' | 'terminated';

export interface IContract {
  id: string;
  contractNumber: string; // Số hợp đồng duy nhất trong hệ thống, vd: HD-2026-089
  title: string; // Tiêu đề hợp đồng
  quoteId: string; // ID báo giá nguồn
  quoteNumber: string;
  quoteVersion: number;
  dealId: string; // Cơ hội liên kết
  dealTitle: string;
  customerId: string;
  customerName: string;
  customerCompany?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerTaxCode?: string;

  // Dòng sản phẩm kế thừa toàn bộ từ báo giá đã chốt, không phải gõ lại
  items: IQuoteLineItem[];
  subtotal: number;
  totalDiscountAmount: number;
  totalDiscountPercent: number;
  totalVatAmount: number;
  grandTotal: number; // Giá trị hợp đồng (cơ hội chuyển sang Đóng thắng với giá trị đúng bằng giá trị này)

  // Khai báo thời hạn & điều khoản
  signingDate: string; // Ngày ký (YYYY-MM-DD)
  startDate: string; // Ngày hiệu lực (YYYY-MM-DD)
  endDate: string; // Ngày hết hạn (YYYY-MM-DD)
  paymentTerms: string; // Điều khoản thanh toán
  deliveryTerms?: string; // Điều khoản giao hàng & triển khai
  notes?: string; // Ghi chú nội bộ hợp đồng

  // Đại diện ký bên A & bên B
  signatoryPartyA?: string; // Người đại diện khách hàng ký
  signatoryPartyB?: string; // Người đại diện công ty ký
  status: ContractStatusType;

  createdAt: string;
  updatedAt: string;
  createdBy: string;
  creatorRole: string;
}

export interface ICreateContractFromQuoteDTO {
  quoteId: string;
  contractNumber: string; // Bắt buộc & duy nhất
  title: string;
  signingDate: string;
  startDate: string;
  endDate: string;
  paymentTerms: string;
  deliveryTerms?: string;
  notes?: string;
  signatoryPartyA?: string;
  signatoryPartyB?: string;
}
