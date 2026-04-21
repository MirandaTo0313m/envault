import * as fs from 'fs';

export function parseVaultForRenameKey(content: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    map.set(key, value);
  }
  return map;
}

export function serializeRenamedVault(
  entries: Map<string, string>,
  lines: string[],
  oldKey: string,
  newKey: string
): string {
  return lines
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return line;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) return line;
      const key = trimmed.slice(0, eqIndex).trim();
      if (key === oldKey) {
        const value = trimmed.slice(eqIndex + 1).trim();
        return `${newKey}=${value}`;
      }
      return line;
    })
    .join('\n');
}

export function runRenameKey(
  vaultPath: string,
  oldKey: string,
  newKey: string
): void {
  if (!fs.existsSync(vaultPath)) {
    console.error(`Vault file not found: ${vaultPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(vaultPath, 'utf-8');
  const entries = parseVaultForRenameKey(content);

  if (!entries.has(oldKey)) {
    console.error(`Key "${oldKey}" not found in vault.`);
    process.exit(1);
  }

  if (entries.has(newKey)) {
    console.error(`Key "${newKey}" already exists in vault. Use --force to overwrite.`);
    process.exit(1);
  }

  const lines = content.split('\n');
  const updated = serializeRenamedVault(entries, lines, oldKey, newKey);
  fs.writeFileSync(vaultPath, updated, 'utf-8');
  console.log(`Renamed key "${oldKey}" to "${newKey}" in ${vaultPath}`);
}
