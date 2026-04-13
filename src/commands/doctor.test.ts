import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { runDoctorChecks } from "./doctor";
import { VAULT_FILE, PUBLIC_KEY_FILE, PRIVATE_KEY_FILE } from "../constants";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-doctor-"));
}

describe("runDoctorChecks", () => {
  it("reports all failures in an empty directory", () => {
    const dir = makeTmpDir();
    const checks = runDoctorChecks(dir);

    const vaultCheck = checks.find((c) => c.name === "Vault file")!;
    expect(vaultCheck.passed).toBe(false);

    const pubCheck = checks.find((c) => c.name === "Public key")!;
    expect(pubCheck.passed).toBe(false);

    const privCheck = checks.find((c) => c.name === "Private key")!;
    expect(privCheck.passed).toBe(false);

    const gitCheck = checks.find((c) => c.name === ".gitignore safety")!;
    expect(gitCheck.passed).toBe(false);
  });

  it("passes vault file check when vault exists", () => {
    const dir = makeTmpDir();
    fs.writeFileSync(path.join(dir, VAULT_FILE), JSON.stringify({}));
    const checks = runDoctorChecks(dir);
    const vaultCheck = checks.find((c) => c.name === "Vault file")!;
    expect(vaultCheck.passed).toBe(true);
  });

  it("flags vault integrity failure on invalid JSON", () => {
    const dir = makeTmpDir();
    fs.writeFileSync(path.join(dir, VAULT_FILE), "not-valid-json{{{");
    const checks = runDoctorChecks(dir);
    const integrityCheck = checks.find((c) => c.name === "Vault integrity")!;
    expect(integrityCheck.passed).toBe(false);
  });

  it("passes vault integrity check on valid JSON", () => {
    const dir = makeTmpDir();
    fs.writeFileSync(path.join(dir, VAULT_FILE), JSON.stringify({ entries: [] }));
    const checks = runDoctorChecks(dir);
    const integrityCheck = checks.find((c) => c.name === "Vault integrity")!;
    expect(integrityCheck.passed).toBe(true);
  });

  it("passes public and private key checks when files exist", () => {
    const dir = makeTmpDir();
    fs.writeFileSync(path.join(dir, PUBLIC_KEY_FILE), "pubkey");
    fs.writeFileSync(path.join(dir, PRIVATE_KEY_FILE), "privkey");
    const checks = runDoctorChecks(dir);
    expect(checks.find((c) => c.name === "Public key")!.passed).toBe(true);
    expect(checks.find((c) => c.name === "Private key")!.passed).toBe(true);
  });

  it("passes .gitignore safety check when private key is listed", () => {
    const dir = makeTmpDir();
    fs.writeFileSync(path.join(dir, ".gitignore"), `${PRIVATE_KEY_FILE}\n.env\n`);
    const checks = runDoctorChecks(dir);
    const gitCheck = checks.find((c) => c.name === ".gitignore safety")!;
    expect(gitCheck.passed).toBe(true);
  });

  it("fails .gitignore safety check when private key is not listed", () => {
    const dir = makeTmpDir();
    fs.writeFileSync(path.join(dir, ".gitignore"), ".env\nnode_modules\n");
    const checks = runDoctorChecks(dir);
    const gitCheck = checks.find((c) => c.name === ".gitignore safety")!;
    expect(gitCheck.passed).toBe(false);
  });
});
