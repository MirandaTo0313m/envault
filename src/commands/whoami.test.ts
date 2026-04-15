import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { getWhoamiInfo, computeFingerprint, runWhoami } from "./whoami";
import { generateKeyPair, saveKeyPair } from "../crypto/keyPair";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-whoami-"));
}

describe("computeFingerprint", () => {
  it("returns a colon-separated hex fingerprint", async () => {
    const { publicKey } = await generateKeyPair();
    const fp = computeFingerprint(publicKey);
    expect(fp).toMatch(/^[0-9a-f]{4}(:[0-9a-f]{4}){7}$/);
  });

  it("produces the same fingerprint for the same key", async () => {
    const { publicKey } = await generateKeyPair();
    expect(computeFingerprint(publicKey)).toBe(computeFingerprint(publicKey));
  });

  it("produces different fingerprints for different keys", async () => {
    const kp1 = await generateKeyPair();
    const kp2 = await generateKeyPair();
    expect(computeFingerprint(kp1.publicKey)).not.toBe(
      computeFingerprint(kp2.publicKey)
    );
  });
});

describe("getWhoamiInfo", () => {
  it("returns initialized=false when keys dir does not exist", () => {
    const tmpDir = makeTmpDir();
    const info = getWhoamiInfo(tmpDir);
    expect(info.initialized).toBe(false);
    expect(info.publicKeyFingerprint).toBe("(not initialized)");
  });

  it("returns initialized=true and a valid fingerprint after init", async () => {
    const tmpDir = makeTmpDir();
    const kp = await generateKeyPair();
    await saveKeyPair(kp, tmpDir);
    const info = getWhoamiInfo(tmpDir);
    expect(info.initialized).toBe(true);
    expect(info.publicKeyFingerprint).toMatch(/^[0-9a-f]{4}(:[0-9a-f]{4}){7}$/);
  });
});

describe("runWhoami", () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("prints not-initialized message when no keys exist", () => {
    const tmpDir = makeTmpDir();
    runWhoami(tmpDir);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("not initialized")
    );
  });

  it("prints fingerprint when initialized", async () => {
    const tmpDir = makeTmpDir();
    const kp = await generateKeyPair();
    await saveKeyPair(kp, tmpDir);
    runWhoami(tmpDir);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Fingerprint")
    );
  });
});
