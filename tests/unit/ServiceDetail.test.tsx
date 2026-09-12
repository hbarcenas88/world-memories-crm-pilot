import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ServiceDetail } from '../../src/features/trips/ServiceDetail';

afterEach(cleanup);

describe('ServiceDetail', () => {
  it('uses the shared record header for its full workspace', () => {
    render(<ServiceDetail onSave={vi.fn().mockResolvedValue(undefined)} service={{ id: 'service-1', tripId: 'trip-1', name: 'Hotel Aurora', status: 'active', createdAt: '2026-09-01T00:00:00.000Z' }} />);

    expect(screen.getByRole('heading', { level: 2, name: 'Detalle de servicio' }).closest('.record-header')).toBeTruthy();
  });
});
