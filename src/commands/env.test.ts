import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { parseVaultForEnv, formatEnvOutput, EnvEntry } from "./env";

function writeTmp(content: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "envault-env-"));
  const file = path.join(dir, "vault.env");
  fs.writeFileSync(file, content, "utf-8");
  return file;
}

describe("parseVaultForEnv", () => {
  it("parses key=value lines", () => {
    const vault = writeTmp("API_KEY=abc123\nDB_PASS=secret\n");
    const entries = parseVaultForEnv(vault);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toEqual({ key: "API_KEY", value: "abc123" });
    expect(entries[1]).toEqual({ key: "DB_PASS", value: "secret" });
  });

  it("skips comment lines", () => {
    const vault = writeTmp("# comment\nAPI_KEY=abc\n");
    const entries = parseVaultForEnv(vault);
    expect(entries).toHaveLength(1);
    expect(entries[0].key).toBe("API_KEY");
  });

  it("skips blank lines", () => {
    const vault = writeTmp("\n\nFOO=bar\n\n");
    const entries = parseVaultForEnv(vault);
    expect(entries).toHaveLength(1);
  });

  it("handles values with = in them", () => {
    const vault = writeTmp("TOKEN=abc=def=ghi\n");
    const entries = parseVaultForEnv(vault);
    expect(entries[0].value).toBe("abc=def=ghi");
  });

  it("throws if vault file not found", () => {
    expect(() => parseVaultForEnv("/nonexistent/vault.env")).toThrow(
      "Vault file not found"
    );
  });
});

describe("formatEnvOutput", () => {
  const entries: EnvEntry[] = [
    { key: "FOO", value: "bar" },
    { key: "BAZ", value: "qux" },
  ];

  it("formats as plain key=value", () => {
    const output = formatEnvOutput(entries, "plain");
    expect(output).toBe("FOO=bar\nBAZ=qux");
  });

  it("formats with export prefix", () => {
    const output = formatEnvOutput(entries, "export");
    expect(output).toBe("export FOO=bar\nexport BAZ=qux");
  });

  it("returns empty string for empty entries", () => {
    expect(formatEnvOutput([], "plain")).toBe("");
  });
});
