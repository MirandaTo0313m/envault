import { generateKeyPairSync, KeyPairSyncResult } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface EnvaultKeyPair {
  publicKey: string;
  privateKey: string;
}

export function generateKeyPair(): EnvaultKeyPair {
  const { publicKey, privateKey }: KeyPairSyncResult<string, string> = generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  return { publicKey, privateKey };
}

export function saveKeyPair(
  keyPair: EnvaultKeyPair,
  outputDir: string = process.cwd()
): { publicKeyPath: string; privateKeyPath: string } {
  const publicKeyPath = path.join(outputDir, 'envault_public.pem');
  const privateKeyPath = path.join(outputDir, 'envault_private.pem');

  fs.writeFileSync(publicKeyPath, keyPair.publicKey, { encoding: 'utf8', mode: 0o644 });
  fs.writeFileSync(privateKeyPath, keyPair.privateKey, { encoding: 'utf8', mode: 0o600 });

  return { publicKeyPath, privateKeyPath };
}

export function loadPublicKey(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Public key file not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

export function loadPrivateKey(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Private key file not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}
