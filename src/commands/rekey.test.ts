import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { parseVaultForRekey, serializeRekeyedVault, runRekey } from "./rekey";
import { generateKeyPair, saveKeyPair } from "../crypto/keyPair";
import { encryptWithPublicKey } from "../crypto/encrypt";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-rekey-"));
}

describe("parseVaultForRekey", () => {
  it("parses key=value lines", () => {
    const content = "FOO=enc1\nBAR=enc2\n";
    const entries = parseVaultForRekey(content);
    expect(entries).toHaveLength(2);
    expect(entries[0].key).toBe("FOO");
    expect(entries[1].key).toBe("BAR");
  });

  it("skips comment lines", () => {
    const content = "# comment\nFOO=enc1\n";
    const entries = parseVaultForRekey(content);
    expect(entries).toHaveLength(1);
  });

  it("skips blank lines", () => {
    const content = "\nFOO=enc1\n\n";
    const entries = parseVaultForRekey(content);
    expect(entries).toHaveLength(1);
  });
});

describe("serializeRekeyedVault", () => {
  it("serializes entries back to key=value format", () => {
    const entries = [
      { key: "FOO", encryptedValue: "abc", rest: "abc" },
      { key: "BAR", encryptedValue: "xyz", rest: "xyz" },
    ];
    const output = serializeRekeyedVault(entries);
    expect(output).toBe("FOO=abc\nBAR=xyz\n");
  });
});

describe("runRekey", () => {
  it("re-encrypts vault entries with a new public key", async () => {
    const tmpDir = makeTmpDir();
    const oldKeyDir = path.join(tmpDir, "old");
    const newKeyDir = path.join(tmpDir, "new");
    fs.mkdirSync(oldKeyDir);
    fs.mkdirSync(newKeyDir);

    const oldPair = generateKeyPair();
    saveKeyPair(oldPair, oldKeyDir);

    const newPair = generateKeyPair();
    saveKeyPair(newPair, newKeyDir);

    const vaultPath = path.join(tmpDir, "vault.env.enc");
    const enc1 = encryptWithPublicKey("secret1", oldPair.publicKey);
    const enc2 = encryptWithPublicKey("secret2", oldPair.publicKey);
    fs.writeFileSync(vaultPath, `FOO=${enc1}\nBAR=${enc2}\n`, "utf-8");

    const oldPrivPath = path.join(oldKeyDir, "envault.private.pem");
    const newPubPath = path.join(newKeyDir, "envault.public.pem");

    await runRekey(vaultPath, oldPrivPath, newPubPath);

    const updated = fs.readFileSync(vaultPath, "utf-8");
    expect(updated).toContain("FOO=");
    expect(updated).toContain("BAR=");
    // Ensure values changed
    expect(updated).not.toContain(enc1);
    expect(updated).not.toContain(enc2);
  });

  it("throws if vault file does not exist", async () => {
    await expect(
      runRekey("/no/vault.env.enc", "/no/priv.pem", "/no/pub.pem")
    ).rejects.toThrow("Vault file not found");
  });
});
