import * as fs from 'fs';
import * as path from 'path';

export interface ExpiryEntry {
  key: string;
  value: string;
  expiresAt: string | null;
  meta: Record<string, string>;
}

export function parseVaultWithExpiry(vaultPath: string): ExpiryEntry[] {
  if (!fs.existsSync(vaultPath)) return [];
  const lines = fs.readFileSync(vaultPath, 'utf-8').split('\n');
  const entries: ExpiryEntry[] = [];
  let pendingMeta: Record<string, string> = {};

  for (const line of lines) {
    const metaMatch = line.match(/^#\s*(\w+)=(.+)$/);
    if (metaMatch) {
      pendingMeta[metaMatch[1]] = metaMatch[2].trim();
      continue;
    }
    const kvMatch = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (kvMatch) {
      entries.push({
        key: kvMatch[1],
        value: kvMatch[2],
        expiresAt: pendingMeta['expires'] ?? null,
        meta: { ...pendingMeta },
      });
      pendingMeta = {};
    }
  }
  return entries;
}

export function setExpiry(entries: ExpiryEntry[], key: string, expiresAt: string): ExpiryEntry[] {
  const idx = entries.findIndex(e => e.key === key);
  if (idx === -1) throw new Error(`Key "${key}" not found in vault.`);
  entries[idx] = { ...entries[idx], expiresAt, meta: { ...entries[idx].meta, expires: expiresAt } };
  return entries;
}

export function removeExpiry(entries: ExpiryEntry[], key: string): ExpiryEntry[] {
  const idx = entries.findIndex(e => e.key === key);
  if (idx === -1) throw new Error(`Key "${key}" not found in vault.`);
  const { expires: _, ...restMeta } = entries[idx].meta;
  entries[idx] = { ...entries[idx], expiresAt: null, meta: restMeta };
  return entries;
}

export function serializeVaultWithExpiry(entries: ExpiryEntry[]): string {
  return entries.map(e => {
    const metaLines = Object.entries(e.meta)
      .map(([k, v]) => `# ${k}=${v}`)
      .join('\n');
    return metaLines ? `${metaLines}\n${e.key}=${e.value}` : `${e.key}=${e.value}`;
  }).join('\n') + '\n';
}

export function getExpiredKeys(entries: ExpiryEntry[]): ExpiryEntry[] {
  const now = new Date();
  return entries.filter(e => e.expiresAt !== null && new Date(e.expiresAt) < now);
}

export function runExpire(vaultPath: string, key: string, expiresAt: string): void {
  const entries = parseVaultWithExpiry(vaultPath);
  const updated = setExpiry(entries, key, expiresAt);
  fs.writeFileSync(vaultPath, serializeVaultWithExpiry(updated), 'utf-8');
  console.log(`Set expiry for "${key}" to ${expiresAt}`);
}
