import * as fs from "fs";
import * as path from "path";
import { KEYS_DIR, PUBLIC_KEY_FILE } from "../constants";

export interface WhoamiInfo {
  publicKeyPath: string;
  publicKeyFingerprint: string;
  keysDir: string;
  initialized: boolean;
}

export function computeFingerprint(publicKeyPem: string): string {
  const body = publicKeyPem
    .replace(/-----BEGIN PUBLIC KEY-----/, "")
    .replace(/-----END PUBLIC KEY-----/, "")
    .replace(/\s+/g, "");
  const buf = Buffer.from(body, "base64");
  const { createHash } = require("crypto");
  const hash: string = createHash("sha256").update(buf).digest("hex");
  return hash
    .match(/.{1,4}/g)!
    .slice(0, 8)
    .join(":");
}

export function getWhoamiInfo(baseDir: string = process.cwd()): WhoamiInfo {
  const keysDir = path.join(baseDir, KEYS_DIR);
  const publicKeyPath = path.join(keysDir, PUBLIC_KEY_FILE);
  const initialized = fs.existsSync(publicKeyPath);

  if (!initialized) {
    return {
      publicKeyPath,
      publicKeyFingerprint: "(not initialized)",
      keysDir,
      initialized: false,
    };
  }

  const publicKeyPem = fs.readFileSync(publicKeyPath, "utf-8");
  const publicKeyFingerprint = computeFingerprint(publicKeyPem);

  return {
    publicKeyPath,
    publicKeyFingerprint,
    keysDir,
    initialized: true,
  };
}

export function runWhoami(baseDir: string = process.cwd()): void {
  const info = getWhoamiInfo(baseDir);

  if (!info.initialized) {
    console.log("envault is not initialized in this directory.");
    console.log(`Run 'envault init' to generate your key pair.`);
    return;
  }

  console.log("envault identity:");
  console.log(`  Keys directory : ${info.keysDir}`);
  console.log(`  Public key     : ${info.publicKeyPath}`);
  console.log(`  Fingerprint    : ${info.publicKeyFingerprint}`);
}
