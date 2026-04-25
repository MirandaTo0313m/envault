import * as fs from 'fs';

/**
 * Resolves vault values by substituting variable references (${VAR}) with their actual values.
 */

export interface ResolvedEntry {
  key: string;
  rawValue: string;
  resolvedValue: string;
  hadReference: boolean;
}

export function parseVaultForResolve(vaultContent: string): Record<string, string> {
  const entries: Record<string, string> = {};
  for (const line of vaultContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (key) entries[key] = value;
  }
  return entries;
}

export function resolveValue(
  value: string,
  context: Record<string, string>,
  visited: Set<string> = new Set()
): string {
  return value.replace(/\$\{([^}]+)\}/g, (match, refKey) => {
    if (visited.has(refKey)) {
      return match; // circular reference — leave as-is
    }
    if (refKey in context) {
      visited.add(refKey);
      const resolved = resolveValue(context[refKey], context, new Set(visited));
      return resolved;
    }
    return match;
  });
}

export function resolveVaultEntries(entries: Record<string, string>): ResolvedEntry[] {
  return Object.entries(entries).map(([key, rawValue]) => {
    const resolvedValue = resolveValue(rawValue, entries);
    return {
      key,
      rawValue,
      resolvedValue,
      hadReference: resolvedValue !== rawValue,
    };
  });
}

export function runResolve(vaultPath: string, outputFormat: 'table' | 'env' = 'env'): void {
  if (!fs.existsSync(vaultPath)) {
    console.error(`Vault file not found: ${vaultPath}`);
    process.exit(1);
  }
  const content = fs.readFileSync(vaultPath, 'utf-8');
  const entries = parseVaultForResolve(content);
  const resolved = resolveVaultEntries(entries);

  if (outputFormat === 'table') {
    console.log(`${'KEY'.padEnd(30)} ${'RAW VALUE'.padEnd(30)} RESOLVED VALUE`);
    console.log('-'.repeat(90));
    for (const entry of resolved) {
      const flag = entry.hadReference ? '*' : ' ';
      console.log(`${flag} ${entry.key.padEnd(29)} ${entry.rawValue.padEnd(30)} ${entry.resolvedValue}`);
    }
    const refCount = resolved.filter(e => e.hadReference).length;
    if (refCount > 0) console.log(`\n* ${refCount} key(s) had variable references resolved.`);
  } else {
    for (const entry of resolved) {
      console.log(`${entry.key}=${entry.resolvedValue}`);
    }
  }
}
