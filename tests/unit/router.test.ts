import { describe, expect, it } from 'vitest';
import { routeFromHash, routeHash, routeTargetFromHash } from '../../src/app/router';

describe('hash routes', () => {
  it('opens Dashboard by default and only accepts supported module routes', () => {
    expect(routeFromHash('')).toBe('dashboard');
    expect(routeFromHash('#/trips')).toBe('trips');
    expect(routeFromHash('#/unknown')).toBe('dashboard');
    expect(routeHash('calendar')).toBe('#/calendar');
  });

  it('preserves an encoded contextual record reference without changing the module route', () => {
    expect(routeHash('trips', 'trip / 1')).toBe('#/trips?record=trip%20%2F%201');
    expect(routeFromHash('#/trips?record=trip%20%2F%201')).toBe('trips');
    expect(routeTargetFromHash('#/trips?record=trip%20%2F%201')).toBe('trip / 1');
  });
});
