import * as fs from "fs";
import * as path from "path";
import { VAULT_FILE, PUBLIC_KEY_FILE, PRIVATE_KEY_FILE } from "../constants";
import { listKeyBackups } from "../crypto/keyBackup";

export interface VaultInfo {
  vaultExists: boolean;
  publicKeyExists: boolean;
  privateKeyExists: boolean;
  entryCount: number;
  backupCount: number;
  vaultSizeBytes: number;
  lastModified: Date | null;
}

export function getVaultInfo(baseDir: string = process.cwd()): VaultInfo {
  const vaultPath = path.join(baseDir, VAULT_FILE);
  const publicKeyPath = path.join(baseDir, PUBLIC_KEY_FILE);
  const privateKeyPath = path.join(baseDir, PRIVATE_KEY_FILE);

  const vaultExists = fs.existsSync(vaultPath);
  const publicKeyExists = fs.existsSync(publicKeyPath);
  const privateKeyExists = fs.existsSync(privateKeyPath);

  let entryCount = 0;
  let vaultSizeBytes = 0;
  let lastModified: Date | null = null;

  if (vaultExists) {
    const stat = fs.statSync(vaultPath);
    vaultSizeBytes = stat.size;
    lastModified = stat.mtime;

    const content = fs.readFileSync(vaultPath, "utf-8");
    const lines = content.split("\n").filter((l) => l.trim().startsWith("KEY:"));
    entryCount = lines.length;
  }

  const backups = listKeyBackups(baseDir);
  const backupCount = backups.length;

  return {
    vaultExists,
    publicKeyExists,
    privateKeyExists,
    entryCount,
    backupCount,
    vaultSizeBytes,
    lastModified,
  };
}

export function runInfo(baseDir: string = process.cwd()): void {
  const info = getVaultInfo(baseDir);

  console.log("=== envault info ===");
  console.log(`Vault file:      ${info.vaultExists ? "✔ found" : "✘ missing"}`);
  console.log(`Public key:      ${info.publicKeyExists ? "✔ found" : "✘ missing"}`);
  console.log(`Private key:     ${info.privateKeyExists ? "✔ found" : "✘ missing"}`);
  console.log(`Entries:         ${info.entryCount}`);
  console.log(`Vault size:      ${info.vaultSizeBytes} bytes`);
  console.log(`Key backups:     ${info.backupCount}`);
  console.log(
    `Last modified:   ${
      info.lastModified ? info.lastModified.toISOString() : "N/A"
    }`
  );
}
