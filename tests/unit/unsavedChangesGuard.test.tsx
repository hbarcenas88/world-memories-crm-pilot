import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useUnsavedChangesGuard } from '../../src/app/useUnsavedChangesGuard';

function Guard({ dirty }: Readonly<{ dirty: boolean }>) {
  useUnsavedChangesGuard(dirty);
  return null;
}

describe('useUnsavedChangesGuard', () => {
  it('requests the browser warning only while a draft is dirty', () => {
    const { rerender } = render(<Guard dirty={false} />);
    const clean = new Event('beforeunload', { cancelable: true });
    expect(window.dispatchEvent(clean)).toBe(true);

    rerender(<Guard dirty />);
    const dirty = new Event('beforeunload', { cancelable: true });
    expect(window.dispatchEvent(dirty)).toBe(false);
  });
});
