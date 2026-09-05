import { strToU8 } from 'fflate';

export type ManifestFile = Readonly<{ name: string; checksum: string; rowCount: number }>;
export type CsvManifest = Readonly<{ format: 'world-memories-import'; schemaVersion: 1; exportedAt: string; files: readonly ManifestFile[] }>;

export async function sha256(value: Uint8Array | string): Promise<string> {
  const bytes = typeof value === 'string' ? strToU8(value) : value;
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  const digest = await crypto.subtle.digest('SHA-256', copy.buffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
