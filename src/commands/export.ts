import fs from 'fs';
import path from 'path';
import { decryptWithPrivateKey } from '../crypto/encrypt';
import { loadPrivateKey } from '../crypto/keyPair';
import { VAULT_FILE, PRIVATE_KEY_FILE } from '../constants';

export interface ExportOptions {
  output?: string;
  format?: 'dotenv' | 'json' | 'export';
}

export function parseVaultEntries(vaultContent: string): Record<string, string> {
  const entries: Record<string, string> = {};
  const lines = vaultContent.split('\n').filter(Boolean);
  for (const line of lines) {
    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;
    const key = line.substring(0, eqIndex).trim();
    const value = line.substring(eqIndex + 1).trim();
    if (key) entries[key] = value;
  }
  return entries;
}

export function formatOutput(
  entries: Record<string, string>,
  format: 'dotenv' | 'json' | 'export'
): string {
  if (format === 'json') {
    return JSON.stringify(entries, null, 2);
  }
  if (format === 'export') {
    return Object.entries(entries)
      .map(([k, v]) => `export ${k}="${v}"`)
      .join('\n');
  }
  return Object.entries(entries)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
}

export async function runExport(options: ExportOptions = {}): Promise<void> {
  const format = options.format ?? 'dotenv';
  const vaultPath = path.resolve(VAULT_FILE);

  if (!fs.existsSync(vaultPath)) {
    console.error('No vault file found. Run `envault init` first.');
    process.exit(1);
  }

  const privateKey = loadPrivateKey(PRIVATE_KEY_FILE);
  const vaultContent = fs.readFileSync(vaultPath, 'utf-8');
  const encryptedEntries = parseVaultEntries(vaultContent);

  const decrypted: Record<string, string> = {};
  for (const [key, encryptedValue] of Object.entries(encryptedEntries)) {
    try {
      decrypted[key] = decryptWithPrivateKey(privateKey, encryptedValue);
    } catch {
      console.warn(`Warning: Could not decrypt key "${key}". Skipping.`);
    }
  }

  const output = formatOutput(decrypted, format);

  if (options.output) {
    fs.writeFileSync(path.resolve(options.output), output, 'utf-8');
    console.log(`Exported ${Object.keys(decrypted).length} variable(s) to ${options.output}`);
  } else {
    console.log(output);
  }
}
