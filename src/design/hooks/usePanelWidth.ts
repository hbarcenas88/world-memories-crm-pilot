import { useCallback, useState } from 'react';

const storageKey = 'wm.detailPanelWidth';
const defaultWidth = 420;
const minimumWidth = 320;
const maximumWidth = 560;

function clampPanelWidth(value: number): number {
  return Math.min(maximumWidth, Math.max(minimumWidth, Math.round(value)));
}

function initialPanelWidth(): number {
  const stored = localStorage.getItem(storageKey);
  if (stored === null) return defaultWidth;
  const saved = Number(stored);
  return Number.isFinite(saved) ? clampPanelWidth(saved) : defaultWidth;
}

export function usePanelWidth() {
  const [width, updateWidth] = useState(initialPanelWidth);
  const setWidth = useCallback((nextWidth: number) => {
    const clampedWidth = clampPanelWidth(nextWidth);
    localStorage.setItem(storageKey, String(clampedWidth));
    updateWidth(clampedWidth);
  }, []);
  const reset = useCallback(() => {
    localStorage.removeItem(storageKey);
    updateWidth(defaultWidth);
  }, []);

  return { width, setWidth, reset };
}
