import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { encryptWithPublicKey } from '../crypto/encrypt';
import { loadPublicKey } from '../crypto/keyPair';
import { VAULT_FILE, PUBLIC_KEY_FILE } from '../constants';

export function parseEnvFileToEntries(filePath: string): Record<string, string> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const entries: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.substring(0, eqIndex).trim();
    const value = trimmed.substring(eqIndex + 1).trim();
    if (key) entries[key] = value;
  }
  return entries;
}

export function mergeVaultEntries(
  existing: Record<string, string>,
  incoming: Record<string, string>,
  overwrite: boolean
): Record<string, string> {
  const merged = { ...existing };
  for (const [key, value] of Object.entries(incoming)) {
    if (!overwrite && key in merged) continue;
    merged[key] = value;
  }
  return merged;
}

export function serializeVault(entries: Record<string, string>): string {
  return Object.entries(entries)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n') + '\n';
}

export async function runImport(
  envFilePath: string,
  options: { overwrite?: boolean } = {}
): Promise<void> {
  const resolvedPath = path.resolve(envFilePath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`File not found: ${envFilePath}`);
    process.exit(1);
  }

  const publicKey = loadPublicKey(PUBLIC_KEY_FILE);
  const incoming = parseEnvFileToEntries(resolvedPath);

  const vaultPath = path.resolve(VAULT_FILE);
  let existingEntries: Record<string, string> = {};
  if (fs.existsSync(vaultPath)) {
    const raw = fs.readFileSync(vaultPath, 'utf-8');
    for (const line of raw.split('\n').filter(Boolean)) {
      const eq = line.indexOf('=');
      if (eq !== -1) existingEntries[line.substring(0, eq)] = line.substring(eq + 1);
    }
  }

  const encryptedIncoming: Record<string, string> = {};
  for (const [key, value] of Object.entries(incoming)) {
    encryptedIncoming[key] = encryptWithPublicKey(publicKey, value);
  }

  const merged = mergeVaultEntries(existingEntries, encryptedIncoming, options.overwrite ?? false);
  fs.writeFileSync(vaultPath, serializeVault(merged), 'utf-8');
  console.log(`Imported ${Object.keys(incoming).length} variable(s) from ${envFilePath}`);
}
