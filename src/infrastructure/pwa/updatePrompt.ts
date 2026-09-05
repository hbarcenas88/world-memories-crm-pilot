export type UpdateState = 'idle' | 'available' | 'deferred';

export function createUpdateController(apply: () => Promise<void>) {
  let current: UpdateState = 'idle';
  return {
    state: (): UpdateState => current,
    available: (): void => { current = 'available'; },
    defer: (): void => { if (current === 'available') current = 'deferred'; },
    requestUpdate: async (): Promise<void> => { await apply(); current = 'idle'; },
  };
}
