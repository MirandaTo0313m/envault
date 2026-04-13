import { execSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

function setup(content: string): { dir: string; envFile: string } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "envault-lint-int-"));
  const envFile = path.join(dir, ".env");
  fs.writeFileSync(envFile, content, "utf-8");
  return { dir, envFile };
}

const CLI = path.resolve(__dirname, "../dist/cli.js");

describe("cli lint integration", () => {
  it("exits 0 for a clean .env file", () => {
    const { envFile } = setup("API_KEY=abc\nDB_HOST=localhost\n");
    expect(() =>
      execSync(`node ${CLI} lint ${envFile}`, { stdio: "pipe" })
    ).not.toThrow();
  });

  it("exits non-zero for a file with errors", () => {
    const { envFile } = setup("BROKEN_LINE\n");
    expect(() =>
      execSync(`node ${CLI} lint ${envFile}`, { stdio: "pipe" })
    ).toThrow();
  });

  it("exits non-zero for duplicate keys", () => {
    const { envFile } = setup("KEY=one\nKEY=two\n");
    expect(() =>
      execSync(`node ${CLI} lint ${envFile}`, { stdio: "pipe" })
    ).toThrow();
  });

  it("exits 0 with only warnings (non-strict)", () => {
    const { envFile } = setup("lower_case=value\n");
    expect(() =>
      execSync(`node ${CLI} lint ${envFile}`, { stdio: "pipe" })
    ).not.toThrow();
  });
});
