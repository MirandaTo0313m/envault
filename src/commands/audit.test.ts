import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { runAudit, parseKeysFromVault, parseKeysFromEnv } from "./audit";
import { VAULT_FILE, ENV_FILE } from "../constants";

describe("parseKeysFromVault", () => {
  it("returns empty array if vault does not exist", () => {
    expect(parseKeysFromVault("/nonexistent/path/.vault.json")).toEqual([]);
  });

  it("returns keys from a valid vault JSON", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "envault-"));
    const vaultPath = path.join(tmpDir, VAULT_FILE);
    fs.writeFileSync(vaultPath, JSON.stringify({ API_KEY: "enc1", DB_URL: "enc2" }));
    expect(parseKeysFromVault(vaultPath)).toEqual(["API_KEY", "DB_URL"]);
    fs.rmSync(tmpDir, { recursive: true });
  });
});

describe("parseKeysFromEnv", () => {
  it("returns empty array if .env does not exist", () => {
    expect(parseKeysFromEnv("/nonexistent/.env")).toEqual([]);
  });

  it("parses keys from a valid .env file", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "envault-"));
    const envPath = path.join(tmpDir, ENV_FILE);
    fs.writeFileSync(envPath, "API_KEY=abc\n# comment\nDB_URL=postgres\n");
    expect(parseKeysFromEnv(envPath)).toEqual(["API_KEY", "DB_URL"]);
    fs.rmSync(tmpDir, { recursive: true });
  });
});

describe("runAudit", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "envault-audit-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  it("reports inSync when vault and env have the same keys", () => {
    fs.writeFileSync(path.join(tmpDir, VAULT_FILE), JSON.stringify({ FOO: "enc" }));
    fs.writeFileSync(path.join(tmpDir, ENV_FILE), "FOO=bar\n");
    const result = runAudit(tmpDir);
    expect(result.inSync).toBe(true);
    expect(result.missingInEnv).toEqual([]);
    expect(result.missingInVault).toEqual([]);
  });

  it("detects keys missing in env", () => {
    fs.writeFileSync(path.join(tmpDir, VAULT_FILE), JSON.stringify({ FOO: "enc", BAR: "enc2" }));
    fs.writeFileSync(path.join(tmpDir, ENV_FILE), "FOO=bar\n");
    const result = runAudit(tmpDir);
    expect(result.inSync).toBe(false);
    expect(result.missingInEnv).toContain("BAR");
  });

  it("detects keys missing in vault", () => {
    fs.writeFileSync(path.join(tmpDir, VAULT_FILE), JSON.stringify({ FOO: "enc" }));
    fs.writeFileSync(path.join(tmpDir, ENV_FILE), "FOO=bar\nSECRET=xyz\n");
    const result = runAudit(tmpDir);
    expect(result.inSync).toBe(false);
    expect(result.missingInVault).toContain("SECRET");
  });
});
