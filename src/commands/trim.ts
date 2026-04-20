import * as fs from 'fs';

export interface TrimResult {
  key: string;
  original: string;
  trimmed: string;
  changed: boolean;
}

export function parseVaultForTrim(content: string): Array<{ key: string; value: string; raw: string }> {
  const lines = content.split('\n');
  const entries: Array<{ key: string; value: string; raw: string }> = [];

  for (const line of lines) {
    const match = line.match(/^([^#=\s][^=]*)=(.*)$/);
    if (match) {
      entries.push({ key: match[1].trim(), value: match[2], raw: line });
    }
  }

  return entries;
}

export function trimVaultValues(
  entries: Array<{ key: string; value: string; raw: string }>
): TrimResult[] {
  return entries.map(({ key, value }) => {
    const trimmed = value.trim();
    return {
      key,
      original: value,
      trimmed,
      changed: trimmed !== value,
    };
  });
}

export function serializeTrimmedVault(
  content: string,
  results: TrimResult[]
): string {
  const lines = content.split('\n');
  const changedMap = new Map(results.filter(r => r.changed).map(r => [r.key, r.trimmed]));

  return lines
    .map(line => {
      const match = line.match(/^([^#=\s][^=]*)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        if (changedMap.has(key)) {
          return `${key}=${changedMap.get(key)}`;
        }
      }
      return line;
    })
    .join('\n');
}

export function runTrim(vaultPath: string, dryRun = false): void {
  if (!fs.existsSync(vaultPath)) {
    console.error(`Vault file not found: ${vaultPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(vaultPath, 'utf-8');
  const entries = parseVaultForTrim(content);
  const results = trimVaultValues(entries);
  const changed = results.filter(r => r.changed);

  if (changed.length === 0) {
    console.log('No values needed trimming.');
    return;
  }

  for (const r of changed) {
    console.log(`  ${r.key}: "${r.original}" → "${r.trimmed}"`);
  }

  if (dryRun) {
    console.log(`\nDry run: ${changed.length} value(s) would be trimmed.`);
    return;
  }

  const updated = serializeTrimmedVault(content, results);
  fs.writeFileSync(vaultPath, updated, 'utf-8');
  console.log(`\nTrimmed ${changed.length} value(s) in ${vaultPath}.`);
}
