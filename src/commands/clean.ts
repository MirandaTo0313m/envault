import * as fs from "fs";
import * as path from "path";
import { VAULT_FILE } from "../constants";

export interface CleanResult {
  removed: string[];
  kept: number;
}

export function parseVaultForClean(content: string): Map<string, string> {
  const entries = new Map<string, string>();
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    entries.set(key, value);
  }
  return entries;
}

export function findEmptyKeys(entries: Map<string, string>): string[] {
  const empty: string[] = [];
  for (const [key, value] of entries) {
    if (value === "" || value === '""' || value === "''") {
      empty.push(key);
    }
  }
  return empty;
}

export function removeKeysFromVault(content: string, keysToRemove: string[]): string {
  const keySet = new Set(keysToRemove);
  const lines = content.split("\n");
  const result: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      result.push(line);
      continue;
    }
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) {
      result.push(line);
      continue;
    }
    const key = trimmed.slice(0, eqIdx).trim();
    if (!keySet.has(key)) {
      result.push(line);
    }
  }
  return result.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

export function runClean(vaultPath: string = VAULT_FILE, dryRun = false): CleanResult {
  if (!fs.existsSync(vaultPath)) {
    throw new Error(`Vault file not found: ${vaultPath}`);
  }

  const content = fs.readFileSync(vaultPath, "utf-8");
  const entries = parseVaultForClean(content);
  const emptyKeys = findEmptyKeys(entries);

  if (emptyKeys.length === 0) {
    return { removed: [], kept: entries.size };
  }

  if (!dryRun) {
    const cleaned = removeKeysFromVault(content, emptyKeys);
    fs.writeFileSync(vaultPath, cleaned, "utf-8");
  }

  return {
    removed: emptyKeys,
    kept: entries.size - emptyKeys.length,
  };
}
