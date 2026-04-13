import * as fs from 'fs';
import * as path from 'path';
import { VAULT_FILE } from '../constants';

export interface VaultEntry {
  key: string;
  value: string;
  tags?: string[];
}

export function parseVaultEntries(content: string): VaultEntry[] {
  const entries: VaultEntry[] = [];
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.substring(0, eqIdx).trim();
    const rest = trimmed.substring(eqIdx + 1).trim();
    const tagMatch = rest.match(/^(.*)\s+#tags:([\w,]+)$/);
    if (tagMatch) {
      entries.push({ key, value: tagMatch[1].trim(), tags: tagMatch[2].split(',') });
    } else {
      entries.push({ key, value: rest });
    }
  }
  return entries;
}

export function mergeVaults(
  base: VaultEntry[],
  incoming: VaultEntry[],
  strategy: 'ours' | 'theirs' | 'union' = 'theirs'
): VaultEntry[] {
  const map = new Map<string, VaultEntry>();
  for (const entry of base) map.set(entry.key, entry);
  for (const entry of incoming) {
    if (strategy === 'ours' && map.has(entry.key)) continue;
    if (strategy === 'theirs' || strategy === 'union' || !map.has(entry.key)) {
      map.set(entry.key, entry);
    }
  }
  return Array.from(map.values());
}

export function serializeMergedVault(entries: VaultEntry[]): string {
  return entries
    .map((e) => {
      const tagSuffix = e.tags && e.tags.length ? ` #tags:${e.tags.join(',')}` : '';
      return `${e.key}=${e.value}${tagSuffix}`;
    })
    .join('\n');
}

export function runMerge(
  sourceFile: string,
  strategy: 'ours' | 'theirs' | 'union' = 'theirs',
  vaultPath: string = VAULT_FILE
): void {
  if (!fs.existsSync(sourceFile)) {
    console.error(`Source file not found: ${sourceFile}`);
    process.exit(1);
  }
  const baseContent = fs.existsSync(vaultPath) ? fs.readFileSync(vaultPath, 'utf-8') : '';
  const incomingContent = fs.readFileSync(sourceFile, 'utf-8');
  const base = parseVaultEntries(baseContent);
  const incoming = parseVaultEntries(incomingContent);
  const merged = mergeVaults(base, incoming, strategy);
  fs.writeFileSync(vaultPath, serializeMergedVault(merged), 'utf-8');
  console.log(`Merged ${incoming.length} entries into vault using strategy '${strategy}'.`);
}
