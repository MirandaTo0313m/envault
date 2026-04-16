import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  parseVaultForTruncate,
  truncateValues,
  serializeTruncatedVault,
  runTruncate,
} from "./truncate";

function writeTmp(content: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "envault-truncate-"));
  const file = path.join(dir, ".env.vault");
  fs.writeFileSync(file, content, "utf-8");
  return file;
}

describe("parseVaultForTruncate", () => {
  it("parses key=value lines", () => {
    const result = parseVaultForTruncate("FOO=bar\nBAZ=qux\n");
    expect(result).toEqual([
      { key: "FOO", value: "bar" },
      { key: "BAZ", value: "qux" },
    ]);
  });

  it("ignores comment lines", () => {
    const result = parseVaultForTruncate("# comment\nFOO=bar");
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe("FOO");
  });

  it("ignores blank lines", () => {
    const result = parseVaultForTruncate("\nFOO=bar\n\n");
    expect(result).toHaveLength(1);
  });
});

describe("truncateValues", () => {
  it("truncates values exceeding maxLength", () => {
    const entries = [{ key: "FOO", value: "abcdefghij" }];
    const result = truncateValues(entries, 5);
    expect(result[0].value).toBe("abcde");
    expect(result[0].truncated).toBe(true);
  });

  it("leaves short values unchanged", () => {
    const entries = [{ key: "FOO", value: "abc" }];
    const result = truncateValues(entries, 10);
    expect(result[0].value).toBe("abc");
    expect(result[0].truncated).toBe(false);
  });

  it("handles exact-length values without truncation", () => {
    const entries = [{ key: "FOO", value: "abcde" }];
    const result = truncateValues(entries, 5);
    expect(result[0].truncated).toBe(false);
  });
});

describe("serializeTruncatedVault", () => {
  it("serializes entries back to env format", () => {
    const entries = [
      { key: "A", value: "1", maxLength: 64, truncated: false },
      { key: "B", value: "2", maxLength: 64, truncated: false },
    ];
    const output = serializeTruncatedVault(entries);
    expect(output).toBe("A=1\nB=2\n");
  });
});

describe("runTruncate", () => {
  it("truncates long values in vault file", () => {
    const file = writeTmp("SHORT=abc\nLONG=" + "x".repeat(100) + "\n");
    runTruncate(file, 10);
    const result = fs.readFileSync(file, "utf-8");
    expect(result).toContain("LONG=" + "x".repeat(10));
    expect(result).not.toContain("x".repeat(11));
  });

  it("does not modify file when no values exceed maxLength", () => {
    const content = "FOO=bar\nBAZ=qux\n";
    const file = writeTmp(content);
    runTruncate(file, 100);
    expect(fs.readFileSync(file, "utf-8")).toBe(content);
  });

  it("exits with error if vault file not found", () => {
    const spy = jest.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("exit");
    });
    expect(() => runTruncate("/nonexistent/.env.vault", 10)).toThrow("exit");
    spy.mockRestore();
  });
});
