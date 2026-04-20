import fs from "fs";
import path from "path";
import { VAULT_FILE, ENV_FILE } from "../constants";

/**
 * Represents a single entry parsed from the vault file.
 */
export interface DefaultEntry {
  key: string;
  value: string;
  hasDefault: boolean;
  defaultValue: string;
}

/**
 * Parse vault file lines, extracting keys and their encrypted values.
 * Lines beginning with '#' or empty lines are skipped.
 */
export function parseVaultForDefaults(content: string): DefaultEntry[] {
  const entries: DefaultEntry[] = [];
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    entries.push({ key, value, hasDefault: false, defaultValue: "" });
  }
  return entries;
}

/**
 * Set a default value for a key in the vault file.
 * Default values are stored as inline comments: KEY=VALUE # default:DEFAULTVALUE
 */
export function setDefault(
  entries: DefaultEntry[],
  key: string,
  defaultValue: string
): DefaultEntry[] {
  const idx = entries.findIndex((e) => e.key === key);
  if (idx === -1) {
    throw new Error(`Key "${key}" not found in vault.`);
  }
  return entries.map((e, i) =>
    i === idx ? { ...e, hasDefault: true, defaultValue } : e
  );
}

/**
 * Remove a default value from a key entry.
 */
export function removeDefault(
  entries: DefaultEntry[],
  key: string
): DefaultEntry[] {
  const idx = entries.findIndex((e) => e.key === key);
  if (idx === -1) {
    throw new Error(`Key "${key}" not found in vault.`);
  }
  return entries.map((e, i) =>
    i === idx ? { ...e, hasDefault: false, defaultValue: "" } : e
  );
}

/**
 * Serialize entries back to vault file format, preserving default annotations.
 */
export function serializeVaultWithDefaults(entries: DefaultEntry[]): string {
  return (
    entries
      .map((e) => {
        const base = `${e.key}=${e.value}`;
        return e.hasDefault ? `${base} # default:${e.defaultValue}` : base;
      })
      .join("\n") + "\n"
  );
}

/**
 * List all keys that have a default value set.
 */
export function listDefaults(entries: DefaultEntry[]): DefaultEntry[] {
  return entries.filter((e) => e.hasDefault);
}

/**
 * Main runner for the `default` command.
 * Supports: set, remove, list sub-actions.
 */
export async function runDefault(
  action: "set" | "remove" | "list",
  key?: string,
  defaultValue?: string,
  vaultPath: string = VAULT_FILE
): Promise<void> {
  if (!fs.existsSync(vaultPath)) {
    console.error(`Vault file not found: ${vaultPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(vaultPath, "utf-8");
  let entries = parseVaultForDefaults(content);

  if (action === "list") {
    const defaults = listDefaults(entries);
    if (defaults.length === 0) {
      console.log("No default values set.");
    } else {
      console.log("Keys with default values:");
      for (const e of defaults) {
        console.log(`  ${e.key} => ${e.defaultValue}`);
      }
    }
    return;
  }

  if (!key) {
    console.error("A key name is required for this action.");
    process.exit(1);
  }

  if (action === "set") {
    if (!defaultValue) {
      console.error("A default value is required for the set action.");
      process.exit(1);
    }
    entries = setDefault(entries, key, defaultValue);
    console.log(`Default for "${key}" set to "${defaultValue}".`);
  } else if (action === "remove") {
    entries = removeDefault(entries, key);
    console.log(`Default for "${key}" removed.`);
  }

  fs.writeFileSync(vaultPath, serializeVaultWithDefaults(entries), "utf-8");
}
