import * as fs from 'fs';
import * as path from 'path';
import { loadPublicKey } from '../crypto/keyPair';
import { encryptWithPublicKey } from '../crypto/encrypt';

const DEFAULT_ENV_FILE = '.env';
const DEFAULT_OUTPUT_FILE = '.env.vault';

export interface EncryptOptions {
  envFile?: string;
  output?: string;
  publicKeyPath?: string;
}

/**
 * Reads a .env file, encrypts its contents with the local public key,
 * and writes the result to a .env.vault file.
 */
export function runEncrypt(options: EncryptOptions = {}): void {
  const envFile = options.envFile ?? DEFAULT_ENV_FILE;
  const outputFile = options.output ?? DEFAULT_OUTPUT_FILE;
  const publicKeyPath = options.publicKeyPath;

  if (!fs.existsSync(envFile)) {
    console.error(`Error: env file not found at "${envFile}".`);
    process.exit(1);
  }

  let publicKeyPem: string;
  try {
    publicKeyPem = loadPublicKey(publicKeyPath);
  } catch {
    console.error(
      'Error: public key not found. Run `envault init` first.'
    );
    process.exit(1);
  }

  const envContent = fs.readFileSync(envFile, 'utf8');

  if (envContent.trim().length === 0) {
    console.warn(`Warning: "${envFile}" is empty. Nothing to encrypt.`);
    return;
  }

  const encrypted = encryptWithPublicKey(envContent, publicKeyPem);

  fs.writeFileSync(outputFile, encrypted, 'utf8');
  console.log(`✔ Encrypted "${envFile}" → "${outputFile}"`);
}
