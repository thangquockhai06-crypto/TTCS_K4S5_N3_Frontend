import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { FilePlus2, Save } from 'lucide-react';
import { Button, Card } from '../../components/common';
import { IPdfTemplate, IPdfTemplatePayload } from '../../interfaces';
import { salesDocumentService } from '../../services/salesDocumentService';
import styles from './PdfTemplateSettings.module.css';

const createEmptyTemplate = (templateType: IPdfTemplate['templateType']): IPdfTemplatePayload => ({
  name: '',
  templateType,
  logoUrl: '',
  companyName: '',
  companyTaxCode: '',
  companyAddress: '',
  companyPhone: '',
  companyEmail: '',
  companyBankAccount: '',
  headerText: '',
  footerText: '',
  termsAndConditions: '',
  isDefault: false,
});

type PdfTemplateTextField = Exclude<keyof IPdfTemplatePayload, 'templateType' | 'isDefault'>;

export const PdfTemplateSettings: React.FC = () => {
  const [templates, setTemplates] = useState<IPdfTemplate[]>([]);
  const [templateType, setTemplateType] = useState<IPdfTemplate['templateType']>('quotation');
  const [selectedId, setSelectedId] = useState('');
  const [payload, setPayload] = useState<IPdfTemplatePayload>(() => createEmptyTemplate('quotation'));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const visibleTemplates = useMemo(
    () => templates.filter((template) => template.templateType === templateType),
    [templates, templateType]
  );

  const loadTemplates = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await salesDocumentService.getPdfTemplates();
      setTemplates(result);
      const preferred =
        result.find((item) => item.templateType === templateType && item.isDefault) ??
        result.find((item) => item.templateType === templateType);
      setSelectedId(preferred?.id ?? '');
      setPayload(preferred ? { ...preferred } : createEmptyTemplate(templateType));
    } catch (loadError) {
      console.error('Không thể tải cấu hình mẫu PDF.', loadError);
      setError('Không thể tải các mẫu PDF. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadTemplates();
  }, []);

  const changeType = (nextType: IPdfTemplate['templateType']): void => {
    setTemplateType(nextType);
    const preferred =
      templates.find((item) => item.templateType === nextType && item.isDefault) ??
      templates.find((item) => item.templateType === nextType);
    setSelectedId(preferred?.id ?? '');
    setPayload(preferred ? { ...preferred } : createEmptyTemplate(nextType));
    setSavedMessage(null);
  };

  const selectTemplate = (id: string): void => {
    const selected = templates.find((item) => item.id === id);
    setSelectedId(id);
    setPayload(selected ? { ...selected } : createEmptyTemplate(templateType));
    setSavedMessage(null);
  };

  const updateField = <K extends keyof IPdfTemplatePayload>(
    key: K,
    value: IPdfTemplatePayload[K]
  ): void => {
    setPayload((current) => ({ ...current, [key]: value }));
    setSavedMessage(null);
  };

  const saveTemplate = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setSavedMessage(null);
    try {
      const saved = selectedId
        ? await salesDocumentService.updatePdfTemplate(selectedId, payload)
        : await salesDocumentService.createPdfTemplate(payload);
      setTemplates((current) => {
        const withoutSaved = current.filter((item) => item.id !== saved.id);
        const next = saved.isDefault
          ? withoutSaved.map((item) =>
              item.templateType === saved.templateType ? { ...item, isDefault: false } : item
            )
          : withoutSaved;
        return [saved, ...next];
      });
      setSelectedId(saved.id);
      setPayload({ ...saved });
      setSavedMessage('Mẫu đã được lưu.');
    } catch (saveError) {
      console.error('Không thể lưu cấu hình mẫu PDF.', saveError);
      setError('Không thể lưu mẫu PDF. Vui lòng kiểm tra dữ liệu và thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  const input = (
    field: PdfTemplateTextField,
    label: string,
    type = 'text'
  ): React.ReactNode => (
    <label className={styles.field} key={field}>
      <span>{label}</span>
      <input
        type={type}
        value={String(payload[field] ?? '')}
        onChange={(event) => updateField(field, event.target.value)}
        required={field === 'name' || field === 'companyName'}
      />
    </label>
  );

  return (
    <Card padding="lg" className={styles.panel}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Mẫu báo giá & hợp đồng</h2>
          <p className={styles.description}>
            Cấu hình thông tin nhận diện doanh nghiệp được dùng khi in tài liệu.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<FilePlus2 size={15} />}
          onClick={() => {
            setSelectedId('');
            setPayload(createEmptyTemplate(templateType));
            setSavedMessage(null);
            setError(null);
          }}
        >
          Tạo mẫu mới
        </Button>
      </header>

      <div className={styles.typeTabs} role="tablist" aria-label="Loại mẫu PDF">
        <button
          type="button"
          role="tab"
          aria-selected={templateType === 'quotation'}
          className={templateType === 'quotation' ? styles.typeTabActive : styles.typeTab}
          onClick={() => changeType('quotation')}
        >
          Báo giá
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={templateType === 'contract'}
          className={templateType === 'contract' ? styles.typeTabActive : styles.typeTab}
          onClick={() => changeType('contract')}
        >
          Hợp đồng
        </button>
      </div>

      {isLoading ? (
        <p className={styles.message}>Đang tải mẫu...</p>
      ) : (
        <>
          {visibleTemplates.length > 0 && (
            <label className={styles.field}>
              <span>Chọn mẫu để chỉnh sửa</span>
              <select value={selectedId} onChange={(event) => selectTemplate(event.target.value)}>
                <option value="">Mẫu mới</option>
                {visibleTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}{template.isDefault ? ' · Mặc định' : ''}
                  </option>
                ))}
              </select>
            </label>
          )}

          <form className={styles.form} onSubmit={(event) => void saveTemplate(event)}>
            <div className={styles.grid}>
              {input('name', 'Tên mẫu')}
              {input('companyName', 'Tên công ty')}
              {input('logoUrl', 'URL logo')}
              {input('companyTaxCode', 'Mã số thuế')}
              {input('companyPhone', 'Điện thoại')}
              {input('companyEmail', 'Email', 'email')}
              {input('companyAddress', 'Địa chỉ')}
              {input('companyBankAccount', 'Tài khoản ngân hàng')}
            </div>
            <label className={styles.field}>
              <span>Tiêu đề đầu trang</span>
              <textarea
                rows={2}
                value={payload.headerText ?? ''}
                onChange={(event) => updateField('headerText', event.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span>Điều khoản & điều kiện</span>
              <textarea
                rows={4}
                value={payload.termsAndConditions ?? ''}
                onChange={(event) => updateField('termsAndConditions', event.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span>Chân trang</span>
              <textarea
                rows={2}
                value={payload.footerText ?? ''}
                onChange={(event) => updateField('footerText', event.target.value)}
              />
            </label>
            <label className={styles.defaultToggle}>
              <input
                type="checkbox"
                checked={payload.isDefault}
                onChange={(event) => updateField('isDefault', event.target.checked)}
              />
              Dùng làm mẫu mặc định cho {templateType === 'quotation' ? 'báo giá' : 'hợp đồng'}
            </label>

            {error && <p className={styles.error} role="alert">{error}</p>}
            {savedMessage && <p className={styles.success} role="status">{savedMessage}</p>}
            <div className={styles.footer}>
              <Button type="submit" leftIcon={<Save size={15} />} isLoading={isSaving}>
                Lưu mẫu
              </Button>
            </div>
          </form>
        </>
      )}
    </Card>
  );
};
