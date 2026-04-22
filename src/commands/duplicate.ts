import * as fs from 'fs';
import * as path from 'path';

export function parseVaultForDuplicate(content: string): Map<string, string> {
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

export function duplicateKeyInVault(
  content: string,
  sourceKey: string,
  destKey: string
): string {
  const entries = parseVaultForDuplicate(content);
  if (!entries.has(sourceKey)) {
    throw new Error(`Key "${sourceKey}" not found in vault.`);
  }
  if (entries.has(destKey)) {
    throw new Error(`Key "${destKey}" already exists in vault.`);
  }
  const value = entries.get(sourceKey)!;
  const lines = content.split('\n');
  const result: string[] = [...lines];
  // Insert after the source key line, matching key= at start of trimmed line
  const srcIdx = lines.findIndex(l => {
    const trimmed = l.trim();
    return trimmed === `${sourceKey}=${value}` || trimmed.startsWith(`${sourceKey}=`);
  });
  if (srcIdx !== -1) {
    result.splice(srcIdx + 1, 0, `${destKey}=${value}`);
  } else {
    result.push(`${destKey}=${value}`);
  }
  return result.join('\n');
}

export function runDuplicate(
  vaultPath: string,
  sourceKey: string,
  destKey: string
): void {
  if (!fs.existsSync(vaultPath)) {
    console.error(`Vault file not found: ${vaultPath}`);
    process.exit(1);
  }
  const content = fs.readFileSync(vaultPath, 'utf-8');
  try {
    const updated = duplicateKeyInVault(content, sourceKey, destKey);
    fs.writeFileSync(vaultPath, updated, 'utf-8');
    console.log(`Duplicated "${sourceKey}" \u2192 "${destKey}"`);
  } catch (err: any) {
    console.error(err.message);
    process.exit(1);
  }
}
