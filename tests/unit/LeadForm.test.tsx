import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocaleProvider } from '../../src/app/i18n';
import { LeadForm } from '../../src/features/leads/LeadForm';

afterEach(cleanup);

describe('LeadForm', () => {
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

  it('preloads an existing Lead and submits its edited values', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<LeadForm initialValue={{ name: 'Ana Rivera', acquisitionSource: 'Referido', referredBy: 'Luis', residenceCountry: 'Panamá', phone: '6000-0000', email: 'ana@example.com', destination: 'Orlando', travelType: 'Paquete Disney', requestedDateStatus: 'dates_known', budgetAmount: 2800, budgetCurrency: 'USD' }} onSave={onSave} />);

    expect(screen.getByLabelText('Nombre o referencia').getAttribute('value')).toBe('Ana Rivera');
    expect(screen.getByLabelText('Presupuesto').getAttribute('value')).toBe('2800');
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
});
