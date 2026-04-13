import * as fs from 'fs';
import * as path from 'path';
import { VAULT_FILE, ENV_FILE } from '../constants';
import { parseVaultEntries } from './export';
import { decryptWithPrivateKey } from '../crypto/encrypt';
import { loadPrivateKey } from '../crypto/keyPair';

export interface DiffEntry {
  key: string;
  status: 'added' | 'removed' | 'changed' | 'unchanged';
  vaultValue?: string;
  envValue?: string;
}

export function parseEnvPairs(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    result[key] = value;
  }
  return result;
}

export async function computeDiff(vaultPath: string, envPath: string): Promise<DiffEntry[]> {
  if (!fs.existsSync(vaultPath)) throw new Error(`Vault file not found: ${vaultPath}`);
  if (!fs.existsSync(envPath)) throw new Error(`Env file not found: ${envPath}`);

  const privateKey = loadPrivateKey();
  const vaultContent = fs.readFileSync(vaultPath, 'utf-8');
  const entries = parseVaultEntries(vaultContent);

  const vaultPairs: Record<string, string> = {};
  for (const entry of entries) {
    try {
      vaultPairs[entry.key] = decryptWithPrivateKey(entry.encryptedValue, privateKey);
    } catch {
      vaultPairs[entry.key] = '<decryption-failed>';
    }
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const envPairs = parseEnvPairs(envContent);

  const allKeys = new Set([...Object.keys(vaultPairs), ...Object.keys(envPairs)]);
  const diffs: DiffEntry[] = [];

  for (const key of Array.from(allKeys).sort()) {
    const inVault = key in vaultPairs;
    const inEnv = key in envPairs;
    if (inVault && !inEnv) {
      diffs.push({ key, status: 'removed', vaultValue: vaultPairs[key] });
    } else if (!inVault && inEnv) {
      diffs.push({ key, status: 'added', envValue: envPairs[key] });
    } else if (vaultPairs[key] !== envPairs[key]) {
      diffs.push({ key, status: 'changed', vaultValue: vaultPairs[key], envValue: envPairs[key] });
    } else {
      diffs.push({ key, status: 'unchanged', vaultValue: vaultPairs[key], envValue: envPairs[key] });
    }
  }

  return diffs;
}

export async function runDiff(vaultPath = VAULT_FILE, envPath = ENV_FILE): Promise<void> {
  const diffs = await computeDiff(vaultPath, envPath);
  const symbols: Record<DiffEntry['status'], string> = {
    added: '+ ',
    removed: '- ',
    changed: '~ ',
    unchanged: '  ',
  };

  let hasChanges = false;
  for (const entry of diffs) {
    if (entry.status !== 'unchanged') hasChanges = true;
    const symbol = symbols[entry.status];
    if (entry.status === 'changed') {
      console.log(`${symbol}${entry.key}  (vault: "${entry.vaultValue}" → env: "${entry.envValue}")`);
    } else if (entry.status === 'added') {
      console.log(`${symbol}${entry.key}  (env only: "${entry.envValue}")`);
    } else if (entry.status === 'removed') {
      console.log(`${symbol}${entry.key}  (vault only: "${entry.vaultValue}")`);
    }
  }

  if (!hasChanges) {
    console.log('No differences found between vault and .env file.');
  }
}
