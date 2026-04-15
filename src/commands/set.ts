import * as fs from 'fs';
import * as path from 'path';
import { VAULT_FILE } from '../constants';
import { encryptWithPublicKey } from '../crypto/encrypt';
import { loadPublicKey } from '../crypto/keyPair';
import { assertUnlocked } from '../utils/assertUnlocked';

export function parseVaultForSet(content: string): Record<string, string> {
  const entries: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    entries[key] = value;
  }
  return entries;
}

export function serializeVaultEntries(entries: Record<string, string>): string {
  return Object.entries(entries)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n') + '\n';
}

export async function runSet(
  key: string,
  value: string,
  vaultPath: string = VAULT_FILE
): Promise<void> {
  assertUnlocked(vaultPath);

  const publicKey = loadPublicKey();
  const encrypted = encryptWithPublicKey(value, publicKey);

  let entries: Record<string, string> = {};
  if (fs.existsSync(vaultPath)) {
    const content = fs.readFileSync(vaultPath, 'utf-8');
    entries = parseVaultForSet(content);
  }

  const existed = key in entries;
  entries[key] = encrypted;

  fs.writeFileSync(vaultPath, serializeVaultEntries(entries), 'utf-8');

  if (existed) {
    console.log(`✔ Updated key "${key}" in vault.`);
  } else {
    console.log(`✔ Added key "${key}" to vault.`);
  }
}
