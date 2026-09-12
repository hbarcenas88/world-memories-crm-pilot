import { useEffect, useState } from 'react';
import { registerPwa } from '../pwa';
import { App } from './App';

export function AppRoot() {
  const [applyUpdate, setApplyUpdate] = useState<(() => Promise<void>)>();
  const [requiresBackupForUpdate, setRequiresBackupForUpdate] = useState(true);
  const [updateVersion, setUpdateVersion] = useState(0);
  useEffect(() => {
    return registerPwa((update, metadata) => {
      setApplyUpdate(() => update);
      setRequiresBackupForUpdate(metadata?.requiresBackup ?? true);
      setUpdateVersion((current) => current + 1);
    });
  }, []);
  return <App applyUpdate={applyUpdate} requiresBackupForUpdate={requiresBackupForUpdate} updateVersion={updateVersion} />;
}
