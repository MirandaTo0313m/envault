import * as fs from 'fs';
import * as path from 'path';
import { decryptWithPrivateKey } from '../crypto/encrypt';
import { loadPrivateKey } from '../crypto/keyPair';

const DEFAULT_ENCRYPTED_FILE = '.env.vault';
const DEFAULT_OUTPUT_FILE = '.env';

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
