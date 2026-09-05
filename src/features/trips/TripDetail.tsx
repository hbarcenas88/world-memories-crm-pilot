import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Save, X } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { t, useLocale } from '../../app/i18n';
import { ageAtDate } from '../../domain/dates';
import { formatOperationalDate, formatOperationalDateTime, formatOperationalNumber } from '../../domain/operationalDate';
import type { ActivityEvent, Client, Currency, FamilyMember, Payment, Provider, RichNote, Service, ServiceAdditionalItem, Task, Trip } from '../../domain/types';
import { OperationalDateField } from '../../design/components/OperationalDateField';
import { CustomerPaymentPanel, type CustomerPaymentComponent } from './CustomerPaymentPanel';
import { ServiceProviderAssignment, type ProviderAssignmentResult, type ServiceProviderAssignmentValue, type SuggestedProviderTaskValue } from './ServiceProviderAssignment';
import { UnsavedChangesDialog } from './UnsavedChangesDialog';

export type TripWorkspaceDraft = Readonly<{
  client: Client;
  trip: Trip;
  services: readonly Service[];
  serviceAdditionalItems?: readonly ServiceAdditionalItem[];
  notes: readonly RichNote[];
  events?: readonly ActivityEvent[];
  referenceRateChangeConfirmed?: boolean;
  referenceRateChangeReason?: string;
}>;

type TripDetailProps = Readonly<TripWorkspaceDraft & {
  onClose: () => void;
  onSave: (draft: TripWorkspaceDraft) => void | Promise<void>;
  paymentComponents?: readonly CustomerPaymentComponent[];
  payments?: readonly Payment[];
  tasks?: readonly Task[];
  onRecordPayment?: (input: Readonly<{ serviceProviderId: string; amount: Readonly<{ amount: number; currency: 'USD' | 'MXN' }>; occurredOn: string }>) => Promise<void>;
  onCorrectPayment?: (input: Readonly<{ paymentId: string; amount: Readonly<{ amount: number; currency: 'USD' | 'MXN' }>; occurredOn: string }>) => Promise<void>;
  onAssignInitialPayment?: (input: Readonly<{ paymentId: string; serviceProviderId: string }>) => Promise<void>;
  providers?: readonly Provider[];
  onAddProvider?: (value: ServiceProviderAssignmentValue) => Promise<ProviderAssignmentResult>;
  onCreateSuggestedTasks?: (serviceProviderId: string, tasks: readonly SuggestedProviderTaskValue[]) => Promise<void>;
  onReactivateProvider?: (providerId: string) => Promise<void>;
  onEnableCommission?: (serviceProviderId: string) => Promise<void>;
  onRecordComponentCancellation?: (input: Readonly<{ serviceProviderId: string; cancellationOutcome: NonNullable<import('../../domain/types').ServiceProvider['cancellationOutcome']>; commissionOutcome: 'cancel' | 'continue' }>) => Promise<void>;
  onCancelTrip?: (tripId: string) => Promise<void>;
  renderServiceActions?: (service: Service) => ReactNode;
  renderPaymentActions?: (payment: Payment) => ReactNode;
  onOpenServiceWorkspace?: (service: Service) => void;
  onOpenPaymentWorkspace?: (payment: Payment) => void;
  onOpenWorkspace?: () => void;
  recordActions?: ReactNode;
}>;

const tripStatusKeys: Record<Trip['status'], import('../../app/i18n').TranslationKey> = { active: 'tripActive', completed: 'tripCompleted', cancelled: 'tripCancelled' };

function tripNote(notes: readonly RichNote[], tripId: string): RichNote | undefined {
  return notes.find((note) => note.ownerType === 'trip' && note.ownerId === tripId);
}

export function TripDetail({ client: initialClient, trip: initialTrip, services, serviceAdditionalItems = [], notes, events = [], onClose, onSave, paymentComponents = [], payments = [], tasks = [], onRecordPayment = async () => undefined, onCorrectPayment = async () => undefined, onAssignInitialPayment = async () => undefined, providers = [], onAddProvider = async () => ({ serviceProvider: { id: '' }, suggestedTasks: [] }), onCreateSuggestedTasks = async () => undefined, onReactivateProvider = async () => undefined, onEnableCommission, onRecordComponentCancellation, onCancelTrip, renderServiceActions, renderPaymentActions, onOpenServiceWorkspace, onOpenPaymentWorkspace, onOpenWorkspace, recordActions }: TripDetailProps) {
  const locale = useLocale();
  const initialTripNote = tripNote(notes, initialTrip.id);
  const [client, setClient] = useState(initialClient);
  const [trip, setTrip] = useState(initialTrip);
  const [draftServices, setDraftServices] = useState<readonly Service[]>(services);
  const [draftAdditionalItems, setDraftAdditionalItems] = useState<readonly ServiceAdditionalItem[]>(serviceAdditionalItems);
  const [noteContent, setNoteContent] = useState(initialTripNote?.content ?? '');
  const [noteUpdatedAt, setNoteUpdatedAt] = useState(initialTripNote?.updatedAt ?? '');
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [memberBirthDate, setMemberBirthDate] = useState('');
  const [memberRelationship, setMemberRelationship] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [serviceStartOn, setServiceStartOn] = useState('');
  const [serviceEndOn, setServiceEndOn] = useState('');
  const [editingServiceId, setEditingServiceId] = useState<string>();
  const [additionalServiceId, setAdditionalServiceId] = useState('');
  const [additionalLabel, setAdditionalLabel] = useState('');
  const [additionalAmount, setAdditionalAmount] = useState('');
  const [additionalCurrency, setAdditionalCurrency] = useState<Currency | ''>('');
  const [editingAdditionalItemId, setEditingAdditionalItemId] = useState<string>();
  const [referenceRateChangeConfirmed, setReferenceRateChangeConfirmed] = useState(false);
  const [referenceRateChangeReason, setReferenceRateChangeReason] = useState('');
  const [showTripCancellationDialog, setShowTripCancellationDialog] = useState(false);
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialTripNote?.content ?? '',
    editorProps: { attributes: { 'aria-label': t('workNote', locale), class: 'rich-note-editor' } },
    onUpdate: ({ editor: updatedEditor }) => {
      setNoteContent(updatedEditor.getHTML());
      setNoteUpdatedAt(new Date().toISOString());
    },
  });

  const workspaceDraft = useMemo<TripWorkspaceDraft>(() => ({
    client,
    trip,
    services: draftServices,
    serviceAdditionalItems: draftAdditionalItems,
    notes: noteContent.trim() === '' ? notes.filter((note) => note.id !== initialTripNote?.id) : [
      ...notes.filter((note) => note.id !== initialTripNote?.id),
      { id: initialTripNote?.id ?? `trip-note-${trip.id}`, ownerType: 'trip', ownerId: trip.id, content: noteContent, updatedAt: noteUpdatedAt || new Date().toISOString() },
    ],
  }), [client, draftAdditionalItems, draftServices, initialTripNote?.id, noteContent, noteUpdatedAt, notes, trip]);
  const referenceRateChangedFromInitial = initialTrip.referenceRateBaseCurrency !== trip.referenceRateBaseCurrency
    || initialTrip.referenceRateQuoteCurrency !== trip.referenceRateQuoteCurrency
    || initialTrip.referenceExchangeRate !== trip.referenceExchangeRate;
  const requiresReferenceRateConfirmation = initialTrip.referenceExchangeRate !== undefined && referenceRateChangedFromInitial;
  const draft = useMemo<TripWorkspaceDraft>(() => ({
    ...workspaceDraft,
    ...(requiresReferenceRateConfirmation ? {
      referenceRateChangeConfirmed,
      referenceRateChangeReason,
    } : {}),
  }), [referenceRateChangeConfirmed, referenceRateChangeReason, requiresReferenceRateConfirmation, workspaceDraft]);
  const initialSnapshot = JSON.stringify({ client: initialClient, trip: initialTrip, services, serviceAdditionalItems, notes });
  const [savedSnapshot, setSavedSnapshot] = useState(initialSnapshot);
  const isDirty = JSON.stringify(workspaceDraft) !== savedSnapshot;
  const tripStartOn = trip.overrideStartOn ?? trip.effectiveStartOn ?? trip.computedStartOn ?? draftServices.flatMap((service) => service.startOn ? [service.startOn] : []).sort()[0];
  const serviceTotals = useMemo(() => {
    const totals = new Map<Currency, number>();
    for (const component of paymentComponents) {
      if (!component.archived && component.saleAmount !== undefined) totals.set(component.currency, (totals.get(component.currency) ?? 0) + component.saleAmount);
    }
    for (const item of draftAdditionalItems) totals.set(item.currency, (totals.get(item.currency) ?? 0) + item.amount);
    return [...totals.entries()].sort(([left], [right]) => left.localeCompare(right));
  }, [draftAdditionalItems, paymentComponents]);
  const timeline = useMemo(() => [...events].sort((left, right) => right.occurredAt.localeCompare(left.occurredAt)), [events]);

  async function save(): Promise<void> {
    setIsSaving(true);
    try {
      await onSave(draft);
      setSavedSnapshot(JSON.stringify(workspaceDraft));
      setReferenceRateChangeConfirmed(false);
      setReferenceRateChangeReason('');
      setShowUnsavedDialog(false);
    } finally {
      setIsSaving(false);
    }
  }

  function requestClose(): void {
    if (isDirty) setShowUnsavedDialog(true);
    else onClose();
  }

  function addFamilyMember(): void {
    const name = memberName.trim();
    if (name === '') return;
    const member: FamilyMember = { id: `member-${crypto.randomUUID()}`, name, ...(memberBirthDate ? { birthDate: memberBirthDate } : {}), ...(memberRelationship.trim() ? { relationship: memberRelationship.trim() } : {}), status: 'active' };
    setClient({ ...client, members: [...(client.members ?? []), member] });
    setTrip({ ...trip, primaryMemberId: trip.primaryMemberId ?? member.id, travelerMemberIds: [...(trip.travelerMemberIds ?? []), member.id] });
    setMemberName('');
    setMemberBirthDate('');
    setMemberRelationship('');
  }

  function toggleTraveler(memberId: string, selected: boolean): void {
    const travelerMemberIds = selected ? [...new Set([...(trip.travelerMemberIds ?? []), memberId])] : (trip.travelerMemberIds ?? []).filter((id) => id !== memberId);
    setTrip({ ...trip, travelerMemberIds, ...(trip.primaryMemberId === memberId && !selected ? { primaryMemberId: undefined } : {}) });
  }

  function setMemberStatus(memberId: string, status: FamilyMember['status']): void {
    setClient({ ...client, members: (client.members ?? []).map((member) => member.id === memberId ? { ...member, status } : member) });
  }

  function saveService(): void {
    const name = serviceName.trim();
    if (name === '') return;
    setDraftServices((current) => editingServiceId ? current.map((service) => service.id === editingServiceId ? {
      ...service,
      name,
      ...(serviceStartOn ? { startOn: serviceStartOn } : { startOn: undefined }),
      ...(serviceEndOn ? { endOn: serviceEndOn } : { endOn: undefined }),
    } : service) : [...current, {
      id: `service-${crypto.randomUUID()}`,
      tripId: trip.id,
      name,
      status: 'active',
      ...(serviceStartOn ? { startOn: serviceStartOn } : {}),
      ...(serviceEndOn ? { endOn: serviceEndOn } : {}),
      createdAt: new Date().toISOString(),
    }]);
    setServiceName('');
    setServiceStartOn('');
    setServiceEndOn('');
    setEditingServiceId(undefined);
  }

  function editService(service: Service): void {
    setEditingServiceId(service.id);
    setServiceName(service.name);
    setServiceStartOn(service.startOn ?? '');
    setServiceEndOn(service.endOn ?? '');
  }

  function addAdditionalItem(): void {
    const amount = Number(additionalAmount);
    if (!additionalServiceId || !additionalLabel.trim() || !additionalCurrency || !Number.isFinite(amount) || amount < 0) return;
    setDraftAdditionalItems((current) => editingAdditionalItemId ? current.map((item) => item.id === editingAdditionalItemId ? { ...item, serviceId: additionalServiceId, label: additionalLabel.trim(), amount, currency: additionalCurrency } : item) : [...current, { id: `additional-item-${crypto.randomUUID()}`, serviceId: additionalServiceId, label: additionalLabel.trim(), amount, currency: additionalCurrency, createdAt: new Date().toISOString() }]);
    setAdditionalLabel('');
    setAdditionalAmount('');
    setAdditionalCurrency('');
    setAdditionalServiceId('');
    setEditingAdditionalItemId(undefined);
  }

  function editAdditionalItem(item: ServiceAdditionalItem): void {
    setEditingAdditionalItemId(item.id);
    setAdditionalServiceId(item.serviceId);
    setAdditionalLabel(item.label);
    setAdditionalAmount(String(item.amount));
    setAdditionalCurrency(item.currency);
  }

  return <aside aria-label={t('tripWorkspace', locale)} className="trip-detail">
    <div className="detail-header">
      <div><p className="detail-status">{t(tripStatusKeys[trip.status], locale)}</p><h2>{client.name || t('unnamedClient', locale)}</h2></div>
      <div className="detail-header-actions">{!isDirty && recordActions}{onOpenWorkspace && <button className="secondary-button" onClick={onOpenWorkspace} type="button">{t('openFullWorkspace', locale)}</button>}<button aria-label={t('closeWorkspace', locale)} className="icon-button" onClick={requestClose} type="button"><X aria-hidden="true" /></button></div>
    </div>
    <p className="muted-copy">{t('singleSaveDescription', locale)}</p>
    <section className="detail-section">
      <h3>{t('clientFamily', locale)}</h3>
      <label className="field-label">{t('usefulFamilyNote', locale)}<textarea aria-label={t('usefulFamilyNote', locale)} onChange={(event) => setClient({ ...client, familyNote: event.target.value })} value={client.familyNote ?? ''} /></label>
      <h4>{t('membersTravelers', locale)}</h4>
      <div className="member-list">{(client.members ?? []).map((member) => <div className="member-row" key={member.id}>
        <strong>{member.name}</strong>{member.relationship && <small>{member.relationship}</small>}{member.status === 'archived' && <span className="archived-label">{t('archivedRecord', locale)}</span>}{member.birthDate && <small>{t('currentAge', locale, ageAtDate(member.birthDate, new Date().toISOString().slice(0, 10)))}</small>}{member.birthDate && tripStartOn && <small>{t('ageAtStart', locale, ageAtDate(member.birthDate, tripStartOn))}</small>}
        {member.status === 'active' && <><label><input aria-label={t('primaryContact', locale, { name: member.name })} checked={trip.primaryMemberId === member.id} name="primary-member" onChange={() => setTrip({ ...trip, primaryMemberId: member.id, travelerMemberIds: [...new Set([...(trip.travelerMemberIds ?? []), member.id])] })} type="radio" />{t('primaryContact', locale)}</label>
        <label><input aria-label={t('travels', locale, { name: member.name })} checked={trip.travelerMemberIds?.includes(member.id) ?? false} onChange={(event) => toggleTraveler(member.id, event.target.checked)} type="checkbox" />{t('travels', locale)}</label><button className="text-button" onClick={() => setMemberStatus(member.id, 'archived')} type="button">{t('archiveMember', locale, { name: member.name })}</button></>}
        {member.status === 'archived' && <button className="text-button" onClick={() => setMemberStatus(member.id, 'active')} type="button">{t('reactivateMember', locale, { name: member.name })}</button>}
      </div>)}</div>
      <div className="form-grid"><label>{t('memberName', locale)}<input aria-label={t('memberName', locale)} onChange={(event) => setMemberName(event.target.value)} value={memberName} /></label><label>{t('memberRelationship', locale)}<input aria-label={t('memberRelationship', locale)} onChange={(event) => setMemberRelationship(event.target.value)} value={memberRelationship} /></label><label>{t('memberBirthDate', locale)}<OperationalDateField aria-label={t('memberBirthDate', locale)} onChange={setMemberBirthDate} value={memberBirthDate} /></label></div>
      <button className="secondary-button" onClick={addFamilyMember} type="button">{t('addMember', locale)}</button>
    </section>
    <section className="detail-section">
      <h3>{t('servicesBookings', locale)}</h3>
      <ul className="service-list">{draftServices.map((service) => <li key={service.id}><strong>{service.name}</strong><span>{service.startOn && service.endOn ? `${formatOperationalDate(service.startOn)} — ${formatOperationalDate(service.endOn)}` : t('clientDatesToDefine', locale)}</span>{service.archivedAt && <span className="archived-label">{t('archivedRecord', locale)}</span>}{!isDirty && onOpenServiceWorkspace && <button className="text-button" onClick={() => onOpenServiceWorkspace(service)} type="button">{t('openFullWorkspaceFor', locale, { record: service.name })}</button>}<button className="text-button" disabled={Boolean(service.archivedAt)} onClick={() => editService(service)} type="button">{t('editService', locale, { name: service.name })}</button>{!isDirty && renderServiceActions?.(service)}</li>)}</ul>
      <div className="form-grid"><label>{t('serviceName', locale)}<input aria-label={t('serviceName', locale)} onChange={(event) => setServiceName(event.target.value)} value={serviceName} /></label><label>{t('serviceStart', locale)}<OperationalDateField aria-label={t('serviceStart', locale)} onChange={setServiceStartOn} value={serviceStartOn} /></label><label>{t('serviceEnd', locale)}<OperationalDateField aria-label={t('serviceEnd', locale)} onChange={setServiceEndOn} value={serviceEndOn} /></label></div>
      <button className="secondary-button" onClick={saveService} type="button">{editingServiceId ? t('saveService', locale) : t('addService', locale)}</button>
      <ServiceProviderAssignment onAssign={onAddProvider} onCreateSuggestedTasks={onCreateSuggestedTasks} onReactivateProvider={onReactivateProvider} providers={providers} services={services} />
      <h4>{t('additionalConcepts', locale)}</h4>
      {draftAdditionalItems.length === 0 ? <p className="muted-copy">{t('noAdditionalConcepts', locale)}</p> : <ul className="service-list">{draftAdditionalItems.map((item) => <li key={item.id}><strong>{item.label}</strong><span>{formatOperationalNumber(item.amount)} {item.currency}</span><small>{draftServices.find((service) => service.id === item.serviceId)?.name ?? t('undefinedValue', locale)}</small><button className="text-button" onClick={() => editAdditionalItem(item)} type="button">{t('editAdditionalConcept', locale, { label: item.label })}</button></li>)}</ul>}
      <div className="form-grid"><label>{t('additionalConceptService', locale)}<select aria-label={t('additionalConceptService', locale)} onChange={(event) => setAdditionalServiceId(event.target.value)} value={additionalServiceId}><option value="">{t('select', locale)}</option>{draftServices.filter((service) => !service.archivedAt).map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select></label><label>{t('additionalConceptLabel', locale)}<input aria-label={t('additionalConceptLabel', locale)} onChange={(event) => setAdditionalLabel(event.target.value)} value={additionalLabel} /></label><label>{t('additionalConceptAmount', locale)}<input aria-label={t('additionalConceptAmount', locale)} inputMode="decimal" min="0" onChange={(event) => setAdditionalAmount(event.target.value)} step="0.01" type="number" value={additionalAmount} /></label><label>{t('currency', locale)}<select aria-label={`${t('currency', locale)} ${t('additionalConcepts', locale)}`} onChange={(event) => setAdditionalCurrency(event.target.value as Currency)} value={additionalCurrency}><option value="">{t('select', locale)}</option><option value="USD">USD</option><option value="MXN">MXN</option></select></label></div>
      <button className="secondary-button" onClick={addAdditionalItem} type="button">{editingAdditionalItemId ? t('saveAdditionalConcept', locale) : t('addAdditionalConcept', locale)}</button>
      <h4>{t('serviceTotalsByCurrency', locale)}</h4>
      {serviceTotals.length === 0 ? <p className="muted-copy">{t('undefinedValue', locale)}</p> : <ul className="service-list">{serviceTotals.map(([currency, amount]) => <li key={currency}><strong>{currency}</strong><span>{formatOperationalNumber(amount)}</span></li>)}</ul>}
    </section>
    <section className="detail-section">
      <h3>{t('referenceCurrencyRate', locale)}</h3>
      <div className="form-grid">
        <label>{t('referenceBaseCurrency', locale)}<select aria-label={t('referenceBaseCurrency', locale)} onChange={(event) => setTrip({ ...trip, referenceCurrency: event.target.value as Currency || undefined, referenceRateBaseCurrency: event.target.value as Currency || undefined })} value={trip.referenceRateBaseCurrency ?? trip.referenceCurrency ?? ''}><option value="">{t('select', locale)}</option><option value="USD">USD</option><option value="MXN">MXN</option></select></label>
        <label>{t('referenceQuoteCurrency', locale)}<select aria-label={t('referenceQuoteCurrency', locale)} onChange={(event) => setTrip({ ...trip, referenceRateQuoteCurrency: event.target.value as Currency || undefined })} value={trip.referenceRateQuoteCurrency ?? ''}><option value="">{t('select', locale)}</option><option value="USD">USD</option><option value="MXN">MXN</option></select></label>
        <label>{t('referenceExchangeRate', locale)}<input aria-label={t('referenceExchangeRate', locale)} inputMode="decimal" min="0" onChange={(event) => { const value = event.target.value; setTrip({ ...trip, referenceExchangeRate: value === '' ? undefined : Number(value) }); }} step="0.0001" type="number" value={trip.referenceExchangeRate ?? ''} /></label>
      </div>
      {trip.referenceRateBaseCurrency && trip.referenceRateQuoteCurrency && <p className="muted-copy">{t('referenceRateDescription', locale, { base: trip.referenceRateBaseCurrency, quote: trip.referenceRateQuoteCurrency })}</p>}
      {requiresReferenceRateConfirmation && <div className="rate-change-confirmation"><p className="muted-copy">{t('referenceRateChangeConfirmationDescription', locale)}</p><label><input aria-label={t('referenceRateChangeConfirmation', locale)} checked={referenceRateChangeConfirmed} onChange={(event) => setReferenceRateChangeConfirmed(event.target.checked)} type="checkbox" /> {t('referenceRateChangeConfirmation', locale)}</label><label>{t('referenceRateChangeReason', locale)}<input aria-label={t('referenceRateChangeReason', locale)} onChange={(event) => setReferenceRateChangeReason(event.target.value)} value={referenceRateChangeReason} /></label></div>}
    </section>
    <section className="detail-section">
      <h3>{t('effectivePeriod', locale)}</h3>
      <div className="form-grid">
        <label>{t('manualTripStart', locale)}<OperationalDateField aria-label={t('manualTripStart', locale)} onChange={(date) => setTrip({ ...trip, overrideStartOn: date || undefined })} value={trip.overrideStartOn} /></label>
        <label>{t('manualTripEnd', locale)}<OperationalDateField aria-label={t('manualTripEnd', locale)} onChange={(date) => setTrip({ ...trip, overrideEndOn: date || undefined })} value={trip.overrideEndOn} /></label>
      </div>
      <p className="muted-copy">{t('servicesPeriodDescription', locale)}</p>
    </section>
    <section className="detail-section">
      <h3>{t('workNote', locale)}</h3>
      <EditorContent editor={editor} />
    </section>
    <section className="detail-section">
      <h3>{t('tripTasks', locale)}</h3>
      {tasks.length === 0 ? <p className="muted-copy">{t('noTripTasks', locale)}</p> : <ul className="task-list">{tasks.map((task) => <li key={task.id}><strong>{task.title}</strong><small>{task.dueOn ? formatOperationalDate(task.dueOn) : t('undated', locale)}{task.dueTime ? ` · ${task.dueTime}` : ''}</small></li>)}</ul>}
    </section>
    <section className="detail-section">
      <h3>{t('aggregateHistory', locale)}</h3>
      {timeline.length === 0 ? <p className="muted-copy">{t('noLinkedEvents', locale)}</p> : <ol className="timeline">{timeline.map((event) => <li key={event.id}><span aria-hidden="true">●</span><div><strong>{event.type.replaceAll('_', ' ')}</strong><small>{formatOperationalDateTime(event.occurredAt)}</small></div></li>)}</ol>}
    </section>
    <section className="detail-section">
      <h3>{t('customerPaymentsBalances', locale)}</h3>
      <CustomerPaymentPanel components={paymentComponents} onAssignInitialPayment={onAssignInitialPayment} onCorrectPayment={onCorrectPayment} onEnableCommission={onEnableCommission} onOpenPaymentWorkspace={isDirty ? undefined : onOpenPaymentWorkspace} onRecordCancellation={onRecordComponentCancellation} onRecordPayment={onRecordPayment} payments={payments} renderPaymentActions={isDirty ? undefined : renderPaymentActions} />
    </section>
    <div className="form-actions">
      <button className="secondary-button" onClick={requestClose} type="button">{t('close', locale)}</button>
      {trip.status === 'active' && onCancelTrip && <button className="danger-button" disabled={isDirty} onClick={() => setShowTripCancellationDialog(true)} type="button">{t('cancelTrip', locale)}</button>}
      <button className="primary-button" disabled={!isDirty || isSaving || (requiresReferenceRateConfirmation && !referenceRateChangeConfirmed)} onClick={() => { void save(); }} type="button"><Save aria-hidden="true" size={17} />{isSaving ? t('saving', locale) : t('saveChanges', locale)}</button>
    </div>
    {showTripCancellationDialog && <div aria-label={t('cancelTripConfirmation', locale)} className="confirmation-dialog" role="dialog"><p>{t('cancelTripPreservation', locale)}</p><div className="form-actions"><button className="secondary-button" onClick={() => setShowTripCancellationDialog(false)} type="button">{t('cancel', locale)}</button><button className="danger-button" onClick={() => { void onCancelTrip?.(trip.id); setShowTripCancellationDialog(false); }} type="button">{t('cancelTripConfirmation', locale)}</button></div></div>}
    {showUnsavedDialog && <UnsavedChangesDialog onCancel={() => setShowUnsavedDialog(false)} onDiscard={onClose} onSave={() => { void save(); }} />}
  </aside>;
}
