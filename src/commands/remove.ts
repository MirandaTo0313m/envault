import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { ENV_VAULT_FILE } from "../constants";

export function removeFromVault(
  key: string,
  vaultPath: string = path.resolve(process.cwd(), ENV_VAULT_FILE)
): boolean {
  if (!fs.existsSync(vaultPath)) {
    throw new Error(`Vault file not found: ${vaultPath}`);
  }
  const raw = fs.readFileSync(vaultPath, "utf-8");
  const vault: Record<string, string> = JSON.parse(raw);

  if (!(key in vault)) {
    return false;
  }

  delete vault[key];
  fs.writeFileSync(vaultPath, JSON.stringify(vault, null, 2), "utf-8");
  return true;
}

async function confirm(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "y");
    });
  });
}

export async function runRemove(
  key: string,
  force: boolean = false
): Promise<void> {
  if (!key) {
    console.error("Error: key name is required.");
    process.exit(1);
  }

  if (!force) {
    const ok = await confirm(
      `Are you sure you want to remove "${key}" from the vault? (y/N): `
    );
    if (!ok) {
      console.log("Aborted.");
      return;
    }
  }

  try {
    const removed = removeFromVault(key);
    if (removed) {
      console.log(`Removed "${key}" from vault.`);
    } else {
      console.warn(`Key "${key}" not found in vault.`);
    }
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}
