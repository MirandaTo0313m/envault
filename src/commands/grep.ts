import * as fs from "fs";
import * as path from "path";
import { VAULT_FILE } from "../constants";

export interface GrepMatch {
  key: string;
  value: string;
  lineNumber: number;
}

export function parseVaultForGrep(
  content: string
): Array<{ key: string; value: string; lineNumber: number }> {
  const lines = content.split("\n");
  const entries: Array<{ key: string; value: string; lineNumber: number }> = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) return;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    entries.push({ key, value, lineNumber: index + 1 });
  });

  return entries;
}

export function grepVault(
  entries: Array<{ key: string; value: string; lineNumber: number }>,
  pattern: string,
  options: { keysOnly?: boolean; valuesOnly?: boolean; ignoreCase?: boolean } = {}
): GrepMatch[] {
  const flags = options.ignoreCase ? "i" : "";
  const regex = new RegExp(pattern, flags);

  return entries
    .filter(({ key, value }) => {
      if (options.keysOnly) return regex.test(key);
      if (options.valuesOnly) return regex.test(value);
      return regex.test(key) || regex.test(value);
    })
    .map(({ key, value, lineNumber }) => ({ key, value, lineNumber }));
}

export function runGrep(
  pattern: string,
  options: { keysOnly?: boolean; valuesOnly?: boolean; ignoreCase?: boolean; vaultPath?: string } = {}
): void {
  const vaultPath = options.vaultPath ?? path.resolve(process.cwd(), VAULT_FILE);

  if (!fs.existsSync(vaultPath)) {
    console.error("No vault file found. Run `envault init` first.");
    process.exit(1);
  }

  const content = fs.readFileSync(vaultPath, "utf-8");
  const entries = parseVaultForGrep(content);
  const matches = grepVault(entries, pattern, options);

  if (matches.length === 0) {
    console.log(`No matches found for pattern: ${pattern}`);
    return;
  }

  matches.forEach(({ key, value, lineNumber }) => {
    console.log(`[line ${lineNumber}] ${key}=${value}`);
  });
}
