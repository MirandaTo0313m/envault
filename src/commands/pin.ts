import * as fs from 'fs';
import * as path from 'path';
import { VAULT_FILE } from '../constants';

export interface PinnedEntry {
  key: string;
  pinnedAt: string;
}

export function parsePinnedKeys(vaultContent: string): PinnedEntry[] {
  const pinned: PinnedEntry[] = [];
  const lines = vaultContent.split('\n');
  for (const line of lines) {
    const match = line.match(/^#\s*@pinned:([\w.]+)\s+pinned_at=(.+)$/);
    if (match) {
      pinned.push({ key: match[1], pinnedAt: match[2].trim() });
    }
  }
  return pinned;
}

export function pinKeyInVault(vaultContent: string, key: string): string {
  const lines = vaultContent.split('\n');
  const pinnedAt = new Date().toISOString();
  const pinLine = `# @pinned:${key} pinned_at=${pinnedAt}`;

  // Check if already pinned
  if (lines.some(l => l.includes(`@pinned:${key}`))) {
    return vaultContent;
  }

  const keyIndex = lines.findIndex(l => l.startsWith(`${key}=`));
  if (keyIndex === -1) {
    throw new Error(`Key "${key}" not found in vault.`);
  }

  lines.splice(keyIndex, 0, pinLine);
  return lines.join('\n');
}

export function unpinKeyInVault(vaultContent: string, key: string): string {
  const lines = vaultContent.split('\n');
  const filtered = lines.filter(l => !l.includes(`@pinned:${key}`));
  if (filtered.length === lines.length) {
    throw new Error(`Key "${key}" is not pinned.`);
  }
  return filtered.join('\n');
}

export function runPin(vaultPath: string, key: string, unpin: boolean): void {
  const fullPath = path.resolve(vaultPath || VAULT_FILE);
  if (!fs.existsSync(fullPath)) {
    console.error(`Vault file not found: ${fullPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  try {
    const updated = unpin
      ? unpinKeyInVault(content, key)
      : pinKeyInVault(content, key);
    fs.writeFileSync(fullPath, updated, 'utf-8');
    console.log(unpin ? `Unpinned "${key}".` : `Pinned "${key}".`);
  } catch (err: any) {
    console.error(err.message);
    process.exit(1);
  }
}
