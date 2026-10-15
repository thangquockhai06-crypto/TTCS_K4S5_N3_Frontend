import { useCallback, useMemo, useState } from 'react';
import { ILead } from '../../lead-management/types/Lead.types';
import { leadConversionService } from '../services/leadConversionService';
import {
  ILeadConversionDraft,
  ILeadConversionRequest,
  ILeadConversionResponse,
  ILeadConversionValidationErrors,
} from '../types/LeadConversion.types';

export interface IUseLeadConversionResult {
  lead: ILead | null;
  isOpen: boolean;
  isSubmitting: boolean;
  draft: ILeadConversionDraft;
  errors: ILeadConversionValidationErrors;
  success: ILeadConversionResponse | null;
  errorMessage: string | null;
  open: (nextLead: ILead) => void;
  close: () => void;
  updateDraft: (nextDraft: ILeadConversionDraft) => void;
  submit: (request: ILeadConversionRequest) => Promise<ILeadConversionResponse>;
}

const initialDraft = (lead: ILead | null): ILeadConversionDraft => ({
  companyName: lead?.company ?? '',
  taxCode: '',
  industry: 'Technology',
  companySize: '11-50',
  region: 'Hà Nội',
  contactName: lead?.fullName ?? '',
  email: lead?.email ?? '',
  phone: lead?.phone ?? '',
  leadSource: lead?.source ?? 'website',
  leadOwner: lead?.owner.name ?? '',
  notes: '',
});

function validateDraft(draft: ILeadConversionDraft): ILeadConversionValidationErrors {
  const nextErrors: ILeadConversionValidationErrors = {};

  if (!draft.companyName.trim()) {
    nextErrors.companyName = 'Tên công ty là bắt buộc.';
  }
  if (!draft.contactName.trim()) {
    nextErrors.contactName = 'Tên người liên hệ là bắt buộc.';
  }
  if (!draft.email.trim()) {
    nextErrors.email = 'Email liên hệ là bắt buộc.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
    nextErrors.email = 'Email không hợp lệ.';
  }
  if (!draft.phone.trim()) {
    nextErrors.phone = 'Số điện thoại là bắt buộc.';
  }
  if (!draft.leadOwner.trim()) {
    nextErrors.leadOwner = 'Người phụ trách lead là bắt buộc.';
  }

  return nextErrors;
}

export function useLeadConversion(): IUseLeadConversionResult {
  const [lead, setLead] = useState<ILead | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draft, setDraft] = useState<ILeadConversionDraft>(initialDraft(null));
  const [errors, setErrors] = useState<ILeadConversionValidationErrors>({});
  const [success, setSuccess] = useState<ILeadConversionResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const open = useCallback((nextLead: ILead): void => {
    setLead(nextLead);
    setDraft(initialDraft(nextLead));
    setErrors({});
    setSuccess(null);
    setErrorMessage(null);
    setIsOpen(true);
  }, []);

  const close = useCallback((): void => {
    setIsOpen(false);
    setLead(null);
    setDraft(initialDraft(null));
    setErrors({});
    setSuccess(null);
    setErrorMessage(null);
    setIsSubmitting(false);
  }, []);

  const updateDraft = useCallback(
    (nextDraft: ILeadConversionDraft): void => {
      setDraft(nextDraft);
      if (Object.keys(errors).length > 0) {
        setErrors(validateDraft(nextDraft));
      }
    },
    [errors]
  );

  const submit = useCallback(async (request: ILeadConversionRequest): Promise<ILeadConversionResponse> => {
    const nextErrors = validateDraft({
      companyName: request.companyName,
      taxCode: request.taxCode,
      industry: request.industry,
      companySize: request.companySize,
      region: request.region,
      contactName: request.contactName,
      email: request.email,
      phone: request.phone,
      leadSource: request.leadSource,
      leadOwner: request.leadOwner,
      notes: request.notes,
    });

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      throw new Error('Vui lòng điền đầy đủ thông tin bắt buộc trước khi xác nhận.');
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const result = await leadConversionService.convertLead(request);
      setSuccess(result);
      return result;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Không thể chuyển đổi Lead.';
      setErrorMessage(message);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return useMemo(
    () => ({
      lead,
      isOpen,
      isSubmitting,
      draft,
      errors,
      success,
      errorMessage,
      open,
      close,
      updateDraft,
      submit,
    }),
    [close, draft, errorMessage, errors, isOpen, isSubmitting, lead, open, submit, success, updateDraft]
  );
}
