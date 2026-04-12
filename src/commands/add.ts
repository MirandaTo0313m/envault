import fs from "fs";
import path from "path";
import readline from "readline";
import { ENV_FILE, ENCRYPTED_FILE } from "../constants";
import { loadPublicKey } from "../crypto/keyPair";
import { encryptWithPublicKey } from "../crypto/encrypt";

function promptUser(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function parseEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};
  const lines = fs.readFileSync(filePath, "utf-8").split("\n");
  const result: Record<string, string> = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    result[key] = value;
  }
  return result;
}

function writeEnvFile(filePath: string, vars: Record<string, string>): void {
  const lines = Object.entries(vars).map(([k, v]) => `${k}=${v}`);
  fs.writeFileSync(filePath, lines.join("\n") + "\n", "utf-8");
}

export async function runAdd(key?: string, value?: string): Promise<void> {
  const envKey = key ?? (await promptUser("Enter variable name: "));
  const envValue = value ?? (await promptUser(`Enter value for ${envKey}: `));

  if (!envKey || !/^[A-Z_][A-Z0-9_]*$/i.test(envKey)) {
    console.error("❌ Invalid variable name. Use letters, digits, and underscores.");
    process.exit(1);
  }

  // Update plain .env
  const envPath = path.resolve(process.cwd(), ENV_FILE);
  const vars = parseEnvFile(envPath);
  vars[envKey] = envValue;
  writeEnvFile(envPath, vars);
  console.log(`✅ Added ${envKey} to ${ENV_FILE}`);

  // Re-encrypt if encrypted file exists
  const encryptedPath = path.resolve(process.cwd(), ENCRYPTED_FILE);
  if (fs.existsSync(encryptedPath)) {
    try {
      const publicKey = loadPublicKey();
      const encrypted = encryptWithPublicKey(publicKey, JSON.stringify(vars));
      fs.writeFileSync(encryptedPath, encrypted, "utf-8");
      console.log(`🔒 Re-encrypted ${ENCRYPTED_FILE} with updated variable.`);
    } catch (err) {
      console.warn("⚠️  Could not re-encrypt: public key not found.");
    }
  }
}
