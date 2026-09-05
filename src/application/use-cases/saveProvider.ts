import { createActivityEvent } from '../../domain/events';
import type { Currency, Provider } from '../../domain/types';
import type { WorkspaceRepository } from '../ports';

type SaveProviderCommand = Readonly<{
  id?: string;
  name: string;
  status: Provider['status'];
  allowedCurrencies: readonly Currency[];
  commissionRate?: Provider['commissionRate'];
  grossCommissionMode?: Provider['grossCommissionMode'];
  defaultGrossRate?: number;
  commissionDueDays?: number;
  contactName?: string;
  phone?: string;
  email?: string;
  internalNote?: string;
  references?: readonly string[];
  serviceTypes?: readonly string[];
  occurredAt: string;
  recordedAt: string;
}>;

function uniqueNonEmpty(values: readonly string[] | undefined): readonly string[] | undefined {
  const result = [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))];
  return result.length === 0 ? undefined : result;
}

export async function saveProvider(repository: WorkspaceRepository, command: SaveProviderCommand): Promise<Provider> {
  const name = command.name.trim();
  if (name === '') throw new Error('provider name is required');
  const allowedCurrencies = [...new Set(command.allowedCurrencies)];
  if (allowedCurrencies.length === 0) throw new Error('provider requires at least one allowed currency');
  const commissionRate = command.commissionRate ?? 0.8;
  if (commissionRate !== 0.8 && commissionRate !== 1) throw new Error('provider agency share must be 80% or 100%');
  const grossCommissionMode = command.grossCommissionMode ?? 'variable_amount_per_service';
  if (grossCommissionMode === 'fixed_percentage' && (command.defaultGrossRate === undefined || !Number.isFinite(command.defaultGrossRate) || command.defaultGrossRate <= 0 || command.defaultGrossRate > 1)) throw new Error('fixed gross commission rate must be between 0 and 1');
  const commissionDueDays = command.commissionDueDays ?? 90;
  if (!Number.isInteger(commissionDueDays) || commissionDueDays < 0 || commissionDueDays > 90) throw new Error('commission due days must be an integer from 0 to 90');
  return repository.transact(async (tx) => {
    const id = command.id ?? crypto.randomUUID();
    const existing = command.id ? await tx.getProvider(command.id) : undefined;
    if (command.id && !existing) throw new Error('provider not found');
    const provider: Provider = {
      id,
      name,
      status: command.status,
      allowedCurrencies,
      commissionRate,
      grossCommissionMode,
      ...(grossCommissionMode === 'fixed_percentage' ? { defaultGrossRate: command.defaultGrossRate } : {}),
      commissionDueDays,
      ...(command.contactName?.trim() ? { contactName: command.contactName.trim() } : {}),
      ...(command.phone?.trim() ? { phone: command.phone.trim() } : {}),
      ...(command.email?.trim() ? { email: command.email.trim() } : {}),
      ...(command.internalNote?.trim() ? { internalNote: command.internalNote.trim() } : {}),
      ...(uniqueNonEmpty(command.references) ? { references: uniqueNonEmpty(command.references) } : {}),
      ...(uniqueNonEmpty(command.serviceTypes) ? { serviceTypes: uniqueNonEmpty(command.serviceTypes) } : {}),
      createdAt: existing?.createdAt ?? command.recordedAt,
    };
    await tx.putProvider(provider);
    await tx.putEvents([createActivityEvent({ aggregateType: 'provider', aggregateId: provider.id, type: existing ? 'provider_updated' : 'provider_created', occurredAt: command.occurredAt, recordedAt: command.recordedAt, payload: { status: provider.status, allowedCurrencies: provider.allowedCurrencies, commissionRate: provider.commissionRate, grossCommissionMode: provider.grossCommissionMode } })]);
    return provider;
  });
}
