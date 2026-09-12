import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocaleProvider } from '../../src/app/i18n';
import { LeadForm } from '../../src/features/leads/LeadForm';

afterEach(cleanup);

describe('LeadForm', () => {
  it('asks before cancelling a dirty lead draft', async () => {
    const user = userEvent.setup();
    render(<LeadForm onCancel={vi.fn()} onSave={vi.fn()} />);

    await user.type(screen.getByLabelText('Nombre o referencia'), 'Ana Rivera');
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.getByRole('dialog', { name: 'Cambios sin guardar' })).toBeTruthy();
  });

  it('saves an initial lead with optional fields blank', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<LeadForm onSave={onSave} />);

    await user.click(screen.getByRole('button', { name: 'Guardar lead' }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: '', requestedDateStatus: 'dates_to_define' }));
  });

  it('shows “Referido por” only when the acquisition source is Referido', async () => {
    const user = userEvent.setup();
    render(<LeadForm onSave={vi.fn()} />);

    expect(screen.queryByLabelText('Referido por')).toBeNull();
    await user.selectOptions(screen.getByLabelText('Origen de adquisición'), 'Referido');
    expect(screen.getByLabelText('Referido por')).toBeTruthy();
  });

  it('requires currency when a budget amount is entered', async () => {
    const user = userEvent.setup();
    render(<LeadForm onSave={vi.fn()} />);

    await user.type(screen.getByLabelText('Presupuesto'), '500');
    await user.click(screen.getByRole('button', { name: 'Guardar lead' }));

    expect(screen.getByText('Selecciona una moneda antes de guardar el presupuesto.')).toBeTruthy();
  });

  it('keeps an invalid email in the draft and prevents saving it', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<LeadForm onSave={onSave} />);

    await user.type(screen.getByLabelText('Correo'), 'ana@');
    await user.click(screen.getByRole('button', { name: 'Guardar lead' }));

    expect(screen.getByRole('alert').textContent).toBe('Indica un correo válido o déjalo vacío.');
    expect((screen.getByLabelText('Correo') as HTMLInputElement).value).toBe('ana@');
    expect(onSave).not.toHaveBeenCalled();
  });

  it('stores an explicitly selected ISO country and independent international phone prefix', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<LeadForm onSave={onSave} />);

    const residence = screen.getByRole('combobox', { name: 'País de residencia' });
    await user.click(residence);
    await user.type(residence, 'Mexico');
    await user.keyboard('{ArrowDown}{Enter}');
    const phoneCode = screen.getByRole('combobox', { name: 'Código internacional' });
    await user.click(phoneCode);
    await user.type(phoneCode, 'Panama');
    await user.keyboard('{ArrowDown}{Enter}');
    await user.type(screen.getByRole('textbox', { name: 'Teléfono' }), '60000000');
    await user.click(screen.getByRole('button', { name: 'Guardar lead' }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ residenceCountry: 'MX', phone: '+50760000000' }));
  });

  it('preloads an existing Lead and submits its edited values', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<LeadForm initialValue={{ name: 'Ana Rivera', acquisitionSource: 'Referido', referredBy: 'Luis', residenceCountry: 'Panamá', phone: '6000-0000', email: 'ana@example.com', destination: 'Orlando', travelType: 'Paquete Disney', requestedDateStatus: 'dates_known', budgetAmount: 2800, budgetCurrency: 'USD' }} onSave={onSave} />);

    expect(screen.getByLabelText('Nombre o referencia').getAttribute('value')).toBe('Ana Rivera');
    expect(screen.getByLabelText('Presupuesto').getAttribute('value')).toBe('2,800');
    await user.clear(screen.getByLabelText('Destino inicial'));
    await user.type(screen.getByLabelText('Destino inicial'), 'Tokio');
    await user.click(screen.getByRole('button', { name: 'Guardar lead' }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'Ana Rivera', referredBy: 'Luis', destination: 'Tokio', budgetAmount: 2800, budgetCurrency: 'USD' }));
  });

  it('translates static fields to English without changing selected values', () => {
    render(<LocaleProvider locale="en"><LeadForm initialValue={{ name: 'Ana Rivera', acquisitionSource: 'Referido', residenceCountry: '', phone: '', email: '', destination: 'Orlando', travelType: 'Paquete Disney', requestedDateStatus: 'dates_known' }} onSave={vi.fn()} /></LocaleProvider>);
    expect(screen.getByLabelText('Name or reference')).toBeTruthy();
    expect(screen.getByLabelText('Travel type')).toBeTruthy();
    expect(screen.getByDisplayValue('Referido')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save lead' })).toBeTruthy();
  });

  it('uses active global catalog labels for new selections while retaining an historical selected value', () => {
    render(<LeadForm acquisitionSources={['Feria de viajes']} initialValue={{ name: 'Ana Rivera', acquisitionSource: 'Referido', residenceCountry: '', phone: '', email: '', destination: '', travelType: 'Crucero histórico', requestedDateStatus: 'dates_to_define' }} onSave={vi.fn()} travelTypes={['Expedición']} />);
    expect(screen.getByRole('option', { name: 'Feria de viajes' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Expedición' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Referido' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Crucero histórico' })).toBeTruthy();
  });

  it('captures a separate communication channel, a known date range, passengers, and a searchable note', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<LeadForm communicationChannels={['WhatsApp'] } onSave={onSave} />);

    await user.selectOptions(screen.getByLabelText('Canal de comunicación'), 'WhatsApp');
    await user.selectOptions(screen.getByLabelText('Fechas'), 'dates_known');
    await user.type(screen.getByLabelText('Adultos'), '2');
    await user.type(screen.getByLabelText('Niños'), '1');
    await user.type(screen.getByLabelText('Nota comercial'), 'Celebración de aniversario');
    await user.click(screen.getByRole('button', { name: 'Guardar lead' }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ communicationChannel: 'WhatsApp', adults: 2, children: 1, commercialNote: 'Celebración de aniversario' }));
    expect(screen.getByLabelText('Inicio tentativo')).toBeTruthy();
    expect(screen.getByLabelText('Fin tentativo')).toBeTruthy();
  });

  it('places the known date range after travel type and date status, before budget fields', async () => {
    const user = userEvent.setup();
    render(<LeadForm onSave={vi.fn()} />);

    await user.selectOptions(screen.getByLabelText('Fechas'), 'dates_known');

    const dateRange = document.querySelector('.lead-date-range');
    expect(dateRange).toBeTruthy();
    expect((dateRange as Element).compareDocumentPosition(screen.getByLabelText('Presupuesto')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('saves a grouped budget as a number and preserves an invalid budget draft', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<LeadForm onSave={onSave} />);

    await user.type(screen.getByLabelText('Presupuesto'), '1234.56');
    await user.selectOptions(screen.getByLabelText('Moneda'), 'USD');
    await user.click(screen.getByRole('button', { name: 'Guardar lead' }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ budgetAmount: 1234.56, budgetCurrency: 'USD' }));

    await user.clear(screen.getByLabelText('Presupuesto'));
    await user.paste('1,2,3');
    await user.click(screen.getByRole('button', { name: 'Guardar lead' }));
    expect(screen.getAllByText('Indica un importe válido mayor o igual a cero.')).toHaveLength(2);
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
