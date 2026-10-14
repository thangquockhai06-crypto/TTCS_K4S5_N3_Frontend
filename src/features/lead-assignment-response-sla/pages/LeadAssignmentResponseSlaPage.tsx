import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, Filter, RefreshCw, UserRound } from 'lucide-react';
import { Button } from '../../../components/common';
import { useLeadAssignmentResponseSla } from '../hooks/useLeadAssignmentResponseSla';
import { ILeadAssignmentLead } from '../types/LeadAssignmentResponseSla.types';
import { LeadSlaBadge } from '../components/LeadSlaBadge';
import { RejectLeadDialog } from '../components/RejectLeadDialog';
import {
  formatLocalDateTime,
  getLeadAssignmentStatusLabel,
  getLeadSlaState,
} from '../utils/leadAssignmentResponseSla';
import styles from '../styles/LeadAssignmentResponseSla.module.css';

type LeadStatusFilterType = 'all' | 'assigned' | 'accepted' | 'rejected' | 'contacted';
type LeadSlaFilterType = 'all' | 'within' | 'approaching' | 'overdue' | 'satisfied' | 'unknown';
type LeadDateFilterType = 'all' | 'today' | '7d';

export const LeadAssignmentResponseSlaPage: React.FC = () => {
  const {
    leads,
    isLoading,
    error,
    successMessage,
    pendingAcceptId,
    pendingRejectId,
    now,
    developmentNotice,
    loadData,
    acceptLead,
    rejectLead,
  } = useLeadAssignmentResponseSla();

  const [statusFilter, setStatusFilter] = useState<LeadStatusFilterType>('all');
  const [slaFilter, setSlaFilter] = useState<LeadSlaFilterType>('all');
  const [dateFilter, setDateFilter] = useState<LeadDateFilterType>('all');
  const [selectedLead, setSelectedLead] = useState<ILeadAssignmentLead | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesStatus =
        statusFilter === 'all' || lead.status === statusFilter;

      const matchesSla =
        slaFilter === 'all' || getLeadSlaState(lead, now) === slaFilter;

      const matchesDate = (() => {
        if (dateFilter === 'all') {
          return true;
        }

        const assignedAt = new Date(lead.assignedAt).getTime();
        if (Number.isNaN(assignedAt)) {
          return false;
        }

        const daysSinceAssignment = (now.getTime() - assignedAt) / 86_400_000;
        if (dateFilter === 'today') {
          return daysSinceAssignment <= 1;
        }
        return daysSinceAssignment <= 7;
      })();

      return matchesStatus && matchesSla && matchesDate;
    });
  }, [dateFilter, leads, now, slaFilter, statusFilter]);

  const summary = useMemo(() => {
    const overdue = leads.filter((lead) => getLeadSlaState(lead, now) === 'overdue').length;
    const approaching = leads.filter((lead) => getLeadSlaState(lead, now) === 'approaching').length;
    const withinSla = leads.filter((lead) => getLeadSlaState(lead, now) === 'within').length;
    const contacted = leads.filter((lead) => lead.status === 'contacted').length;
    return { overdue, approaching, withinSla, contacted };
  }, [leads, now]);

  const closeDialog = (): void => {
    setSelectedLead(null);
    setRejectReason('');
    setRejectError(null);
  };

  const handleRejectSubmit = async (): Promise<void> => {
    if (!selectedLead) {
      return;
    }

    const trimmed = rejectReason.trim();
    if (!trimmed) {
      setRejectError('A rejection reason is required after trimming whitespace.');
      return;
    }

    const wasAccepted = await rejectLead(selectedLead.id, trimmed);
    if (wasAccepted) {
      closeDialog();
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Assigned lead response & SLA</p>
          <h1>Lead assignment response & SLA monitoring</h1>
          <p className={styles.subtitle}>
            Accept or reject assigned leads and monitor SLA states without assuming first contact equals SLA compliance.
          </p>
        </div>

        <Button
          variant="secondary"
          leftIcon={<RefreshCw size={16} />}
          onClick={() => void loadData()}
          isLoading={isLoading}
        >
          Refresh
        </Button>
      </header>

      {developmentNotice && (
        <div className={styles.devBanner} role="status" aria-live="polite">
          {developmentNotice}
        </div>
      )}

      {error && (
        <div className={styles.alert} role="alert">
          {error}
        </div>
      )}

      {successMessage && (
        <div className={styles.successAlert} role="status" aria-live="polite">
          {successMessage}
        </div>
      )}

      <section className={styles.summaryGrid} aria-label="SLA summary">
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Total assigned</span>
          <strong className={styles.summaryValue}>{leads.length}</strong>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Within SLA</span>
          <strong className={styles.summaryValue}>{summary.withinSla}</strong>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Approaching deadline</span>
          <strong className={styles.summaryValue}>{summary.approaching}</strong>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Overdue</span>
          <strong className={styles.summaryValue}>{summary.overdue}</strong>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Contacted</span>
          <strong className={styles.summaryValue}>{summary.contacted}</strong>
        </div>
      </section>

      <section className={styles.filters} aria-label="Lead filters">
        <label className={styles.filterField}>
          <span>
            <Filter size={14} /> Assignment status
          </span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as LeadStatusFilterType)}>
            <option value="all">All</option>
            <option value="assigned">Assigned</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="contacted">Contacted</option>
          </select>
        </label>

        <label className={styles.filterField}>
          <span>
            <Clock3 size={14} /> SLA state
          </span>
          <select value={slaFilter} onChange={(event) => setSlaFilter(event.target.value as LeadSlaFilterType)}>
            <option value="all">All</option>
            <option value="within">Within SLA</option>
            <option value="approaching">Approaching deadline</option>
            <option value="overdue">Overdue</option>
            <option value="satisfied">SLA satisfied</option>
            <option value="unknown">Unknown</option>
          </select>
        </label>

        <label className={styles.filterField}>
          <span>
            <UserRound size={14} /> Time window
          </span>
          <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value as LeadDateFilterType)}>
            <option value="all">All dates</option>
            <option value="today">Today</option>
            <option value="7d">Last 7 days</option>
          </select>
        </label>
      </section>

      <section className={styles.tableWrap}>
        {filteredLeads.length === 0 ? (
          <div className={styles.emptyState}>
            <CheckCircle2 size={32} />
            <h2>No matching assigned leads</h2>
            <p>Try adjusting the status, SLA, or date filters.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Lead</th>
                <th>Assignment</th>
                <th>Contact status</th>
                <th>SLA</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <div className={styles.leadCell}>
                      <div className={styles.leadIdentity}>
                        <strong>{lead.leadName}</strong>
                        <span>{lead.company}</span>
                      </div>
                      <div className={styles.leadMeta}>
                        <span>{lead.source}</span>
                        {lead.email && <span>{lead.email}</span>}
                        {lead.phone && <span>{lead.phone}</span>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.assignmentText}>
                      <span>{lead.assignedTo}</span>
                      <small>{formatLocalDateTime(lead.assignedAt)}</small>
                    </div>
                  </td>
                  <td>
                    <div className={styles.statusColumn}>
                      <span className={styles.statusPill}>{getLeadAssignmentStatusLabel(lead.status)}</span>
                      {lead.firstContactAt && (
                        <small>First contact: {formatLocalDateTime(lead.firstContactAt)}</small>
                      )}
                      {lead.rejectionReason && (
                        <small>Rejection: {lead.rejectionReason}</small>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className={styles.slaCell}>
                      <LeadSlaBadge lead={lead} now={now} />
                      {lead.slaDeadlineAt && (
                        <small>Due: {formatLocalDateTime(lead.slaDeadlineAt)}</small>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className={styles.actionsCell}>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => void acceptLead(lead.id)}
                        isLoading={pendingAcceptId === lead.id}
                        disabled={pendingAcceptId !== null || pendingRejectId !== null}
                      >
                        Accept lead
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedLead(lead);
                          setRejectReason('');
                          setRejectError(null);
                        }}
                        disabled={pendingAcceptId !== null || pendingRejectId !== null}
                      >
                        Reject
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className={styles.teamLeadPanel}>
        <h2>Team lead monitoring</h2>
        <ul>
          {leads
            .filter((lead) => lead.teamLead || lead.assignedTo)
            .slice(0, 4)
            .map((lead) => (
              <li key={lead.id}>
                <div>
                  <strong>{lead.leadName}</strong>
                  <span>{lead.company}</span>
                </div>
                <div>
                  <span>{lead.assignedTo}</span>
                  <small>
                    {lead.teamLead ? `Team lead: ${lead.teamLead}` : 'Team lead unavailable'}
                  </small>
                </div>
                <LeadSlaBadge lead={lead} now={now} />
              </li>
            ))}
        </ul>
      </section>

      <RejectLeadDialog
        isOpen={Boolean(selectedLead)}
        leadName={selectedLead?.leadName ?? ''}
        company={selectedLead?.company ?? ''}
        reason={rejectReason}
        isSubmitting={pendingRejectId !== null}
        onClose={closeDialog}
        onReasonChange={setRejectReason}
        onSubmit={handleRejectSubmit}
        error={rejectError}
      />

      {pendingRejectId && selectedLead && (
        <div className={styles.inlineStatus} role="status">
          Rejecting {selectedLead.leadName}…
        </div>
      )}

      {pendingAcceptId && (
        <div className={styles.inlineStatus} role="status">
          Accepting a lead…
        </div>
      )}

      {!isLoading && !error && filteredLeads.length > 0 && (
        <div className={styles.helperTip}>
          <AlertTriangle size={16} />
          Accepting only updates the assignment status. It does not mark the customer as contacted or satisfy SLA.
        </div>
      )}
    </main>
  );
};
