import * as fs from 'fs';

export interface VaultEntry {
  key: string;
  value: string;
  category?: string;
  rest: string;
}

export function parseVaultWithCategories(content: string): VaultEntry[] {
  const entries: VaultEntry[] = [];
  let currentCategory: string | undefined;

  for (const line of content.split('\n')) {
    const categoryMatch = line.match(/^#\s*@category\s+(\S+)/);
    if (categoryMatch) {
      currentCategory = categoryMatch[1];
      continue;
    }
    const kvMatch = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (kvMatch) {
      entries.push({
        key: kvMatch[1],
        value: kvMatch[2],
        category: currentCategory,
        rest: line,
      });
    } else {
      if (line.trim() === '' || line.startsWith('#')) {
        if (line.trim() === '') currentCategory = undefined;
      }
    }
  }
  return entries;
}

export function setCategory(entries: VaultEntry[], key: string, category: string): VaultEntry[] {
  return entries.map(e => e.key === key ? { ...e, category } : e);
}

export function removeCategory(entries: VaultEntry[], key: string): VaultEntry[] {
  return entries.map(e => e.key === key ? { ...e, category: undefined } : e);
}

export function listCategories(entries: VaultEntry[]): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const entry of entries) {
    const cat = entry.category ?? '(uncategorized)';
    if (!map[cat]) map[cat] = [];
    map[cat].push(entry.key);
  }
  return map;
}

export function serializeVaultWithCategories(entries: VaultEntry[]): string {
  const lines: string[] = [];
  let lastCategory: string | undefined = null as any;

  for (const entry of entries) {
    if (entry.category !== lastCategory) {
      if (lines.length > 0) lines.push('');
      if (entry.category) lines.push(`# @category ${entry.category}`);
      lastCategory = entry.category;
    }
    lines.push(`${entry.key}=${entry.value}`);
  }
  return lines.join('\n') + '\n';
}

export function runCategory(
  vaultPath: string,
  action: 'set' | 'remove' | 'list',
  key?: string,
  category?: string
): void {
  const content = fs.readFileSync(vaultPath, 'utf-8');
  let entries = parseVaultWithCategories(content);

  if (action === 'list') {
    const cats = listCategories(entries);
    for (const [cat, keys] of Object.entries(cats)) {
      console.log(`[${cat}]`);
      keys.forEach(k => console.log(`  ${k}`));
    }
    return;
  }

  if (!key) throw new Error('Key is required for set/remove actions');

  if (action === 'set') {
    if (!category) throw new Error('Category is required for set action');
    entries = setCategory(entries, key, category);
  } else if (action === 'remove') {
    entries = removeCategory(entries, key);
  }

  fs.writeFileSync(vaultPath, serializeVaultWithCategories(entries), 'utf-8');
  console.log(`Category ${action === 'set' ? `set to '${category}'` : 'removed'} for key '${key}'`);
}
