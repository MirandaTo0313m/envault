import { parseVaultForGrep, grepVault, runGrep } from "./grep";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const sampleVault = `# vault file
DB_HOST=localhost
DB_PORT=5432
API_KEY=secret123
APP_NAME=myapp
DEBUG=false
`;

function writeTmp(content: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "envault-grep-"));
  const file = path.join(dir, ".env.vault");
  fs.writeFileSync(file, content, "utf-8");
  return file;
}

describe("parseVaultForGrep", () => {
  it("parses key-value pairs with line numbers", () => {
    const entries = parseVaultForGrep(sampleVault);
    expect(entries.length).toBe(5);
    expect(entries[0]).toEqual({ key: "DB_HOST", value: "localhost", lineNumber: 2 });
  });

  it("skips comments and blank lines", () => {
    const entries = parseVaultForGrep(sampleVault);
    const keys = entries.map((e) => e.key);
    expect(keys).not.toContain("#");
  });
});

describe("grepVault", () => {
  const entries = parseVaultForGrep(sampleVault);

  it("matches by key pattern", () => {
    const matches = grepVault(entries, "DB_");
    expect(matches.map((m) => m.key)).toEqual(["DB_HOST", "DB_PORT"]);
  });

  it("matches by value pattern", () => {
    const matches = grepVault(entries, "localhost");
    expect(matches[0].key).toBe("DB_HOST");
  });

  it("respects keysOnly option", () => {
    const matches = grepVault(entries, "secret", { keysOnly: true });
    expect(matches.length).toBe(0);
  });

  it("respects valuesOnly option", () => {
    const matches = grepVault(entries, "secret", { valuesOnly: true });
    expect(matches[0].key).toBe("API_KEY");
  });

  it("respects ignoreCase option", () => {
    const matches = grepVault(entries, "myapp", { ignoreCase: true });
    expect(matches.length).toBe(1);
  });

  it("returns empty array when no matches", () => {
    const matches = grepVault(entries, "NONEXISTENT");
    expect(matches).toEqual([]);
  });
});

describe("runGrep", () => {
  it("prints matches to stdout", () => {
    const vaultPath = writeTmp(sampleVault);
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    runGrep("DB_", { vaultPath });
    expect(spy).toHaveBeenCalledTimes(2);
    spy.mockRestore();
  });

  it("prints no-match message when nothing found", () => {
    const vaultPath = writeTmp(sampleVault);
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    runGrep("ZZZNOPE", { vaultPath });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("No matches"));
    spy.mockRestore();
  });
});
