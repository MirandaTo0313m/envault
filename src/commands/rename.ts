import * as fs from "fs";
import * as path from "path";
import { VAULT_FILE } from "../constants";

export function renameKeyInVault(
  vaultPath: string,
  oldKey: string,
  newKey: string
): void {
  if (!fs.existsSync(vaultPath)) {
    throw new Error(`Vault file not found: ${vaultPath}`);
  }

  const lines = fs.readFileSync(vaultPath, "utf-8").split("\n");
  let found = false;

  // Check if newKey already exists in the vault to prevent duplicates
  const newKeyExists = lines.some((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("#") || !trimmed.includes("=")) return false;
    const key = trimmed.substring(0, trimmed.indexOf("=")).trim();
    return key === newKey;
  });

  if (newKeyExists) {
    throw new Error(`Key "${newKey}" already exists in vault.`);
  }

  const updated = lines.map((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("#") || !trimmed.includes("=")) return line;
    const eqIndex = trimmed.indexOf("=");
    const key = trimmed.substring(0, eqIndex).trim();
    if (key === oldKey) {
      found = true;
      const value = line.substring(line.indexOf("=") + 1);
      return `${newKey}=${value}`;
    }
    return line;
  });

  if (!found) {
    throw new Error(`Key "${oldKey}" not found in vault.`);
  }

  fs.writeFileSync(vaultPath, updated.join("\n"), "utf-8");
}

export function runRename(
  oldKey: string,
  newKey: string,
  vaultPath: string = VAULT_FILE
): void {
  if (!oldKey || !newKey) {
    console.error("Usage: envault rename <OLD_KEY> <NEW_KEY>");
    process.exit(1);
  }

  if (oldKey === newKey) {
    console.error("Old key and new key must be different.");
    process.exit(1);
  }

  try {
    renameKeyInVault(vaultPath, oldKey, newKey);
    console.log(`Renamed "${oldKey}" to "${newKey}" in vault.`);
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}
