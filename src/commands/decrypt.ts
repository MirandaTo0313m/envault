import * as fs from 'fs';
import * as path from 'path';
import { decryptWithPrivateKey } from '../crypto/encrypt';
import { loadPrivateKey } from '../crypto/keyPair';

const DEFAULT_ENCRYPTED_FILE = '.env.vault';
const DEFAULT_OUTPUT_FILE = '.env';

/**
 * Decrypts an encrypted vault file and writes the plaintext output to disk.
 *
 * @param encryptedFilePath - Path to the encrypted `.env.vault` file (default: `.env.vault`)
 * @param outputFilePath - Path where the decrypted `.env` file will be written (default: `.env`)
 * @param privateKeyPath - Optional path to the private key file; falls back to the default key location
 * @throws {Error} If the encrypted file is missing, the private key cannot be loaded,
 *                 the file format is invalid, or decryption fails
 */
export async function runDecrypt(
  encryptedFilePath: string = DEFAULT_ENCRYPTED_FILE,
  outputFilePath: string = DEFAULT_OUTPUT_FILE,
  privateKeyPath?: string
): Promise<void> {
  const resolvedEncrypted = path.resolve(process.cwd(), encryptedFilePath);
  const resolvedOutput = path.resolve(process.cwd(), outputFilePath);

  if (!fs.existsSync(resolvedEncrypted)) {
    throw new Error(`Encrypted file not found: ${resolvedEncrypted}`);
  }

  let privateKey: string;
  try {
    privateKey = await loadPrivateKey(privateKeyPath);
  } catch (err) {
    throw new Error(
      `Failed to load private key: ${(err as Error).message}. Run 'envault init' first.`
    );
  }

  const encryptedContent = fs.readFileSync(resolvedEncrypted, 'utf-8');

  let encryptedData: { data: string; key: string; iv: string };
  try {
    encryptedData = JSON.parse(encryptedContent);
  } catch {
    throw new Error(`Invalid encrypted file format: ${resolvedEncrypted}`);
  }

  if (!encryptedData.data || !encryptedData.key || !encryptedData.iv) {
    throw new Error(
      `Encrypted file is missing required fields (data, key, iv): ${resolvedEncrypted}`
    );
  }

  let decrypted: string;
  try {
    decrypted = decryptWithPrivateKey(
      encryptedData.data,
      encryptedData.key,
      encryptedData.iv,
      privateKey
    );
  } catch (err) {
    throw new Error(
      `Decryption failed. Ensure you have the correct private key. ${(err as Error).message}`
    );
  }

  fs.writeFileSync(resolvedOutput, decrypted, 'utf-8');
  console.log(`✅ Decrypted ${encryptedFilePath} → ${outputFilePath}`);
}
