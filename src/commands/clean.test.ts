import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  parseVaultForClean,
  findEmptyKeys,
  removeKeysFromVault,
  runClean,
} from "./clean";

function writeTmp(content: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "envault-clean-"));
  const file = path.join(dir, ".env.vault");
  fs.writeFileSync(file, content, "utf-8");
  return file;
}

describe("parseVaultForClean", () => {
  it("parses key-value pairs", () => {
    const entries = parseVaultForClean("FOO=bar\nBAZ=qux\n");
    expect(entries.get("FOO")).toBe("bar");
    expect(entries.get("BAZ")).toBe("qux");
  });

  it("ignores comments and blank lines", () => {
    const entries = parseVaultForClean("# comment\n\nFOO=bar\n");
    expect(entries.size).toBe(1);
  });
});

describe("findEmptyKeys", () => {
  it("finds keys with empty values", () => {
    const entries = new Map([["A", ""], ["B", "val"], ["C", '""'], ["D", "''"]]);
    expect(findEmptyKeys(entries)).toEqual(["A", "C", "D"]);
  });

  it("returns empty array when no empty keys", () => {
    const entries = new Map([["A", "hello"], ["B", "world"]]);
    expect(findEmptyKeys(entries)).toEqual([]);
  });
});

describe("removeKeysFromVault", () => {
  it("removes specified keys from vault content", () => {
    const content = "FOO=bar\nEMPTY=\nBAZ=qux\n";
    const result = removeKeysFromVault(content, ["EMPTY"]);
    expect(result).not.toContain("EMPTY");
    expect(result).toContain("FOO=bar");
    expect(result).toContain("BAZ=qux");
  });

  it("preserves comments", () => {
    const content = "# my comment\nFOO=bar\nEMPTY=\n";
    const result = removeKeysFromVault(content, ["EMPTY"]);
    expect(result).toContain("# my comment");
  });
});

describe("runClean", () => {
  it("removes empty keys and returns result", () => {
    const file = writeTmp("FOO=bar\nEMPTY=\nBAZ=\n");
    const result = runClean(file);
    expect(result.removed).toEqual(expect.arrayContaining(["EMPTY", "BAZ"]));
    expect(result.kept).toBe(1);
    const content = fs.readFileSync(file, "utf-8");
    expect(content).not.toContain("EMPTY");
    expect(content).toContain("FOO=bar");
  });

  it("dry run does not modify file", () => {
    const file = writeTmp("FOO=bar\nEMPTY=\n");
    const result = runClean(file, true);
    expect(result.removed).toContain("EMPTY");
    const content = fs.readFileSync(file, "utf-8");
    expect(content).toContain("EMPTY=");
  });

  it("throws if vault file not found", () => {
    expect(() => runClean("/nonexistent/.env.vault")).toThrow("Vault file not found");
  });

  it("returns empty removed list when no empty keys", () => {
    const file = writeTmp("FOO=bar\nBAZ=qux\n");
    const result = runClean(file);
    expect(result.removed).toHaveLength(0);
    expect(result.kept).toBe(2);
  });
});
