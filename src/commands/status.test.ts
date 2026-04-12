import fs from "fs";
import path from "path";
import os from "os";
import { getVaultStatus, runStatus } from "./status";

describe("getVaultStatus", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "envault-status-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns all false when directory is empty", () => {
    const status = getVaultStatus(tmpDir);
    expect(status.vaultExists).toBe(false);
    expect(status.envExists).toBe(false);
    expect(status.publicKeyExists).toBe(false);
    expect(status.privateKeyExists).toBe(false);
    expect(status.vaultEntryCount).toBe(0);
    expect(status.envEntryCount).toBe(0);
    expect(status.inSync).toBe(false);
  });

  it("detects vault file and counts entries", () => {
    const vault = { KEY1: "encrypted1", KEY2: "encrypted2" };
    fs.writeFileSync(path.join(tmpDir, ".env.vault"), JSON.stringify(vault));
    const status = getVaultStatus(tmpDir);
    expect(status.vaultExists).toBe(true);
    expect(status.vaultEntryCount).toBe(2);
  });

  it("detects .env file and counts entries", () => {
    const envContent = "# comment\nKEY1=value1\nKEY2=value2\n\nKEY3=value3";
    fs.writeFileSync(path.join(tmpDir, ".env"), envContent);
    const status = getVaultStatus(tmpDir);
    expect(status.envExists).toBe(true);
    expect(status.envEntryCount).toBe(3);
  });

  it("reports inSync when vault and env have same entry count", () => {
    const vault = { KEY1: "enc1", KEY2: "enc2" };
    fs.writeFileSync(path.join(tmpDir, ".env.vault"), JSON.stringify(vault));
    fs.writeFileSync(path.join(tmpDir, ".env"), "KEY1=val1\nKEY2=val2");
    const status = getVaultStatus(tmpDir);
    expect(status.inSync).toBe(true);
  });

  it("reports out of sync when counts differ", () => {
    const vault = { KEY1: "enc1", KEY2: "enc2", KEY3: "enc3" };
    fs.writeFileSync(path.join(tmpDir, ".env.vault"), JSON.stringify(vault));
    fs.writeFileSync(path.join(tmpDir, ".env"), "KEY1=val1");
    const status = getVaultStatus(tmpDir);
    expect(status.inSync).toBe(false);
  });

  it("handles malformed vault JSON gracefully", () => {
    fs.writeFileSync(path.join(tmpDir, ".env.vault"), "not-valid-json");
    const status = getVaultStatus(tmpDir);
    expect(status.vaultExists).toBe(true);
    expect(status.vaultEntryCount).toBe(0);
  });
});

describe("runStatus", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "envault-status-run-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("runs without throwing", () => {
    expect(() => runStatus(tmpDir)).not.toThrow();
  });
});
