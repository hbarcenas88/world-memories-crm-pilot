import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ActionRow } from '../../src/design/components/ActionRow';
import { RecordHeader } from '../../src/design/components/RecordHeader';

describe('record layout primitives', () => {
  it('renders a record heading once with its actions in a distinct row', () => {
    render(<RecordHeader actions={<button type="button">Editar</button>} eyebrow="Lead" title="Consulta familiar" />);

    expect(screen.getAllByRole('heading', { level: 2, name: 'Consulta familiar' })).toHaveLength(1);
    expect(screen.getByText('Lead')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Editar' }).closest('.action-row')).toBeTruthy();
  });

  it('uses an action row for controls that may wrap instead of relying on adjacent button margins', () => {
    render(<ActionRow><button type="button">Primera acción</button><button type="button">Segunda acción</button></ActionRow>);

    expect(screen.getByRole('button', { name: 'Primera acción' }).parentElement?.classList.contains('action-row')).toBe(true);
  });
});
