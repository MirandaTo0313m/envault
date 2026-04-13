import * as fs from "fs";
import * as path from "path";
import { VAULT_FILE } from "../constants";
import { loadPrivateKey } from "../crypto/keyPair";
import { decryptWithPrivateKey } from "../crypto/encrypt";
import { assertUnlocked } from "../utils/assertUnlocked";

export interface EnvEntry {
  key: string;
  value: string;
}

export function parseVaultForEnv(vaultPath: string): EnvEntry[] {
  if (!fs.existsSync(vaultPath)) {
    throw new Error(`Vault file not found: ${vaultPath}`);
  }
  const lines = fs.readFileSync(vaultPath, "utf-8").split("\n");
  const entries: EnvEntry[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (key) entries.push({ key, value });
  }
  return entries;
}

export function formatEnvOutput(
  entries: EnvEntry[],
  format: "export" | "plain"
): string {
  return entries
    .map((e) =>
      format === "export" ? `export ${e.key}=${e.value}` : `${e.key}=${e.value}`
    )
    .join("\n");
}

export async function runEnv(
  vaultPath: string = VAULT_FILE,
  format: "export" | "plain" = "plain"
): Promise<void> {
  assertUnlocked(vaultPath);

  const privateKey = loadPrivateKey();
  const entries = parseVaultForEnv(vaultPath);
  const decrypted: EnvEntry[] = [];

  for (const entry of entries) {
    try {
      const value = decryptWithPrivateKey(entry.value, privateKey);
      decrypted.push({ key: entry.key, value });
    } catch {
      // skip entries that can't be decrypted
    }
  }

  if (decrypted.length === 0) {
    console.log("No decryptable entries found in vault.");
    return;
  }

  console.log(formatEnvOutput(decrypted, format));
}
