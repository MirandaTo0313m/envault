import * as fs from 'fs';
import * as path from 'path';
import { VAULT_FILE } from '../constants';

export interface AliasMap {
  [alias: string]: string;
}

export interface VaultEntry {
  key: string;
  value: string;
  alias?: string;
  [prop: string]: unknown;
}

export function parseVaultWithAliases(vaultPath: string): VaultEntry[] {
  if (!fs.existsSync(vaultPath)) return [];
  const raw = fs.readFileSync(vaultPath, 'utf-8');
  const entries: VaultEntry[] = [];
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const rest = trimmed.slice(eqIdx + 1).trim();
    const aliasMeta = rest.match(/#alias:([\w]+)/);
    const value = rest.replace(/#alias:[\w]+/, '').trim();
    entries.push({ key, value, alias: aliasMeta ? aliasMeta[1] : undefined });
  }
  return entries;
}

export function setAlias(vaultPath: string, key: string, alias: string): void {
  const entries = parseVaultWithAliases(vaultPath);
  const entry = entries.find((e) => e.key === key || e.alias === key);
  if (!entry) throw new Error(`Key "${key}" not found in vault.`);
  const existing = entries.find((e) => e.alias === alias && e.key !== entry.key);
  if (existing) throw new Error(`Alias "${alias}" is already used by key "${existing.key}".`);
  entry.alias = alias;
  serializeVaultWithAliases(vaultPath, entries);
}

export function removeAlias(vaultPath: string, key: string): void {
  const entries = parseVaultWithAliases(vaultPath);
  const entry = entries.find((e) => e.key === key || e.alias === key);
  if (!entry) throw new Error(`Key "${key}" not found in vault.`);
  entry.alias = undefined;
  serializeVaultWithAliases(vaultPath, entries);
}

export function serializeVaultWithAliases(vaultPath: string, entries: VaultEntry[]): void {
  const lines = entries.map((e) => {
    const aliasSuffix = e.alias ? ` #alias:${e.alias}` : '';
    return `${e.key}=${e.value}${aliasSuffix}`;
  });
  fs.writeFileSync(vaultPath, lines.join('\n') + '\n', 'utf-8');
}

export function runAlias(
  action: 'set' | 'remove' | 'list',
  vaultPath: string,
  key?: string,
  alias?: string
): void {
  if (action === 'list') {
    const entries = parseVaultWithAliases(vaultPath);
    const aliased = entries.filter((e) => e.alias);
    if (aliased.length === 0) {
      console.log('No aliases defined.');
    } else {
      aliased.forEach((e) => console.log(`${e.alias} -> ${e.key}`));
    }
    return;
  }
  if (!key) throw new Error('Key is required.');
  if (action === 'set') {
    if (!alias) throw new Error('Alias is required for set action.');
    setAlias(vaultPath, key, alias);
    console.log(`Alias "${alias}" set for key "${key}".`);
  } else if (action === 'remove') {
    removeAlias(vaultPath, key);
    console.log(`Alias removed from key "${key}".`);
  }
}
