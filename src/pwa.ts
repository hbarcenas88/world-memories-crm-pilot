import { registerSW } from 'virtual:pwa-register';

export function registerPwa(onUpdateAvailable: (apply: () => Promise<void>) => void): void {
  if (!('serviceWorker' in navigator)) return;
  const update = registerSW({ immediate: true, onNeedRefresh() { onUpdateAvailable(async () => { update(true); }); } });
}
