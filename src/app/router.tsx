import type { ComponentType } from 'react';

export type RouteKey = 'dashboard' | 'leads' | 'clients' | 'trips' | 'calendar' | 'tasks' | 'commissions' | 'providers' | 'data' | 'settings';

export const routeKeys: readonly RouteKey[] = ['dashboard', 'leads', 'clients', 'trips', 'calendar', 'tasks', 'commissions', 'providers', 'data', 'settings'];
export type RouteView = ComponentType;

export function routeFromHash(hash = globalThis.location?.hash ?? ''): RouteKey {
  const candidate = hash.replace(/^#\/?/, '').split(/[/?]/, 1)[0] as RouteKey;
  return routeKeys.includes(candidate) ? candidate : 'dashboard';
}

export function routeTargetFromHash(hash = globalThis.location?.hash ?? ''): string | undefined {
  const query = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : '';
  const target = new URLSearchParams(query).get('record');
  return target || undefined;
}

export function routeHash(route: RouteKey, recordId?: string): string {
  return `#/${route}${recordId ? `?record=${encodeURIComponent(recordId)}` : ''}`;
}
