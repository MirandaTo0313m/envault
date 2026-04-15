import * as fs from "fs";
import * as path from "path";
import { loadPublicKey, loadPrivateKey } from "../crypto/keyPair";
import { encryptWithPublicKey, decryptWithPrivateKey } from "../crypto/encrypt";
import { VAULT_FILE } from "../constants";
import { assertUnlocked } from "../utils/assertUnlocked";

export interface VaultEntry {
  key: string;
  encryptedValue: string;
  rest: string;
}

export function parseVaultForRekey(content: string): VaultEntry[] {
  return content
    .split("\n")
    .filter((line) => line.trim() && !line.startsWith("#"))
    .map((line) => {
      const eqIndex = line.indexOf("=");
      if (eqIndex === -1) return null;
      const key = line.slice(0, eqIndex).trim();
      const rest = line.slice(eqIndex + 1).trim();
      return { key, encryptedValue: rest, rest };
    })
    .filter(Boolean) as VaultEntry[];
}

export function serializeRekeyedVault(entries: VaultEntry[]): string {
  return entries.map((e) => `${e.key}=${e.encryptedValue}`).join("\n") + "\n";
}

export async function runRekey(
  vaultPath: string,
  oldPrivateKeyPath: string,
  newPublicKeyPath: string
): Promise<void> {
  assertUnlocked(vaultPath);

  if (!fs.existsSync(vaultPath)) {
    throw new Error(`Vault file not found: ${vaultPath}`);
  }
  if (!fs.existsSync(oldPrivateKeyPath)) {
    throw new Error(`Old private key not found: ${oldPrivateKeyPath}`);
  }
  if (!fs.existsSync(newPublicKeyPath)) {
    throw new Error(`New public key not found: ${newPublicKeyPath}`);
  }

  const oldPrivateKey = loadPrivateKey(oldPrivateKeyPath);
  const newPublicKey = loadPublicKey(newPublicKeyPath);

  const content = fs.readFileSync(vaultPath, "utf-8");
  const entries = parseVaultForRekey(content);

  const rekeyed: VaultEntry[] = [];
  for (const entry of entries) {
    const decrypted = decryptWithPrivateKey(entry.encryptedValue, oldPrivateKey);
    const reencrypted = encryptWithPublicKey(decrypted, newPublicKey);
    rekeyed.push({ ...entry, encryptedValue: reencrypted });
  }

  const output = serializeRekeyedVault(rekeyed);
  fs.writeFileSync(vaultPath, output, "utf-8");

  console.log(`✔ Re-keyed ${rekeyed.length} entries in ${path.basename(vaultPath)}`);
}
