import { t, type Locale, type TranslationKey } from './i18n';

// Event codes are storage contracts, never presentation. Keep their human labels
// here so a new timeline cannot accidentally expose an internal enum to an agent.
const eventKeys: Readonly<Record<string, TranslationKey>> = {
  lead_received: 'leadReceived', lead_contacted: 'leadContacted', quote_sent: 'quoteSent', lead_follow_up: 'leadFollowUp', lead_review_adjustments: 'leadReviewAdjustments', lead_paused: 'leadPaused', lead_cancelled: 'leadCancelled', lead_converted: 'leadConverted',
  lead_client_linked: 'leadClientLinked', lead_updated: 'leadUpdated', client_created: 'clientCreated', client_updated: 'clientUpdated', client_workspace_saved: 'clientWorkspaceSaved',
  trip_created: 'tripCreated', trip_workspace_saved: 'tripWorkspaceSaved', trip_cancelled: 'tripCancelledEvent', trip_reconciled_completed: 'tripReconciledCompleted', trip_reference_rate_changed: 'tripReferenceRateChanged',
  payment_recorded: 'paymentRecorded', customer_payment_recorded: 'customerPaymentRecorded', customer_payment_corrected: 'customerPaymentCorrected', initial_payment_assigned_to_component: 'initialPaymentAssignedToComponent',
  task_completed: 'taskCompletedEvent', task_reopened: 'taskReopened', task_rescheduled: 'taskRescheduled', task_template_date_recalculated: 'taskTemplateDateRecalculated', task_template_date_review_resolved: 'taskTemplateDateReviewResolved', commission_follow_up_task_created: 'commissionFollowUpTaskCreated',
  commission_created_for_service_provider: 'commissionCreatedForServiceProvider', commission_enabled_for_service_provider: 'commissionEnabledForServiceProvider', commission_marked_paid: 'commissionMarkedPaid', commission_tracking_updated: 'commissionTrackingUpdated', commission_cancelled_from_service_provider_cancellation: 'commissionCancelledFromComponent',
  provider_reactivated: 'providerReactivated', service_provider_cancellation_recorded: 'serviceProviderCancellationRecorded', record_archived: 'recordArchivedEvent', record_restored: 'recordRestoredEvent',
};

export function activityEventLabel(eventType: string, locale: Locale): string {
  return t(eventKeys[eventType] ?? 'activityRecorded', locale);
}
