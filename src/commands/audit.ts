import * as fs from "fs";
import * as path from "path";
import { VAULT_FILE, ENV_FILE } from "../constants";

export interface AuditResult {
  vaultExists: boolean;
  envExists: boolean;
  vaultKeys: string[];
  envKeys: string[];
  missingInEnv: string[];
  missingInVault: string[];
  inSync: boolean;
}

export function parseKeysFromVault(vaultPath: string): string[] {
  if (!fs.existsSync(vaultPath)) return [];
  const raw = fs.readFileSync(vaultPath, "utf-8");
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  return Object.keys(parsed);
}

export function parseKeysFromEnv(envPath: string): string[] {
  if (!fs.existsSync(envPath)) return [];
  const raw = fs.readFileSync(envPath, "utf-8");
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => line.split("=")[0].trim());
}

export function runAudit(cwd: string = process.cwd()): AuditResult {
  const vaultPath = path.join(cwd, VAULT_FILE);
  const envPath = path.join(cwd, ENV_FILE);

  const vaultExists = fs.existsSync(vaultPath);
  const envExists = fs.existsSync(envPath);

  const vaultKeys = parseKeysFromVault(vaultPath);
  const envKeys = parseKeysFromEnv(envPath);

  const missingInEnv = vaultKeys.filter((k) => !envKeys.includes(k));
  const missingInVault = envKeys.filter((k) => !vaultKeys.includes(k));
  const inSync = missingInEnv.length === 0 && missingInVault.length === 0;

  if (!vaultExists) {
    console.warn("⚠️  No vault file found. Run `envault init` first.");
  }

  if (inSync && vaultExists && envExists) {
    console.log("✅ Vault and .env are in sync.");
  } else {
    if (missingInEnv.length > 0) {
      console.log(`🔑 Keys in vault but missing from .env: ${missingInEnv.join(", ")}`);
    }
    if (missingInVault.length > 0) {
      console.log(`📝 Keys in .env but missing from vault: ${missingInVault.join(", ")}`);
    }
  }

  return { vaultExists, envExists, vaultKeys, envKeys, missingInEnv, missingInVault, inSync };
}
