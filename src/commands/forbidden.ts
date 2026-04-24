import * as fs from 'fs';
import * as path from 'path';

export interface ForbiddenEntry {
  key: string;
  reason?: string;
}

export function parseForbiddenList(content: string): ForbiddenEntry[] {
  const entries: ForbiddenEntry[] = [];
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split(/\s+#\s*/);
    if (key) {
      entries.push({ key: key.trim(), reason: rest.join(' ').trim() || undefined });
    }
  }
  return entries;
}

export function checkForbiddenKeys(
  vaultKeys: string[],
  forbidden: ForbiddenEntry[]
): { key: string; reason?: string }[] {
  const forbiddenSet = new Map(forbidden.map((e) => [e.key, e.reason]));
  const violations: { key: string; reason?: string }[] = [];
  for (const key of vaultKeys) {
    if (forbiddenSet.has(key)) {
      violations.push({ key, reason: forbiddenSet.get(key) });
    }
  }
  return violations;
}

export function parseVaultKeys(content: string): string[] {
  const keys: string[] = [];
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)\s*=/);
    if (match) keys.push(match[1]);
  }
  return keys;
}

export function runForbidden(
  vaultPath: string,
  forbiddenPath: string
): void {
  if (!fs.existsSync(vaultPath)) {
    console.error(`Vault file not found: ${vaultPath}`);
    process.exit(1);
  }
  if (!fs.existsSync(forbiddenPath)) {
    console.error(`Forbidden list not found: ${forbiddenPath}`);
    process.exit(1);
  }

  const vaultContent = fs.readFileSync(vaultPath, 'utf-8');
  const forbiddenContent = fs.readFileSync(forbiddenPath, 'utf-8');

  const vaultKeys = parseVaultKeys(vaultContent);
  const forbidden = parseForbiddenList(forbiddenContent);
  const violations = checkForbiddenKeys(vaultKeys, forbidden);

  if (violations.length === 0) {
    console.log('✅ No forbidden keys found in vault.');
    return;
  }

  console.error(`❌ Found ${violations.length} forbidden key(s) in vault:`);
  for (const v of violations) {
    const reason = v.reason ? ` — ${v.reason}` : '';
    console.error(`  • ${v.key}${reason}`);
  }
  process.exit(1);
}
