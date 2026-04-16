import * as fs from "fs";
import * as path from "path";

export interface RequireResult {
  key: string;
  present: boolean;
  hasValue: boolean;
}

export function parseRequiredKeys(requireFile: string): string[] {
  const content = fs.readFileSync(requireFile, "utf-8");
  return content
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
}

export function parseVaultKeys(vaultPath: string): Record<string, string> {
  if (!fs.existsSync(vaultPath)) return {};
  const content = fs.readFileSync(vaultPath, "utf-8");
  const result: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    result[key] = value;
  }
  return result;
}

export function checkRequirements(
  requiredKeys: string[],
  vaultKeys: Record<string, string>
): RequireResult[] {
  return requiredKeys.map((key) => ({
    key,
    present: key in vaultKeys,
    hasValue: !!(vaultKeys[key] && vaultKeys[key].length > 0),
  }));
}

export function runRequire(vaultPath: string, requireFile: string): void {
  if (!fs.existsSync(requireFile)) {
    console.error(`Require file not found: ${requireFile}`);
    process.exit(1);
  }
  const requiredKeys = parseRequiredKeys(requireFile);
  const vaultKeys = parseVaultKeys(vaultPath);
  const results = checkRequirements(requiredKeys, vaultKeys);

  let failed = false;
  for (const r of results) {
    if (!r.present) {
      console.log(`  MISSING   ${r.key}`);
      failed = true;
    } else if (!r.hasValue) {
      console.log(`  EMPTY     ${r.key}`);
      failed = true;
    } else {
      console.log(`  OK        ${r.key}`);
    }
  }

  if (failed) {
    console.error("\nSome required keys are missing or empty.");
    process.exit(1);
  } else {
    console.log("\nAll required keys are present.");
  }
}
