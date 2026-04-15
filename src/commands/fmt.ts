import * as fs from "fs";

/**
 * Formats a .env.vault file by sorting keys alphabetically,
 * normalizing spacing, and ensuring consistent formatting.
 */
export function parseVaultLines(content: string): string[] {
  return content.split("\n").filter((line) => line.trim() !== "");
}

export function formatVaultFile(content: string): string {
  const lines = parseVaultLines(content);
  const comments: string[] = [];
  const entries: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#")) {
      comments.push(trimmed);
    } else if (trimmed.includes("=")) {
      const eqIdx = trimmed.indexOf("=");
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      entries.push(`${key}=${value}`);
    }
  }

  entries.sort((a, b) => {
    const keyA = a.split("=")[0];
    const keyB = b.split("=")[0];
    return keyA.localeCompare(keyB);
  });

  const result: string[] = [];
  if (comments.length > 0) {
    result.push(...comments, "");
  }
  result.push(...entries);

  return result.join("\n") + "\n";
}

export function runFmt(vaultPath: string, checkOnly: boolean = false): void {
  if (!fs.existsSync(vaultPath)) {
    console.error(`Vault file not found: ${vaultPath}`);
    process.exit(1);
  }

  const original = fs.readFileSync(vaultPath, "utf-8");
  const formatted = formatVaultFile(original);

  if (original === formatted) {
    console.log("Vault file is already formatted.");
    return;
  }

  if (checkOnly) {
    console.error("Vault file is not formatted. Run `envault fmt` to fix.");
    process.exit(1);
  }

  fs.writeFileSync(vaultPath, formatted, "utf-8");
  console.log(`Formatted vault file: ${vaultPath}`);
}
