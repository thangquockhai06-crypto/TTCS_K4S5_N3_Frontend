import { FormEvent, useCallback, useState } from 'react';
import { ISalesCatalogFormValues } from '../types/SalesCatalog.types';

interface IUseSalesCatalogFormOptions {
  initialValues: ISalesCatalogFormValues;
  onSubmit: (values: ISalesCatalogFormValues) => Promise<boolean>;
}

interface IUseSalesCatalogFormResult {
  values: ISalesCatalogFormValues;
  nameError: string | null;
  codeError: string | null;
  resetForm: (nextValues: ISalesCatalogFormValues) => void;
  handleChange: (field: keyof ISalesCatalogFormValues, value: string) => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}

export const useSalesCatalogForm = ({
  initialValues,
  onSubmit,
}: IUseSalesCatalogFormOptions): IUseSalesCatalogFormResult => {
  const [values, setValues] = useState<ISalesCatalogFormValues>(initialValues);
  const [nameError, setNameError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  const resetForm = useCallback((nextValues: ISalesCatalogFormValues): void => {
    setValues(nextValues);
    setNameError(null);
    setCodeError(null);
  }, []);

  const handleChange = (
    field: keyof ISalesCatalogFormValues,
    value: string
  ): void => {
    setValues((current) => ({ ...current, [field]: value }));
    if (field === 'name') {
      setNameError(null);
    } else {
      setCodeError(null);
    }
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();
    const name = values.name.trim();
    const code = values.code.trim();
    setNameError(name ? null : 'Tên danh mục không được để trống.');
    setCodeError(code ? null : 'Mã danh mục không được để trống.');
    if (!name || !code) {
      return;
    }
    await onSubmit({ name, code });
  };

  return {
    values,
    nameError,
    codeError,
    resetForm,
    handleChange,
    handleSubmit,
  };
};
