import { RotateCcw } from 'lucide-react';
import { useRef, type PointerEvent, type ReactNode } from 'react';
import { t, useLocale } from '../../app/i18n';
import { usePanelWidth } from '../hooks/usePanelWidth';

type ResizableDetailPanelProps = Readonly<{
  children: ReactNode;
  panel: ReactNode;
}>;

const minimumWidth = 320;
const maximumWidth = 560;
const keyboardStep = 20;

export function ResizableDetailPanel({ children, panel }: ResizableDetailPanelProps) {
  const locale = useLocale();
  const { reset, setWidth, width } = usePanelWidth();
  const dragStart = useRef<Readonly<{ pointerX: number; width: number }> | undefined>(undefined);

  function adjustFromKeyboard(key: string): void {
    if (key === 'ArrowLeft') setWidth(width - keyboardStep);
    if (key === 'ArrowRight') setWidth(width + keyboardStep);
    if (key === 'Home') setWidth(minimumWidth);
    if (key === 'End') setWidth(maximumWidth);
  }

  function startDrag(event: PointerEvent<HTMLDivElement>): void {
    dragStart.current = { pointerX: event.clientX, width };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function drag(event: PointerEvent<HTMLDivElement>): void {
    if (!dragStart.current) return;
    setWidth(dragStart.current.width - (event.clientX - dragStart.current.pointerX));
  }

  function endDrag(): void {
    dragStart.current = undefined;
  }

  return <div className="resizable-workbench" style={{ gridTemplateColumns: `minmax(0, 1fr) 8px ${width}px` }}>
    <div className="resizable-workbench-main">{children}</div>
    <div aria-label={t('adjustDetailPanelWidth', locale)} aria-orientation="vertical" aria-valuemax={maximumWidth} aria-valuemin={minimumWidth} aria-valuenow={width} className="detail-panel-separator" onKeyDown={(event) => {
      if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        adjustFromKeyboard(event.key);
      }
    }} onPointerDown={startDrag} onPointerMove={drag} onPointerUp={endDrag} role="separator" tabIndex={0} />
    <div className="resizable-workbench-panel"><div className="detail-panel-controls"><button aria-label={t('resetPanelWidth', locale)} className="icon-button" onClick={reset} type="button"><RotateCcw aria-hidden="true" size={17} /></button></div>{panel}</div>
  </div>;
}
