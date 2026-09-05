import { createActivityEvent } from '../../domain/events';
import type { Provider } from '../../domain/types';
import type { WorkspaceRepository } from '../ports';

type ReactivateProviderCommand = Readonly<{ providerId: string; occurredAt: string; recordedAt: string }>;

export async function reactivateProvider(repository: WorkspaceRepository, command: ReactivateProviderCommand): Promise<Provider> {
  return repository.transact(async (tx) => {
    const provider = await tx.getProvider(command.providerId);
    if (!provider) throw new Error('provider not found');
    if (provider.status === 'active') return provider;
    const reactivated = { ...provider, status: 'active' as const };
    await tx.putProvider(reactivated);
    await tx.putEvents([createActivityEvent({ aggregateType: 'provider', aggregateId: provider.id, type: 'provider_reactivated', occurredAt: command.occurredAt, recordedAt: command.recordedAt, payload: {} })]);
    return reactivated;
  });
}
