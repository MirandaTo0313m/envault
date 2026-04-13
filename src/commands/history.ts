import * as fs from 'fs';
import * as path from 'path';
import { VAULT_FILE } from '../constants';

export interface VaultHistoryEntry {
  key: string;
  timestamp: string;
  action: 'added' | 'updated' | 'removed';
  hash: string;
}

export function parseHistoryFromVault(vaultPath: string): VaultHistoryEntry[] {
  if (!fs.existsSync(vaultPath)) {
    throw new Error(`Vault file not found: ${vaultPath}`);
  }

  const lines = fs.readFileSync(vaultPath, 'utf-8').split('\n').filter(Boolean);
  const entries: VaultHistoryEntry[] = [];

  for (const line of lines) {
    const match = line.match(/^#\s*history:\s*(\S+)\s+(\S+)\s+(added|updated|removed)\s+(\S+)$/);
    if (match) {
      entries.push({
        key: match[1],
        timestamp: match[2],
        action: match[3] as VaultHistoryEntry['action'],
        hash: match[4],
      });
    }
  }

  return entries;
}

export function appendHistoryEntry(
  vaultPath: string,
  key: string,
  action: VaultHistoryEntry['action'],
  hash: string
): void {
  const timestamp = new Date().toISOString();
  const entry = `# history: ${key} ${timestamp} ${action} ${hash}\n`;
  fs.appendFileSync(vaultPath, entry, 'utf-8');
}

export function runHistory(options: { key?: string; limit?: number; vaultPath?: string }): void {
  const vaultPath = options.vaultPath ?? VAULT_FILE;
  const entries = parseHistoryFromVault(vaultPath);

  const filtered = options.key
    ? entries.filter((e) => e.key === options.key)
    : entries;

  const limited = options.limit ? filtered.slice(-options.limit) : filtered;

  if (limited.length === 0) {
    console.log('No history entries found.');
    return;
  }

  console.log(`${'KEY'.padEnd(30)} ${'TIMESTAMP'.padEnd(26)} ${'ACTION'.padEnd(10)} HASH`);
  console.log('-'.repeat(90));
  for (const entry of limited) {
    console.log(
      `${entry.key.padEnd(30)} ${entry.timestamp.padEnd(26)} ${entry.action.padEnd(10)} ${entry.hash}`
    );
  }
}
