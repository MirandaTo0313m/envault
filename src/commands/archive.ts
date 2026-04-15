import * as fs from "fs";
import * as path from "path";
import { VAULT_FILE } from "../constants";

export interface ArchiveEntry {
  key: string;
  value: string;
  archivedAt: string;
}

const ARCHIVE_COMMENT_PREFIX = "#archived:";

export function parseArchivedEntries(vaultContent: string): ArchiveEntry[] {
  const entries: ArchiveEntry[] = [];
  const lines = vaultContent.split("\n");
  for (const line of lines) {
    if (line.startsWith(ARCHIVE_COMMENT_PREFIX)) {
      try {
        const json = line.slice(ARCHIVE_COMMENT_PREFIX.length).trim();
        entries.push(JSON.parse(json));
      } catch {
        // skip malformed lines
      }
    }
  }
  return entries;
}

export function archiveKeyInVault(vaultContent: string, key: string): string {
  const lines = vaultContent.split("\n");
  const remaining: string[] = [];
  let archived = false;

  for (const line of lines) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && match[1] === key) {
      const entry: ArchiveEntry = {
        key: match[1],
        value: match[2],
        archivedAt: new Date().toISOString(),
      };
      remaining.push(`${ARCHIVE_COMMENT_PREFIX}${JSON.stringify(entry)}`);
      archived = true;
    } else {
      remaining.push(line);
    }
  }

  if (!archived) {
    throw new Error(`Key "${key}" not found in vault.`);
  }

  return remaining.join("\n");
}

export function restoreKeyFromArchive(vaultContent: string, key: string): string {
  const lines = vaultContent.split("\n");
  const result: string[] = [];
  let restored = false;

  for (const line of lines) {
    if (line.startsWith(ARCHIVE_COMMENT_PREFIX)) {
      try {
        const entry: ArchiveEntry = JSON.parse(line.slice(ARCHIVE_COMMENT_PREFIX.length).trim());
        if (entry.key === key) {
          result.push(`${entry.key}=${entry.value}`);
          restored = true;
          continue;
        }
      } catch {
        // keep line as-is
      }
    }
    result.push(line);
  }

  if (!restored) {
    throw new Error(`Archived key "${key}" not found.`);
  }

  return result.join("\n");
}

export function runArchive(
  action: "archive" | "restore" | "list",
  key: string | undefined,
  vaultPath: string = VAULT_FILE
): void {
  if (!fs.existsSync(vaultPath)) {
    console.error("Vault file not found.");
    process.exit(1);
  }

  const content = fs.readFileSync(vaultPath, "utf-8");

  if (action === "list") {
    const entries = parseArchivedEntries(content);
    if (entries.length === 0) {
      console.log("No archived keys.");
    } else {
      entries.forEach((e) => console.log(`${e.key}  (archived: ${e.archivedAt})`));
    }
    return;
  }

  if (!key) {
    console.error("Key name is required.");
    process.exit(1);
  }

  try {
    const updated =
      action === "archive"
        ? archiveKeyInVault(content, key)
        : restoreKeyFromArchive(content, key);
    fs.writeFileSync(vaultPath, updated, "utf-8");
    console.log(action === "archive" ? `Archived "${key}".` : `Restored "${key}".`);
  } catch (err: any) {
    console.error(err.message);
    process.exit(1);
  }
}
