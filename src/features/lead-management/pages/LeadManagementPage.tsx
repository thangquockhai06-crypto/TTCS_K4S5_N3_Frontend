import React, { useMemo, useState } from 'react';
import { RefreshCw, Save } from 'lucide-react';
import { Button } from '../../../components/common';
import { useLeadManagement } from '../hooks/useLeadManagement';
import { ILead, ISavedLeadFilter } from '../types/Lead.types';
import { LeadFilters } from '../components/LeadFilters';
import { LeadList } from '../components/LeadList';
import { SaveLeadFilterDialog } from '../components/SaveLeadFilterDialog';
import { SavedLeadFilters } from '../components/SavedLeadFilters';
import { getLeadSlaState } from '../utils/leadFilters';
import styles from '../styles/LeadManagement.module.css';

function getOwners(leads: readonly ILead[]): Array<{ id: string; name: string }> {
  const owners = new Map<string, string>();
  leads.forEach((lead) => owners.set(lead.owner.id, lead.owner.name));
  return Array.from(owners, ([id, name]) => ({ id, name })).sort((left, right) =>
    left.name.localeCompare(right.name, 'vi')
  );
}

export const LeadManagementPage: React.FC = () => {
  const management = useLeadManagement();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPreset, setEditingPreset] = useState<ISavedLeadFilter | null>(null);
  const owners = useMemo(() => getOwners(management.leads), [management.leads]);
  const overdueCount = management.filteredLeads.filter(
    (lead) => getLeadSlaState(lead, management.now) === 'overdue'
  ).length;

  const openCreateDialog = (): void => {
    setEditingPreset(null);
    management.clearActionError();
    setIsDialogOpen(true);
  };

  const openRenameDialog = (preset: ISavedLeadFilter): void => {
    setEditingPreset(preset);
    management.clearActionError();
    setIsDialogOpen(true);
  };

  const savePreset = async (name: string): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      return editingPreset
        ? await management.renameSavedFilter(editingPreset.id, name)
        : await management.createSavedFilter(name);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeDialog = (): void => {
    setIsDialogOpen(false);
    setEditingPreset(null);
  };

  return (
    <main className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>QUẢN LÝ CƠ HỘI TIỀM NĂNG</p>
          <h1>Danh sách Lead</h1>
          <p className={styles.pageHeader__subtitle}>
            {management.filteredLeads.length} Lead phù hợp
            {overdueCount > 0 && (
              <span className={styles.overdueSummary}>
                {overdueCount} Lead quá SLA cần ưu tiên
              </span>
            )}
          </p>
        </div>
        <div className={styles.pageHeader__actions}>
          <Button
            variant="secondary"
            leftIcon={<RefreshCw size={16} />}
            onClick={() => void management.loadData()}
            isLoading={management.isLoading}
          >
            Tải lại
          </Button>
          <Button
            variant="primary"
            leftIcon={<Save size={16} />}
            onClick={openCreateDialog}
            disabled={management.isLoading || Boolean(management.error)}
          >
            Lưu bộ lọc
          </Button>
        </div>
      </header>

      <div className={styles.contentGrid}>
        <div className={styles.primaryColumn}>
          <LeadFilters
            filters={management.draftFilters}
            owners={owners}
            error={management.filterError}
            onChange={management.setDraftFilters}
            onApply={management.applyFilters}
            onClear={management.clearFilters}
          />
          <LeadList
            leads={management.pageLeads}
            total={management.filteredLeads.length}
            page={management.page}
            totalPages={management.totalPages}
            isLoading={management.isLoading}
            error={management.error}
            now={management.now}
            onPageChange={management.setPage}
            onRetry={() => void management.loadData()}
          />
        </div>

        <aside className={styles.sideColumn} aria-label="Bộ lọc cá nhân">
          <SavedLeadFilters
            filters={management.savedFilters}
            activePresetId={management.activePresetId}
            onApply={management.applySavedFilter}
            onRename={openRenameDialog}
            onDelete={(id) => void management.deleteSavedFilter(id)}
          />
          {management.actionError && (
            <p className={styles.inlineError} role="alert">
              {management.actionError}
            </p>
          )}
        </aside>
      </div>

      <SaveLeadFilterDialog
        isOpen={isDialogOpen}
        initialName={editingPreset?.name ?? ''}
        isRename={editingPreset !== null}
        error={management.actionError}
        isSubmitting={isSubmitting}
        onClose={closeDialog}
        onSave={savePreset}
      />
    </main>
  );
};
