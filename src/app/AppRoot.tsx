import { useEffect, useState } from 'react';
import { registerPwa } from '../pwa';
import { App } from './App';

export function AppRoot() {
  const [applyUpdate, setApplyUpdate] = useState<(() => Promise<void>)>();
  useEffect(() => { registerPwa(setApplyUpdate); }, []);
  return <App applyUpdate={applyUpdate} onDeferUpdate={() => setApplyUpdate(undefined)} requiresBackupForUpdate />;
}
