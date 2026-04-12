import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { getVaultInfo, runInfo } from "./info";
import { VAULT_FILE, PUBLIC_KEY_FILE, PRIVATE_KEY_FILE } from "../constants";

describe("getVaultInfo", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "envault-info-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns false for all keys when directory is empty", () => {
    const info = getVaultInfo(tmpDir);
    expect(info.vaultExists).toBe(false);
    expect(info.publicKeyExists).toBe(false);
    expect(info.privateKeyExists).toBe(false);
    expect(info.entryCount).toBe(0);
    expect(info.vaultSizeBytes).toBe(0);
    expect(info.lastModified).toBeNull();
  });

  it("detects existing vault and counts entries", () => {
    const vaultContent = "KEY:FOO\nVALUE:encryptedA\nKEY:BAR\nVALUE:encryptedB\n";
    fs.writeFileSync(path.join(tmpDir, VAULT_FILE), vaultContent);

    const info = getVaultInfo(tmpDir);
    expect(info.vaultExists).toBe(true);
    expect(info.entryCount).toBe(2);
    expect(info.vaultSizeBytes).toBeGreaterThan(0);
    expect(info.lastModified).toBeInstanceOf(Date);
  });

  it("detects public and private key files", () => {
    fs.writeFileSync(path.join(tmpDir, PUBLIC_KEY_FILE), "pubkey");
    fs.writeFileSync(path.join(tmpDir, PRIVATE_KEY_FILE), "privkey");

    const info = getVaultInfo(tmpDir);
    expect(info.publicKeyExists).toBe(true);
    expect(info.privateKeyExists).toBe(true);
  });

  it("reports zero backups when none exist", () => {
    const info = getVaultInfo(tmpDir);
    expect(info.backupCount).toBe(0);
  });
});

describe("runInfo", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "envault-info-run-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("prints info without throwing", () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    expect(() => runInfo(tmpDir)).not.toThrow();
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("envault info"));
    spy.mockRestore();
  });
});
