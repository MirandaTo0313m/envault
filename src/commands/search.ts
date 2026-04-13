import * as fs from 'fs';
import * as path from 'path';
import { VAULT_FILE } from '../constants';

export interface SearchResult {
  key: string;
  lineNumber: number;
  preview: string;
}

export function searchVaultKeys(
  query: string,
  vaultPath: string = VAULT_FILE
): SearchResult[] {
  if (!fs.existsSync(vaultPath)) {
    throw new Error(`Vault file not found: ${vaultPath}`);
  }

  const content = fs.readFileSync(vaultPath, 'utf-8');
  const lines = content.split('\n');
  const results: SearchResult[] = [];
  const lowerQuery = query.toLowerCase();

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) return;

    const key = trimmed.substring(0, eqIndex).trim();
    if (key.toLowerCase().includes(lowerQuery)) {
      const valuePreview = trimmed.substring(eqIndex + 1, eqIndex + 20);
      results.push({
        key,
        lineNumber: index + 1,
        preview: `${key}=${valuePreview}${trimmed.length > eqIndex + 20 ? '...' : ''}`,
      });
    }
  });

  return results;
}

export function runSearch(query: string, vaultPath?: string): void {
  if (!query || query.trim() === '') {
    console.error('Error: search query cannot be empty.');
    process.exit(1);
  }

  let results: SearchResult[];
  try {
    results = searchVaultKeys(query, vaultPath);
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }

  if (results.length === 0) {
    console.log(`No keys matching "${query}" found in vault.`);
    return;
  }

  console.log(`Found ${results.length} key(s) matching "${query}":\n`);
  results.forEach((r) => {
    console.log(`  Line ${r.lineNumber}: ${r.key}`);
  });
}
