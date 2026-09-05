import { useState, type FormEvent } from 'react';
import { t, useLocale } from '../../app/i18n';
import { ageAtDate } from '../../domain/dates';
import type { Client, FamilyMember } from '../../domain/types';
import { OperationalDateField } from '../../design/components/OperationalDateField';

export type ClientFormValue = Readonly<{
  name: string;
  familyNote: string;
  residenceCountry?: string;
  address?: string;
  phone?: string;
  email?: string;
  members: readonly FamilyMember[];
}>;

type ClientFormProps = Readonly<{
  client?: Client;
  onCancel: () => void;
  onSave: (value: ClientFormValue) => void;
}>;

export function ClientForm({ client, onCancel, onSave }: ClientFormProps) {
  const locale = useLocale();
  const label = (key: import('../../app/i18n').TranslationKey, variables?: Record<string, string | number>) => t(key, locale, variables);
  const [value, setValue] = useState<Omit<ClientFormValue, 'members'>>(() => ({
    name: client?.name ?? '', familyNote: client?.familyNote ?? '', residenceCountry: client?.residenceCountry, address: client?.address, phone: client?.phone, email: client?.email,
  }));
  const [members, setMembers] = useState<readonly FamilyMember[]>(client?.members ?? []);
  const [memberName, setMemberName] = useState('');
  const [memberBirthDate, setMemberBirthDate] = useState('');
  const [memberRelationship, setMemberRelationship] = useState('');
  const [memberError, setMemberError] = useState<string>();

  function updateMember(memberId: string, changes: Partial<FamilyMember>): void {
    setMembers((current) => current.map((member) => member.id === memberId ? { ...member, ...changes } : member));
  }

  function addMember(): void {
    const name = memberName.trim();
    if (!name || !memberBirthDate) {
      setMemberError(label('memberNameAndBirthDateRequired'));
      return;
    }
    setMembers((current) => [...current, {
      id: `member-${crypto.randomUUID()}`,
      name,
      birthDate: memberBirthDate,
      ...(memberRelationship.trim() ? { relationship: memberRelationship.trim() } : {}),
      status: 'active',
    }]);
    setMemberName('');
    setMemberBirthDate('');
    setMemberRelationship('');
    setMemberError(undefined);
  }

  function submit(event: FormEvent): void {
    event.preventDefault();
    onSave({
      name: value.name,
      familyNote: value.familyNote,
      members,
      ...(value.residenceCountry ? { residenceCountry: value.residenceCountry } : {}),
      ...(value.address ? { address: value.address } : {}),
      ...(value.phone ? { phone: value.phone } : {}),
      ...(value.email ? { email: value.email } : {}),
    });
  }

  return <form className="lead-form" noValidate onSubmit={submit}>
    <div className="form-grid">
      <label>{label('clientOrFamilyName')}<input aria-label={label('clientOrFamilyName')} value={value.name} onChange={(event) => setValue((current) => ({ ...current, name: event.target.value }))} /></label>
      <label>{label('phone')}<input aria-label={label('phone')} value={value.phone ?? ''} onChange={(event) => setValue((current) => ({ ...current, phone: event.target.value }))} /></label>
      <label>{label('email')}<input aria-label={label('email')} type="email" value={value.email ?? ''} onChange={(event) => setValue((current) => ({ ...current, email: event.target.value }))} /></label>
      <label>{label('residenceCountry')}<input aria-label={label('residenceCountry')} value={value.residenceCountry ?? ''} onChange={(event) => setValue((current) => ({ ...current, residenceCountry: event.target.value }))} /></label>
      <label>{label('address')}<input aria-label={label('address')} value={value.address ?? ''} onChange={(event) => setValue((current) => ({ ...current, address: event.target.value }))} /></label>
      <label>{label('usefulFamilyNote')}<textarea aria-label={label('usefulFamilyNote')} value={value.familyNote} onChange={(event) => setValue((current) => ({ ...current, familyNote: event.target.value }))} /></label>
    </div>
    <section className="detail-section" aria-label={label('members')}>
      <h3>{label('members')}</h3>
      {members.length === 0 ? <p className="muted-copy">{label('noMembers')}</p> : <div className="member-list">{members.map((member) => <div className="member-row" key={member.id}>
        <label>{label('memberName')}<input aria-label={`${label('memberName')}: ${member.name}`} onChange={(event) => updateMember(member.id, { name: event.target.value })} value={member.name} /></label>
        <label>{label('memberRelationship')}<input aria-label={`${label('memberRelationship')}: ${member.name}`} onChange={(event) => updateMember(member.id, { relationship: event.target.value || undefined })} value={member.relationship ?? ''} /></label>
        <label>{label('memberBirthDate')}<OperationalDateField aria-label={`${label('memberBirthDate')}: ${member.name}`} onChange={(birthDate) => updateMember(member.id, { birthDate: birthDate || undefined })} value={member.birthDate} /></label>
        {member.birthDate && <small>{label('currentAge', ageAtDate(member.birthDate, new Date().toISOString().slice(0, 10)))}</small>}
        <button className="text-button" onClick={() => updateMember(member.id, { status: member.status === 'active' ? 'archived' : 'active' })} type="button">{member.status === 'active' ? label('archiveMember', { name: member.name }) : label('reactivateMember', { name: member.name })}</button>
      </div>)}</div>}
      <div className="form-grid">
        <label>{label('memberName')}<input aria-label={label('memberName')} onChange={(event) => setMemberName(event.target.value)} value={memberName} /></label>
        <label>{label('memberRelationship')}<input aria-label={label('memberRelationship')} onChange={(event) => setMemberRelationship(event.target.value)} value={memberRelationship} /></label>
        <label>{label('memberBirthDate')}<OperationalDateField aria-label={label('memberBirthDate')} onChange={setMemberBirthDate} value={memberBirthDate} /></label>
      </div>
      {memberError && <p className="form-error" role="alert">{memberError}</p>}
      <button className="secondary-button" onClick={addMember} type="button">{label('addMember')}</button>
    </section>
    <div className="form-actions"><button className="secondary-button" onClick={onCancel} type="button">{label('cancel')}</button><button className="primary-button" type="submit">{label('saveClient')}</button></div>
  </form>;
}
