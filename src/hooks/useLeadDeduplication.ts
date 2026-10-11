import { useState, useCallback, useMemo } from 'react';
import {
  IDuplicateCheckResult,
  IDuplicateLeadPair,
  IMergeLeadsDTO,
} from '../interfaces/lead-deduplication.interface';
import { ILeadSubmission } from '../interfaces/lead-capture.interface';
import { ICustomer } from '../interfaces/customer.interface';
import { leadDeduplicationService } from '../services/leadDeduplicationService';
import { useLeadCapture } from './useLeadCapture';
import { useCRMData } from '../context/CRMDataContext';
import { useToast } from '../context/ToastContext';

export function useLeadDeduplication() {
  const { submissions: leads, updateSubmission, deleteSubmission } = useLeadCapture();
  const { customers, addCustomerActivity } = useCRMData();
  const { showToast } = useToast();

  const [selectedPairForMerge, setSelectedPairForMerge] = useState<IDuplicateLeadPair | null>(null);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState<boolean>(false);

  // Quét danh sách các cặp lead bị trùng lặp
  const duplicatePairs = useMemo(() => {
    return leadDeduplicationService.findDuplicatePairs(leads);
  }, [leads]);

  // Kiểm tra trùng lặp realtime khi người dùng đang gõ form
  const checkDuplicateRealtime = useCallback(
    (
      input: { email?: string; phone?: string; company?: string },
      currentLeadId?: string
    ): IDuplicateCheckResult => {
      return leadDeduplicationService.checkDuplicate(
        input,
        currentLeadId,
        leads,
        customers
      );
    },
    [leads, customers]
  );

  // Gộp 2 lead trùng lặp: Giữ nguyên lịch sử của cả hai bản ghi
  const mergeLeads = useCallback(
    (dto: IMergeLeadsDTO): boolean => {
      const masterLead = leads.find((l) => l.id === dto.masterLeadId);
      const duplicateLead = leads.find((l) => l.id === dto.duplicateLeadId);

      if (!masterLead || !duplicateLead) {
        showToast('Không tìm thấy thông tin bản ghi lead để thực hiện gộp.', 'error');
        return false;
      }

      const now = new Date();
      const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      // Hợp nhất lịch sử tương tác của cả 2 bản ghi
      const combinedHistory = [
        ...(masterLead.history || []),
        ...(duplicateLead.history || []),
        `[${formattedDate}] Đã gộp thành công bản ghi từ lead "${duplicateLead.fullName}" (SĐT: ${duplicateLead.phone}, Email: ${duplicateLead.email}) vào bản ghi chính. Nguồn gốc cũ: ${duplicateLead.leadSource}.`,
        ...dto.mergedHistoryNotes,
      ];

      // Cập nhật bản ghi chính với dữ liệu đã chọn
      const updateSuccess = updateSubmission(dto.masterLeadId, {
        fullName: dto.mergedData.fullName,
        email: dto.mergedData.email,
        phone: dto.mergedData.phone,
        company: dto.mergedData.company,
        leadSource: dto.mergedData.leadSource,
        interest: dto.mergedData.interest,
        notes: dto.mergedData.notes || masterLead.notes || duplicateLead.notes,
        history: combinedHistory,
      });

      if (!updateSuccess) {
        showToast('Không thể cập nhật bản ghi chính khi gộp lead.', 'error');
        return false;
      }

      // Xóa bản ghi phụ (hoặc đánh dấu đã gộp) để nhân viên khác không gọi trùng
      deleteSubmission(dto.duplicateLeadId);

      showToast(
        `Đã gộp lead thành công! Toàn bộ lịch sử của cả 2 bản ghi đã được lưu giữ nguyên vẹn.`,
        'success'
      );
      setIsMergeModalOpen(false);
      setSelectedPairForMerge(null);
      return true;
    },
    [leads, updateSubmission, deleteSubmission, showToast]
  );

  // Gắn thẳng lead vào khách hàng đã có trong CRM
  const linkLeadToExistingCustomer = useCallback(
    (lead: ILeadSubmission, customer: ICustomer, customNote?: string): boolean => {
      const now = new Date();
      const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const noteContent =
        customNote ||
        `Lead mới quan tâm lại từ nguồn "${lead.leadSource}". Nhu cầu: ${lead.interest}. SĐT: ${lead.phone}, Email: ${lead.email}.${lead.notes ? ` Ghi chú: ${lead.notes}` : ''}`;

      // Thêm hoạt động tương tác vào Customer 360
      addCustomerActivity(
        customer.id,
        `Tương tác Lead mới (Gắn trực tiếp từ ${lead.leadSource})`,
        noteContent,
        'email',
        'Hệ thống Cảnh báo & Gộp Lead'
      );

      // Cập nhật lead với customerId
      updateSubmission(lead.id, {
        customerId: customer.id,
        history: [
          ...(lead.history || []),
          `[${formattedDate}] Đã gắn thẳng vào hồ sơ Khách hàng hiện hữu: "${customer.fullName}" (${customer.company}, ID: ${customer.id}).`,
        ],
      });

      showToast(
        `Đã gắn thẳng lead "${lead.fullName}" vào khách hàng "${customer.fullName}" (${customer.company}) thành công!`,
        'success'
      );
      return true;
    },
    [addCustomerActivity, updateSubmission, showToast]
  );

  return {
    duplicatePairs,
    checkDuplicateRealtime,
    mergeLeads,
    linkLeadToExistingCustomer,
    isMergeModalOpen,
    setIsMergeModalOpen,
    selectedPairForMerge,
    setSelectedPairForMerge,
  };
}
