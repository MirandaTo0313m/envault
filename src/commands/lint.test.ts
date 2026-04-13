import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { lintEnvFile } from "./lint";

function writeTmp(content: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "envault-lint-"));
  const file = path.join(dir, ".env");
  fs.writeFileSync(file, content, "utf-8");
  return file;
}

describe("lintEnvFile", () => {
  it("returns no issues for a clean env file", () => {
    const file = writeTmp("API_KEY=abc123\nDB_HOST=localhost\n");
    const result = lintEnvFile(file);
    expect(result.issues).toHaveLength(0);
    expect(result.valid).toBe(true);
  });

  it("warns about lowercase keys", () => {
    const file = writeTmp("api_key=abc123\n");
    const result = lintEnvFile(file);
    const warn = result.issues.find(i => i.key === "api_key");
    expect(warn).toBeDefined();
    expect(warn?.severity).toBe("warning");
    expect(result);
  });

  it("errors on missing equals sign", () => {
    const file = writeTmp("BROKEN_LINE\n");
    const result);
    expect(result.issues[0].severity).toBe("error");
    expect(result.valid).toBe(false);
  });

  it("errors on duplicate keys", () => {
    const file = writeTmp("API_KEY=one\nAPI_KEY=two\n");
    const result = lintEnvFile(file);
    const dupe = result.issues.find(i => i.message.includes("Duplicate"));
    expect(dupe).toBeDefined();
    expect(dupe?.severity).toBe("error");
    expect(result.valid).toBe(false);
  });

  it("warns about empty values", () => {
    const file = writeTmp("SECRET=\n");
    const result = lintEnvFile(file);
    const warn = result.issues.find(i => i.message.includes("empty value"));
    expect(warn).toBeDefined();
    expect(warn?.severity).toBe("warning");
    expect(result.valid).toBe(true);
  });

  it("ignores comments and blank lines", () => {
    const file = writeTmp("# comment\n\nAPI_KEY=val\n");
    const result = lintEnvFile(file);
    expect(result.issues).toHaveLength(0);
  });
});
