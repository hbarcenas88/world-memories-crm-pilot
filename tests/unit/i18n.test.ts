import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { LocaleProvider, t, useLocale } from '../../src/app/i18n';

function LocaleProbe() {
  const locale = useLocale();
  return createElement('span', undefined, t('archived', locale));
}

describe('interface language', () => {
  it('uses Spanish as the default interface language and preserves captured values', () => {
    expect(t('leads', 'es')).toBe('Leads');
    expect(t('newLead', 'es')).toBe('Nuevo lead');
    expect(t('newLead', 'en')).toBe('New lead');

    const capturedDestination = 'Japón con niños';
    expect(capturedDestination).toBe('Japón con niños');
  });

  it('provides the active locale to interface components and supports interpolation', () => {
    render(createElement(LocaleProvider, { locale: 'en' }, createElement(LocaleProbe)));

    expect(screen.getByText('Archived')).toBeTruthy();
    expect(t('recordArchived', 'en', { record: 'Lead' })).toBe('Lead archived.');
  });
});
