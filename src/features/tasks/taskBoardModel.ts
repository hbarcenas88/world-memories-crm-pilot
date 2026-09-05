import type { ServiceProvider, Task } from '../../domain/types';

export type TaskGroup = 'overdue' | 'today' | 'upcoming' | 'undated';

export type TaskFilters = Readonly<{
  status: 'all' | Task['status'];
  tripId?: string;
  providerId?: string;
  from?: string;
  to?: string;
}>;

export function filterTasks({
  tasks,
  serviceProviders,
  filters,
}: Readonly<{
  tasks: readonly Task[];
  serviceProviders: readonly ServiceProvider[];
  filters: TaskFilters;
}>): readonly Task[] {
  const providerByComponentId = new Map(serviceProviders.map((component) => [component.id, component.providerId]));
  return tasks.filter((task) => {
    if (filters.status !== 'all' && task.status !== filters.status) return false;
    if (filters.tripId && task.tripId !== filters.tripId) return false;
    if (filters.providerId && providerByComponentId.get(task.serviceProviderId ?? '') !== filters.providerId) return false;
    if (filters.from && (!task.dueOn || task.dueOn < filters.from)) return false;
    if (filters.to && (!task.dueOn || task.dueOn > filters.to)) return false;
    return true;
  });
}

export function groupTasks(tasks: readonly Task[], today: string): Readonly<Record<TaskGroup, readonly Task[]>> {
  const groups: Record<TaskGroup, Task[]> = { overdue: [], today: [], upcoming: [], undated: [] };
  for (const task of tasks) {
    if (task.status !== 'open') continue;
    if (!task.dueOn) groups.undated.push(task);
    else if (task.dueOn < today) groups.overdue.push(task);
    else if (task.dueOn === today) groups.today.push(task);
    else groups.upcoming.push(task);
  }
  for (const group of Object.values(groups)) group.sort((left, right) => (left.dueOn ?? '').localeCompare(right.dueOn ?? '') || left.createdAt.localeCompare(right.createdAt));
  return groups;
}
