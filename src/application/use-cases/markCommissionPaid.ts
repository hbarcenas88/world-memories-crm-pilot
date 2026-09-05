import { createActivityEvent } from '../../domain/events';
import { assertMoney } from '../../domain/money';
import type { Commission } from '../../domain/types';
import type { WorkspaceRepository } from '../ports';

type MarkCommissionPaidCommand = Readonly<{ commissionId: string; paidOn: string; received: unknown; confirmDifference?: boolean; note?: string; occurredAt: string; recordedAt: string }>;

export async function markCommissionPaid(repository: WorkspaceRepository, command: MarkCommissionPaidCommand): Promise<Commission> {
  const received = assertMoney(command.received);
  return repository.transact(async (tx) => {
    const commission = await tx.getCommission(command.commissionId);
    if (!commission) throw new Error('commission not found');
    if (commission.status !== 'expected') throw new Error('commission cannot be marked paid from current status');
    const differs = commission.expected.amount !== received.amount || commission.expected.currency !== received.currency;
    if (differs && !command.confirmDifference) throw new Error('commission payment difference requires confirmation');
    const paid: Commission = { ...commission, status: 'paid', paidOn: command.paidOn, received, ...(command.note ? { paymentNote: command.note } : {}) };
    await tx.putCommission(paid);
    await tx.putEvents([createActivityEvent({ aggregateType: 'commission', aggregateId: paid.id, type: 'commission_marked_paid', occurredAt: command.occurredAt, recordedAt: command.recordedAt, payload: { expected: commission.expected, received, differs } })]);
    return paid;
  });
}
