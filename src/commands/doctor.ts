import * as fs from "fs";
import * as path from "path";
import { VAULT_FILE, PUBLIC_KEY_FILE, PRIVATE_KEY_FILE } from "../constants";

export interface DoctorCheck {
  name: string;
  passed: boolean;
  message: string;
}

export function runDoctorChecks(cwd: string = process.cwd()): DoctorCheck[] {
  const checks: DoctorCheck[] = [];

  // Check vault file exists
  const vaultPath = path.join(cwd, VAULT_FILE);
  const vaultExists = fs.existsSync(vaultPath);
  checks.push({
    name: "Vault file",
    passed: vaultExists,
    message: vaultExists
      ? `Found vault at ${VAULT_FILE}`
      : `No vault file found. Run 'envault init' to create one.`,
  });

  // Check public key exists
  const pubKeyPath = path.join(cwd, PUBLIC_KEY_FILE);
  const pubKeyExists = fs.existsSync(pubKeyPath);
  checks.push({
    name: "Public key",
    passed: pubKeyExists,
    message: pubKeyExists
      ? `Found public key at ${PUBLIC_KEY_FILE}`
      : `No public key found. Run 'envault init' to generate keys.`,
  });

  // Check private key exists
  const privKeyPath = path.join(cwd, PRIVATE_KEY_FILE);
  const privKeyExists = fs.existsSync(privKeyPath);
  checks.push({
    name: "Private key",
    passed: privKeyExists,
    message: privKeyExists
      ? `Found private key at ${PRIVATE_KEY_FILE}`
      : `No private key found. You may not be able to decrypt secrets.`,
  });

  // Check vault file is valid JSON (if it exists)
  if (vaultExists) {
    let vaultValid = false;
    let vaultMsg = "Vault file is valid JSON";
    try {
      const content = fs.readFileSync(vaultPath, "utf-8");
      JSON.parse(content);
      vaultValid = true;
    } catch {
      vaultMsg = "Vault file contains invalid JSON. It may be corrupted.";
    }
    checks.push({ name: "Vault integrity", passed: vaultValid, message: vaultMsg });
  }

  // Check .gitignore contains private key
  const gitignorePath = path.join(cwd, ".gitignore");
  let gitignoreOk = false;
  let gitignoreMsg = ".gitignore not found. Private key may be committed to version control.";
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, "utf-8");
    gitignoreOk = gitignoreContent.includes(PRIVATE_KEY_FILE);
    gitignoreMsg = gitignoreOk
      ? `${PRIVATE_KEY_FILE} is listed in .gitignore`
      : `${PRIVATE_KEY_FILE} is NOT in .gitignore. Add it to avoid leaking your private key.`;
  }
  checks.push({ name: ".gitignore safety", passed: gitignoreOk, message: gitignoreMsg });

  return checks;
}

export function runDoctor(cwd: string = process.cwd()): void {
  console.log("\n🩺 envault doctor\n");
  const checks = runDoctorChecks(cwd);
  let allPassed = true;

  for (const check of checks) {
    const icon = check.passed ? "✅" : "❌";
    console.log(`${icon}  ${check.name}: ${check.message}`);
    if (!check.passed) allPassed = false;
  }

  console.log("");
  if (allPassed) {
    console.log("All checks passed. Your envault setup looks healthy!");
  } else {
    console.log("Some checks failed. Please review the issues above.");
    process.exitCode = 1;
  }
}
