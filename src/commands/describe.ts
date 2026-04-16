import * as fs from 'fs';

export interface VaultEntry {
  key: string;
  value: string;
  description: string;
}

export function parseVaultWithDescriptions(content: string): VaultEntry[] {
  const entries: VaultEntry[] = [];
  const lines = content.split('\n');
  let pendingDescription = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('## ')) {
      pendingDescription = trimmed.slice(3).trim();
    } else if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim();
        entries.push({ key, value, description: pendingDescription });
        pendingDescription = '';
      }
    } else if (!trimmed.startsWith('##')) {
      pendingDescription = '';
    }
  }
  return entries;
}

export function setDescription(content: string, key: string, description: string): string {
  const lines = content.split('\n');
  const result: string[] = [];
  let found = false;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1 && trimmed.slice(0, eqIdx).trim() === key) {
      if (i > 0 && lines[i - 1].trim().startsWith('## ')) {
        result[result.length - 1] = `## ${description}`;
      } else {
        result.push(`## ${description}`);
      }
      result.push(lines[i]);
      found = true;
    } else {
      result.push(lines[i]);
    }
  }

  if (!found) {
    throw new Error(`Key "${key}" not found in vault.`);
  }

  return result.join('\n');
}

export function runDescribe(vaultPath: string, key: string, description: string): void {
  if (!fs.existsSync(vaultPath)) {
    console.error(`Vault file not found: ${vaultPath}`);
    process.exit(1);
  }
  const content = fs.readFileSync(vaultPath, 'utf-8');
  try {
    const updated = setDescription(content, key, description);
    fs.writeFileSync(vaultPath, updated, 'utf-8');
    console.log(`Description set for "${key}".`);
  } catch (err: any) {
    console.error(err.message);
    process.exit(1);
  }
}
