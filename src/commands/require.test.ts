import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  parseRequiredKeys,
  parseVaultKeys,
  checkRequirements,
} from "./require";

function writeTmp(name: string, content: string): string {
  const p = path.join(os.tmpdir(), `envault-require-${Date.now()}-${name}`);
  fs.writeFileSync(p, content);
  return p;
}

describe("parseRequiredKeys", () => {
  it("parses keys from a require file", () => {
    const f = writeTmp("req.txt", "API_KEY\nDB_URL\n# comment\nSECRET\n");
    expect(parseRequiredKeys(f)).toEqual(["API_KEY", "DB_URL", "SECRET"]);
  });

  it("ignores blank lines", () => {
    const f = writeTmp("req2.txt", "\nFOO\n\nBAR\n");
    expect(parseRequiredKeys(f)).toEqual(["FOO", "BAR"]);
  });
});

describe("parseVaultKeys", () => {
  it("parses key=value pairs", () => {
    const f = writeTmp("vault.env", "API_KEY=abc123\nDB_URL=postgres://localhost\n");
    const result = parseVaultKeys(f);
    expect(result["API_KEY"]).toBe("abc123");
    expect(result["DB_URL"]).toBe("postgres://localhost");
  });

  it("returns empty object if vault missing", () => {
    expect(parseVaultKeys("/nonexistent/path.env")).toEqual({});
  });

  it("ignores comment lines", () => {
    const f = writeTmp("vault2.env", "# comment\nFOO=bar\n");
    expect(parseVaultKeys(f)).toEqual({ FOO: "bar" });
  });
});

describe("checkRequirements", () => {
  it("marks present and valued keys as ok", () => {
    const results = checkRequirements(["FOO"], { FOO: "bar" });
    expect(results[0]).toEqual({ key: "FOO", present: true, hasValue: true });
  });

  it("marks missing keys", () => {
    const results = checkRequirements(["MISSING"], {});
    expect(results[0]).toEqual({ key: "MISSING", present: false, hasValue: false });
  });

  it("marks empty keys", () => {
    const results = checkRequirements(["EMPTY"], { EMPTY: "" });
    expect(results[0]).toEqual({ key: "EMPTY", present: true, hasValue: false });
  });
});
