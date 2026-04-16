import * as fs from 'fs';

export interface MaskedEntry {
  key: string;
  masked: string;
  original: string;
}

export function parseVaultForMask(content: string): MaskedEntry[] {
  const entries: MaskedEntry[] = [];
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    entries.push({ key, original: value, masked: maskValue(value) });
  }
  return entries;
}

export function maskValue(value: string, visibleChars = 4): string {
  if (value.length <= visibleChars) return '*'.repeat(value.length);
  return value.slice(0, visibleChars) + '*'.repeat(Math.min(value.length - visibleChars, 8));
}

export function formatMaskedOutput(entries: MaskedEntry[]): string {
  if (entries.length === 0) return 'No entries found.';
  const lines = entries.map(e => `${e.key}=${e.masked}`);
  return lines.join('\n');
}

export function runMask(vaultPath: string, options: { reveal?: string } = {}): void {
  if (!fs.existsSync(vaultPath)) {
    console.error(`Vault file not found: ${vaultPath}`);
    process.exit(1);
  }
  const content = fs.readFileSync(vaultPath, 'utf-8');
  const entries = parseVaultForMask(content);

  if (options.reveal) {
    const entry = entries.find(e => e.key === options.reveal);
    if (!entry) {
      console.error(`Key not found: ${options.reveal}`);
      process.exit(1);
    }
    console.log(`${entry.key}=${entry.original}`);
    return;
  }

  console.log(formatMaskedOutput(entries));
}
