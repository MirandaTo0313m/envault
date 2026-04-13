import * as fs from 'fs';
import * as path from 'path';
import { VAULT_FILE } from '../constants';

export interface VaultEntry {
  key: string;
  value: string;
  comment?: string;
  [key: string]: string | undefined;
}

export function parseVaultWithComments(content: string): VaultEntry[] {
  const entries: VaultEntry[] = [];
  const lines = content.split('\n');
  let pendingComment: string | undefined;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#')) {
      pendingComment = trimmed.slice(1).trim();
      continue;
    }
    if (!trimmed || !trimmed.includes('=')) {
      pendingComment = undefined;
      continue;
    }
    const eqIdx = trimmed.indexOf('=');
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    const entry: VaultEntry = { key, value };
    if (pendingComment) {
      entry.comment = pendingComment;
    }
    entries.push(entry);
    pendingComment = undefined;
  }
  return entries;
}

export function serializeVaultWithComments(entries: VaultEntry[]): string {
  return entries
    .map((e) => (e.comment ? `# ${e.comment}\n${e.key}=${e.value}` : `${e.key}=${e.value}`))
    .join('\n') + '\n';
}

export function setComment(vaultPath: string, key: string, comment: string): void {
  if (!fs.existsSync(vaultPath)) {
    throw new Error(`Vault file not found: ${vaultPath}`);
  }
  const content = fs.readFileSync(vaultPath, 'utf-8');
  const entries = parseVaultWithComments(content);
  const entry = entries.find((e) => e.key === key);
  if (!entry) {
    throw new Error(`Key "${key}" not found in vault.`);
  }
  entry.comment = comment;
  fs.writeFileSync(vaultPath, serializeVaultWithComments(entries), 'utf-8');
}

export function runComment(key: string, comment: string, vaultPath: string = VAULT_FILE): void {
  setComment(vaultPath, key, comment);
  console.log(`Comment set for "${key}": ${comment}`);
}
