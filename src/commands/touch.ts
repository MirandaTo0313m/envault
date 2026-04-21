import * as fs from 'fs';
import * as path from 'path';
import { VAULT_FILE } from '../constants';

export interface TouchResult {
  key: string;
  existed: boolean;
  updatedAt: string;
}

export function parseVaultForTouch(
  content: string
): Map<string, string> {
  const entries = new Map<string, string>();
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    entries.set(key, value);
  }
  return entries;
}

export function touchKeyInVault(
  content: string,
  key: string,
  timestamp: string
): { content: string; existed: boolean } {
  const lines = content.split('\n');
  let existed = false;
  const metaTag = `# touched: ${timestamp}`;
  const updatedLines: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const lineKey = trimmed.slice(0, eqIdx).trim();
      if (lineKey === key) {
        existed = true;
        // Remove existing touched comment if present
        if (
          updatedLines.length > 0 &&
          updatedLines[updatedLines.length - 1].trim().startsWith('# touched:')
        ) {
          updatedLines.pop();
        }
        updatedLines.push(metaTag);
        updatedLines.push(line);
        i++;
        continue;
      }
    }
    updatedLines.push(line);
    i++;
  }

  if (!existed) {
    updatedLines.push(metaTag);
    updatedLines.push(`${key}=`);
  }

  return { content: updatedLines.join('\n'), existed };
}

export function runTouch(key: string, vaultPath: string = VAULT_FILE): TouchResult {
  if (!fs.existsSync(vaultPath)) {
    throw new Error(`Vault file not found: ${vaultPath}`);
  }

  const content = fs.readFileSync(vaultPath, 'utf-8');
  const timestamp = new Date().toISOString();
  const { content: updated, existed } = touchKeyInVault(content, key, timestamp);

  fs.writeFileSync(vaultPath, updated, 'utf-8');

  return { key, existed, updatedAt: timestamp };
}
