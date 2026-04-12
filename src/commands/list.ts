import * as fs from "fs";
import * as path from "path";
import { ENV_VAULT_FILE, ENV_FILE } from "../constants";
import { loadPrivateKey } from "../crypto/keyPair";
import { decryptWithPrivateKey } from "../crypto/encrypt";

export interface EnvEntry {
  key: string;
  value: string;
}

export function parseVaultFile(vaultPath: string): Record<string, string> {
  if (!fs.existsSync(vaultPath)) {
    throw new Error(`Vault file not found: ${vaultPath}`);
  }
  const raw = fs.readFileSync(vaultPath, "utf-8");
  return JSON.parse(raw);
}

export async function runList(
  showValues: boolean = false,
  vaultFile: string = ENV_VAULT_FILE
): Promise<void> {
  const vaultPath = path.resolve(process.cwd(), vaultFile);

  let encrypted: Record<string, string>;
  try {
    encrypted = parseVaultFile(vaultPath);
  } catch (err: any) {
    console.error(`Error reading vault file: ${err.message}`);
    process.exit(1);
  }

  const keys = Object.keys(encrypted);
  if (keys.length === 0) {
    console.log("No variables stored in vault.");
    return;
  }

  if (!showValues) {
    console.log(`Stored variables (${keys.length}):`);
    keys.forEach((key) => console.log(`  - ${key}`));
    return;
  }

  let privateKey: string;
  try {
    privateKey = loadPrivateKey();
  } catch (err: any) {
    console.error(`Error loading private key: ${err.message}`);
    process.exit(1);
  }

  console.log(`Stored variables (${keys.length}):`);
  for (const key of keys) {
    const value = decryptWithPrivateKey(encrypted[key], privateKey);
    console.log(`  ${key}=${value}`);
  }
}
