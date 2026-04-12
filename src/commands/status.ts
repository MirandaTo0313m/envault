import fs from "fs";
import path from "path";
import chalk from "chalk";
import { VAULT_FILE, ENV_FILE, PUBLIC_KEY_FILE, PRIVATE_KEY_FILE } from "../constants";

export interface VaultStatus {
  vaultExists: boolean;
  envExists: boolean;
  publicKeyExists: boolean;
  privateKeyExists: boolean;
  vaultEntryCount: number;
  envEntryCount: number;
  inSync: boolean;
}

export function getVaultStatus(cwd: string = process.cwd()): VaultStatus {
  const vaultPath = path.join(cwd, VAULT_FILE);
  const envPath = path.join(cwd, ENV_FILE);
  const publicKeyPath = path.join(cwd, PUBLIC_KEY_FILE);
  const privateKeyPath = path.join(cwd, PRIVATE_KEY_FILE);

  const vaultExists = fs.existsSync(vaultPath);
  const envExists = fs.existsSync(envPath);
  const publicKeyExists = fs.existsSync(publicKeyPath);
  const privateKeyExists = fs.existsSync(privateKeyPath);

  let vaultEntryCount = 0;
  let envEntryCount = 0;

  if (vaultExists) {
    try {
      const vaultContent = JSON.parse(fs.readFileSync(vaultPath, "utf-8"));
      vaultEntryCount = Object.keys(vaultContent).length;
    } catch {
      vaultEntryCount = 0;
    }
  }

  if (envExists) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    envEntryCount = envContent
      .split("\n")
      .filter((line) => line.trim() && !line.startsWith("#") && line.includes("="))
      .length;
  }

  const inSync = vaultExists && envExists && vaultEntryCount === envEntryCount;

  return {
    vaultExists,
    envExists,
    publicKeyExists,
    privateKeyExists,
    vaultEntryCount,
    envEntryCount,
    inSync,
  };
}

export function runStatus(cwd: string = process.cwd()): void {
  const status = getVaultStatus(cwd);

  console.log(chalk.bold("\nEnvault Status\n"));

  console.log(
    status.publicKeyExists
      ? chalk.green("  ✔ Public key found")
      : chalk.red("  ✘ Public key missing")
  );
  console.log(
    status.privateKeyExists
      ? chalk.green("  ✔ Private key found")
      : chalk.yellow("  ⚠ Private key missing (cannot decrypt)")
  );
  console.log(
    status.vaultExists
      ? chalk.green(`  ✔ Vault file found (${status.vaultEntryCount} entries)`)
      : chalk.red("  ✘ Vault file missing — run 'envault init'")
  );
  console.log(
    status.envExists
      ? chalk.green(`  ✔ .env file found (${status.envEntryCount} entries)`)
      : chalk.yellow("  ⚠ .env file missing — run 'envault decrypt'")
  );

  if (status.vaultExists && status.envExists) {
    console.log(
      status.inSync
        ? chalk.green("  ✔ Vault and .env appear in sync")
        : chalk.yellow(
            `  ⚠ Entry count mismatch (vault: ${status.vaultEntryCount}, .env: ${status.envEntryCount})`
          )
    );
  }

  console.log("");
}
