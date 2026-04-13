import * as fs from 'fs';
import * as path from 'path';
import { VAULT_FILE } from '../constants';

export interface TaggedEntry {
  key: string;
  value: string;
  tags: string[];
}

export function parseVaultWithTags(vaultPath: string): TaggedEntry[] {
  if (!fs.existsSync(vaultPath)) {
    return [];
  }

  const lines = fs.readFileSync(vaultPath, 'utf-8').split('\n');
  const entries: TaggedEntry[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#!')) continue;

    const commentMatch = trimmed.match(/^([^=]+)=([^#]*)(?:#tags:([\w,]+))?/);
    if (commentMatch) {
      const key = commentMatch[1].trim();
      const value = commentMatch[2].trim();
      const tagStr = commentMatch[3] || '';
      const tags = tagStr ? tagStr.split(',').map(t => t.trim()).filter(Boolean) : [];
      entries.push({ key, value, tags });
    }
  }

  return entries;
}

export function addTagToEntry(
  vaultPath: string,
  targetKey: string,
  tag: string
): boolean {
  if (!fs.existsSync(vaultPath)) {
    console.error(`Vault file not found: ${vaultPath}`);
    return false;
  }

  const lines = fs.readFileSync(vaultPath, 'utf-8').split('\n');
  let found = false;

  const updated = lines.map(line => {
    const match = line.match(/^([^=]+)=([^#]*)(?:#tags:([\w,]+))?/);
    if (!match) return line;

    const key = match[1].trim();
    if (key !== targetKey) return line;

    found = true;
    const value = match[2].trim();
    const existingTags = match[3] ? match[3].split(',').map(t => t.trim()) : [];

    if (existingTags.includes(tag)) return line;

    const newTags = [...existingTags, tag].join(',');
    return `${key}=${value} #tags:${newTags}`;
  });

  if (!found) {
    console.error(`Key "${targetKey}" not found in vault.`);
    return false;
  }

  fs.writeFileSync(vaultPath, updated.join('\n'), 'utf-8');
  console.log(`Tag "${tag}" added to "${targetKey}".`);
  return true;
}

export function filterByTag(vaultPath: string, tag: string): TaggedEntry[] {
  const entries = parseVaultWithTags(vaultPath);
  return entries.filter(e => e.tags.includes(tag));
}

export function runTag(
  action: 'add' | 'filter',
  key: string,
  tag: string,
  vaultPath: string = VAULT_FILE
): void {
  if (action === 'add') {
    addTagToEntry(vaultPath, key, tag);
  } else if (action === 'filter') {
    const results = filterByTag(vaultPath, tag);
    if (results.length === 0) {
      console.log(`No entries found with tag "${tag}".`);
    } else {
      results.forEach(e => console.log(`${e.key} [tags: ${e.tags.join(', ')}]`));
    }
  }
}
