import * as fs from 'fs';

export interface VaultEntry {
  key: string;
  line: string;
}

export function parseVaultForSort(content: string): { entries: VaultEntry[]; header: string[] } {
  const lines = content.split('\n');
  const header: string[] = [];
  const entries: VaultEntry[] = [];

  let inHeader = true;
  for (const line of lines) {
    const trimmed = line.trim();
    if (inHeader && (trimmed.startsWith('#') || trimmed === '')) {
      header.push(line);
    } else if (trimmed === '') {
      // skip blank lines between entries
    } else {
      inHeader = false;
      const match = trimmed.match(/^([A-Z0-9_]+)=/);
      if (match) {
        entries.push({ key: match[1], line });
      } else {
        entries.push({ key: trimmed, line });
      }
    }
  }

  return { entries, header };
}

export type SortOrder = 'asc' | 'desc';

export function sortVaultEntries(entries: VaultEntry[], order: SortOrder = 'asc'): VaultEntry[] {
  return [...entries].sort((a, b) => {
    const cmp = a.key.localeCompare(b.key);
    return order === 'asc' ? cmp : -cmp;
  });
}

export function serializeSortedVault(header: string[], entries: VaultEntry[]): string {
  const headerBlock = header.join('\n');
  const entryBlock = entries.map(e => e.line).join('\n');
  const parts = [headerBlock, entryBlock].filter(p => p.trim() !== '');
  return parts.join('\n') + '\n';
}

export function runSort(
  vaultPath: string,
  order: SortOrder = 'asc',
  dryRun = false
): void {
  if (!fs.existsSync(vaultPath)) {
    console.error(`Vault file not found: ${vaultPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(vaultPath, 'utf-8');
  const { entries, header } = parseVaultForSort(content);
  const sorted = sortVaultEntries(entries, order);
  const output = serializeSortedVault(header, sorted);

  if (dryRun) {
    console.log(output);
    return;
  }

  fs.writeFileSync(vaultPath, output, 'utf-8');
  console.log(`Sorted ${entries.length} entries (${order}) in ${vaultPath}`);
}
