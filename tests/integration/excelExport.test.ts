import { unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { exportOperationalExcel } from '../../src/infrastructure/export/excelExport';
import type { WorkspaceSnapshot } from '../../src/application/workspaceSnapshot';
import { createDefaultWorkspaceConfiguration } from '../../src/domain/workspaceConfiguration';

const snapshot: WorkspaceSnapshot = { schemaVersion: 2, exportedAt: '2026-08-27T12:00:00.000Z', configuration: createDefaultWorkspaceConfiguration(), leads: [{ id: 'lead-1', name: 'Familia Excel', acquisitionSource: 'Web', communicationChannel: 'WhatsApp', commercialNote: 'Aniversario', requestedDateStatus: 'dates_to_define', status: 'contacted', createdAt: '2026-08-20T00:00:00.000Z' }], clients: [{ id: 'client-1', name: 'Familia Excel', address: 'Calle Prueba 1', createdAt: '2026-08-20T00:00:00.000Z' }], trips: [], services: [], serviceProviders: [], serviceAdditionalItems: [], providers: [], providerTaskTemplates: [], commissions: [], notes: [], tasks: [], payments: [], events: [] };

describe('operational Excel export', () => {
  it('creates a real workbook with operational sheets and no formulas or secrets', async () => {
    const workbook = await exportOperationalExcel(snapshot);
    const files = unzipSync(new Uint8Array(await workbook.arrayBuffer()));
    const contents = Object.values(files).map((file) => new TextDecoder().decode(file)).join('\n');

    expect(workbook.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(Object.keys(files)).toContain('xl/worksheets/sheet1.xml');
    expect(contents).toContain('Familia Excel');
    expect(contents).toContain('Dirección');
    expect(contents).toContain('Calle Prueba 1');
    expect(contents).not.toMatch(/<f>|password|contraseñ/i);
  });
});
