import * as fs from "fs";
import * as path from "path";
import { VAULT_FILE } from "../constants";

export interface VaultEntry {
  key: string;
  value: string;
  maxLength: number;
  truncated: boolean;
}

export function parseVaultForTruncate(
  content: string
): Array<{ key: string; value: string }> {
  return content
    .split("\n")
    .filter((line) => line.trim() && !line.startsWith("#"))
    .map((line) => {
      const eqIdx = line.indexOf("=");
      if (eqIdx === -1) return null;
      return {
        key: line.slice(0, eqIdx).trim(),
        value: line.slice(eqIdx + 1).trim(),
      };
    })
    .filter(Boolean) as Array<{ key: string; value: string }>;
}

export function truncateValues(
  entries: Array<{ key: string; value: string }>,
  maxLength: number
): VaultEntry[] {
  return entries.map(({ key, value }) => {
    const truncated = value.length > maxLength;
    return {
      key,
      value: truncated ? value.slice(0, maxLength) : value,
      maxLength,
      truncated,
    };
  });
}

export function serializeTruncatedVault(entries: VaultEntry[]): string {
  return entries.map(({ key, value }) => `${key}=${value}`).join("\n") + "\n";
}

export function runTruncate(
  vaultPath: string = VAULT_FILE,
  maxLength: number = 64
): void {
  if (!fs.existsSync(vaultPath)) {
    console.error(`Vault file not found: ${vaultPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(vaultPath, "utf-8");
  const entries = parseVaultForTruncate(content);
  const truncated = truncateValues(entries, maxLength);

  const affected = truncated.filter((e) => e.truncated);
  if (affected.length === 0) {
    console.log(`No values exceeded ${maxLength} characters. Nothing changed.`);
    return;
  }

  fs.writeFileSync(vaultPath, serializeTruncatedVault(truncated), "utf-8");
  console.log(
    `Truncated ${affected.length} value(s) to ${maxLength} characters:`
  );
  affected.forEach((e) => console.log(`  - ${e.key}`));
}
