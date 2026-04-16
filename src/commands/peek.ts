import * as fs from 'fs';
import * as path from 'path';
import { VAULT_FILE } from '../constants';

export interface PeekEntry {
  key: string;
  preview: string;
  length: number;
}

export function parseVaultForPeek(content: string): PeekEntry[] {
  const entries: PeekEntry[] = [];
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    const preview = value.length <= 6 ? '*'.repeat(value.length) : value.slice(0, 3) + '...' + value.slice(-1);
    entries.push({ key, preview, length: value.length });
  }
  return entries;
}

export function formatPeekOutput(entries: PeekEntry[]): string {
  if (entries.length === 0) return 'No entries found in vault.';
  const lines = entries.map(e => `  ${e.key.padEnd(30)} ${e.preview.padEnd(16)} (${e.length} chars)`);
  return ['Key                            Preview          Length', '-'.repeat(60), ...lines].join('\n');
}

export function runPeek(vaultPath: string = VAULT_FILE): void {
  const resolved = path.resolve(vaultPath);
  if (!fs.existsSync(resolved)) {
    console.error(`Vault file not found: ${resolved}`);
    process.exit(1);
  }
  const content = fs.readFileSync(resolved, 'utf-8');
  const entries = parseVaultForPeek(content);
  console.log(formatPeekOutput(entries));
}
