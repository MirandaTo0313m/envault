import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { computeVaultStats } from "./stats";

function writeTmp(content: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "envault-stats-"));
  const file = path.join(dir, ".env.vault");
  fs.writeFileSync(file, content, "utf-8");
  return file;
}

describe("computeVaultStats", () => {
  it("returns zero counts for an empty vault", () => {
    const vaultPath = writeTmp("");
    const stats = computeVaultStats(vaultPath);
    expect(stats.totalKeys).toBe(0);
    expect(stats.taggedKeys).toBe(0);
    expect(stats.pinnedKeys).toBe(0);
    expect(stats.commentedKeys).toBe(0);
    expect(stats.groupedKeys).toBe(0);
    expect(stats.uniqueTags).toEqual([]);
    expect(stats.uniqueGroups).toEqual([]);
  });

  it("counts plain keys correctly", () => {
    const vaultPath = writeTmp("API_KEY=enc:abc\nDB_URL=enc:def\n");
    const stats = computeVaultStats(vaultPath);
    expect(stats.totalKeys).toBe(2);
    expect(stats.taggedKeys).toBe(0);
  });

  it("counts tagged keys and extracts unique tags", () => {
    const vaultPath = writeTmp(
      "API_KEY=enc:abc [tags:prod,staging]\nDB_URL=enc:def [tags:prod]\n"
    );
    const stats = computeVaultStats(vaultPath);
    expect(stats.taggedKeys).toBe(2);
    expect(stats.uniqueTags).toContain("prod");
    expect(stats.uniqueTags).toContain("staging");
    expect(stats.uniqueTags.length).toBe(2);
  });

  it("counts pinned keys", () => {
    const vaultPath = writeTmp("API_KEY=enc:abc [pinned]\nDB_URL=enc:def\n");
    const stats = computeVaultStats(vaultPath);
    expect(stats.pinnedKeys).toBe(1);
  });

  it("counts commented keys", () => {
    const vaultPath = writeTmp(
      "API_KEY=enc:abc [comment:important secret]\nDB_URL=enc:def\n"
    );
    const stats = computeVaultStats(vaultPath);
    expect(stats.commentedKeys).toBe(1);
  });

  it("counts grouped keys and extracts unique groups", () => {
    const vaultPath = writeTmp(
      "API_KEY=enc:abc [group:backend]\nDB_URL=enc:def [group:backend]\nFRONT=enc:ghi [group:frontend]\n"
    );
    const stats = computeVaultStats(vaultPath);
    expect(stats.groupedKeys).toBe(3);
    expect(stats.uniqueGroups).toContain("backend");
    expect(stats.uniqueGroups).toContain("frontend");
    expect(stats.uniqueGroups.length).toBe(2);
  });

  it("ignores comment lines", () => {
    const vaultPath = writeTmp("# this is a comment\nAPI_KEY=enc:abc\n");
    const stats = computeVaultStats(vaultPath);
    expect(stats.totalKeys).toBe(1);
  });

  it("throws when vault file does not exist", () => {
    expect(() => computeVaultStats("/nonexistent/path/.env.vault")).toThrow(
      "Vault file not found"
    );
  });

  it("reports vault size in bytes", () => {
    const content = "API_KEY=enc:abc\n";
    const vaultPath = writeTmp(content);
    const stats = computeVaultStats(vaultPath);
    expect(stats.vaultSizeBytes).toBe(Buffer.byteLength(content, "utf-8"));
  });

  it("reports last modified date", () => {
    const vaultPath = writeTmp("API_KEY=enc:abc\n");
    const stats = computeVaultStats(vaultPath);
    expect(stats.lastModified).toBeInstanceOf(Date);
  });
});
