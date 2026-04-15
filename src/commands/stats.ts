import * as fs from "fs";
import * as path from "path";
import { VAULT_FILE } from "../constants";

export interface VaultStats {
  totalKeys: number;
  taggedKeys: number;
  pinnedKeys: number;
  commentedKeys: number;
  groupedKeys: number;
  uniqueTags: string[];
  uniqueGroups: string[];
  vaultSizeBytes: number;
  lastModified: Date | null;
}

export function computeVaultStats(vaultPath: string): VaultStats {
  if (!fs.existsSync(vaultPath)) {
    throw new Error(`Vault file not found: ${vaultPath}`);
  }

  const raw = fs.readFileSync(vaultPath, "utf-8");
  const stat = fs.statSync(vaultPath);
  const lines = raw.split("\n");

  let totalKeys = 0;
  let taggedKeys = 0;
  let pinnedKeys = 0;
  let commentedKeys = 0;
  let groupedKeys = 0;
  const tagsSet = new Set<string>();
  const groupsSet = new Set<string>();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    if (!trimmed.includes("=")) continue;

    totalKeys++;

    const tagMatch = trimmed.match(/\[tags?:([^\]]+)\]/);
    if (tagMatch) {
      taggedKeys++;
      tagMatch[1].split(",").map((t) => t.trim()).forEach((t) => tagsSet.add(t));
    }

    if (trimmed.includes("[pinned]")) {
      pinnedKeys++;
    }

    if (trimmed.includes("[comment:")) {
      commentedKeys++;
    }

    const groupMatch = trimmed.match(/\[group:([^\]]+)\]/);
    if (groupMatch) {
      groupedKeys++;
      groupsSet.add(groupMatch[1].trim());
    }
  }

  return {
    totalKeys,
    taggedKeys,
    pinnedKeys,
    commentedKeys,
    groupedKeys,
    uniqueTags: Array.from(tagsSet),
    uniqueGroups: Array.from(groupsSet),
    vaultSizeBytes: stat.size,
    lastModified: stat.mtime,
  };
}

export function runStats(vaultPath: string = VAULT_FILE): void {
  const stats = computeVaultStats(vaultPath);

  console.log("\n📊 Vault Statistics");
  console.log("─────────────────────────────");
  console.log(`  Total keys      : ${stats.totalKeys}`);
  console.log(`  Tagged keys     : ${stats.taggedKeys}`);
  console.log(`  Pinned keys     : ${stats.pinnedKeys}`);
  console.log(`  Commented keys  : ${stats.commentedKeys}`);
  console.log(`  Grouped keys    : ${stats.groupedKeys}`);
  console.log(`  Unique tags     : ${stats.uniqueTags.length > 0 ? stats.uniqueTags.join(", ") : "none"}`);
  console.log(`  Unique groups   : ${stats.uniqueGroups.length > 0 ? stats.uniqueGroups.join(", ") : "none"}`);
  console.log(`  Vault size      : ${stats.vaultSizeBytes} bytes`);
  console.log(`  Last modified   : ${stats.lastModified ? stats.lastModified.toISOString() : "unknown"}`);
  console.log("");
}
