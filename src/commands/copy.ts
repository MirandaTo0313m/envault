import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { VAULT_FILE } from '../constants';

export function parseVaultForCopy(vaultPath: string): Record<string, string> {
  if (!fs.existsSync(vaultPath)) {
    throw new Error(`Vault file not found: ${vaultPath}`);
  }
  const lines = fs.readFileSync(vaultPath, 'utf-8').split('\n');
  const entries: Record<string, string> = {};
  for (const line of lines) {
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

export function copyKeyInVault(
  vaultPath: string,
  sourceKey: string,
  destKey: string
): void {
  const entries = parseVaultForCopy(vaultPath);

  if (!(sourceKey in entries)) {
    throw new Error(`Key "${sourceKey}" not found in vault.`);
  }
  if (destKey in entries) {
    throw new Error(
      `Key "${destKey}" already exists in vault. Use rename or remove it first.`
    );
  }

  entries[destKey] = entries[sourceKey];

  const lines = fs.readFileSync(vaultPath, 'utf-8').split('\n');
  const newLines = [...lines, `${destKey}=${entries[destKey]}`];
  fs.writeFileSync(vaultPath, newLines.join('\n'), 'utf-8');
}

export async function runCopy(
  sourceKey: string,
  destKey: string,
  vaultPath: string = VAULT_FILE
): Promise<void> {
  if (!sourceKey || !destKey) {
    console.error('Usage: envault copy <SOURCE_KEY> <DEST_KEY>');
    process.exit(1);
  }

  try {
    copyKeyInVault(vaultPath, sourceKey, destKey);
    console.log(`✔ Copied "${sourceKey}" to "${destKey}" in vault.`);
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}
