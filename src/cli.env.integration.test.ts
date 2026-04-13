import { execSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

function setup() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "envault-env-int-"));
  const vaultFile = path.join(dir, "vault.env");
  // Write a plain-text vault (simulate already-decryptable values for integration)
  fs.writeFileSync(
    vaultFile,
    "# envault vault\nAPI_KEY=plaintextvalue\nDB_URL=postgres://localhost\n",
    "utf-8"
  );
  return { dir, vaultFile };
}

describe("cli env integration", () => {
  it("prints entries in plain format", () => {
    const { vaultFile } = setup();
    // We test parseVaultForEnv + formatEnvOutput directly since decryption
    // requires real keys; integration via module import
    const { parseVaultForEnv, formatEnvOutput } = require("./commands/env");
    const entries = parseVaultForEnv(vaultFile);
    const output = formatEnvOutput(entries, "plain");
    expect(output).toContain("API_KEY=plaintextvalue");
    expect(output).toContain("DB_URL=postgres://localhost");
  });

  it("prints entries in export format", () => {
    const { vaultFile } = setup();
    const { parseVaultForEnv, formatEnvOutput } = require("./commands/env");
    const entries = parseVaultForEnv(vaultFile);
    const output = formatEnvOutput(entries, "export");
    expect(output).toContain("export API_KEY=plaintextvalue");
    expect(output).toContain("export DB_URL=postgres://localhost");
  });

  it("skips comment lines in vault", () => {
    const { vaultFile } = setup();
    const { parseVaultForEnv } = require("./commands/env");
    const entries = parseVaultForEnv(vaultFile);
    const keys = entries.map((e: any) => e.key);
    expect(keys).not.toContain("# envault vault");
  });

  it("returns empty for empty vault", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "envault-env-empty-"));
    const vaultFile = path.join(dir, "vault.env");
    fs.writeFileSync(vaultFile, "", "utf-8");
    const { parseVaultForEnv } = require("./commands/env");
    const entries = parseVaultForEnv(vaultFile);
    expect(entries).toHaveLength(0);
  });
});
