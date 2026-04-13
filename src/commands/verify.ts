import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';
import { VAULT_FILE, ENV_FILE } from '../constants';

export interface VerifyResult {
  key: string;
  vaultHash: string;
  envHash: string;
  match: boolean;
}

export function hashValue(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 16);
}

export function parseVaultValues(vaultPath: string): Record<string, string> {
  if (!fs.existsSync(vaultPath)) return {};
  const content = fs.readFileSync(vaultPath, 'utf-8');
  const result: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    result[key] = value;
  }
  return result;
}

export function parseEnvValues(envPath: string): Record<string, string> {
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf-8');
  const result: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    result[key] = value;
  }
  return result;
}

export function verifyVaultIntegrity(
  vaultPath: string,
  envPath: string
): VerifyResult[] {
  const vaultValues = parseVaultValues(vaultPath);
  const envValues = parseEnvValues(envPath);
  const allKeys = new Set([...Object.keys(vaultValues), ...Object.keys(envValues)]);
  const results: VerifyResult[] = [];
  for (const key of allKeys) {
    const vaultHash = vaultValues[key] ? hashValue(vaultValues[key]) : '(missing)';
    const envHash = envValues[key] ? hashValue(envValues[key]) : '(missing)';
    results.push({ key, vaultHash, envHash, match: vaultHash === envHash });
  }
  return results;
}

export function runVerify(vaultPath = VAULT_FILE, envPath = ENV_FILE): void {
  const results = verifyVaultIntegrity(vaultPath, envPath);
  if (results.length === 0) {
    console.log('No entries found in vault or .env file.');
    return;
  }
  let allMatch = true;
  for (const r of results) {
    const status = r.match ? '✔' : '✘';
    console.log(`${status} ${r.key}  vault=${r.vaultHash}  env=${r.envHash}`);
    if (!r.match) allMatch = false;
  }
  if (allMatch) {
    console.log('\nAll entries match.');
  } else {
    console.log('\nSome entries do not match. Run `envault decrypt` to sync.');
    process.exit(1);
  }
}
