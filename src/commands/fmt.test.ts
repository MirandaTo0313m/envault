import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { formatVaultFile, parseVaultLines, runFmt } from "./fmt";

function writeTmp(content: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "envault-fmt-"));
  const file = path.join(dir, ".env.vault");
  fs.writeFileSync(file, content, "utf-8");
  return file;
}

describe("parseVaultLines", () => {
  it("filters empty lines", () => {
    const lines = parseVaultLines("A=1\n\nB=2\n");
    expect(lines).toEqual(["A=1", "B=2"]);
  });
});

describe("formatVaultFile", () => {
  it("sorts keys alphabetically", () => {
    const input = "ZEBRA=1\nAPPLE=2\nMIDDLE=3\n";
    const output = formatVaultFile(input);
    const keys = output
      .trim()
      .split("\n")
      .map((l) => l.split("=")[0]);
    expect(keys).toEqual(["APPLE", "MIDDLE", "ZEBRA"]);
  });

  it("preserves comments at top", () => {
    const input = "# My vault\nB=2\nA=1\n";
    const output = formatVaultFile(input);
    expect(output.startsWith("# My vault")).toBe(true);
  });

  it("normalizes spacing around equals", () => {
    const input = "KEY = value\n";
    const output = formatVaultFile(input);
    expect(output).toContain("KEY=value");
  });

  it("ends with a newline", () => {
    const output = formatVaultFile("A=1\n");
    expect(output.endsWith("\n")).toBe(true);
  });
});

describe("runFmt", () => {
  it("formats an unformatted vault file in place", () => {
    const file = writeTmp("Z=last\nA=first\n");
    runFmt(file);
    const result = fs.readFileSync(file, "utf-8");
    expect(result.indexOf("A=first")).toBeLessThan(result.indexOf("Z=last"));
  });

  it("reports already-formatted file without writing", () => {
    const content = "A=1\nZ=2\n";
    const file = writeTmp(content);
    runFmt(file);
    expect(fs.readFileSync(file, "utf-8")).toBe(content);
  });

  it("exits with code 1 if file not found", () => {
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("exit");
    });
    expect(() => runFmt("/nonexistent/.env.vault")).toThrow("exit");
    exitSpy.mockRestore();
  });
});
