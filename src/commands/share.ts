import fs from 'fs';
import path from 'path';
import { encryptWithPublicKey } from '../crypto/encrypt';
import { loadPublicKey } from '../crypto/keyPair';
import { ENVAULT_DIR, ENCRYPTED_ENV_FILE } from '../constants';

export async function runShare(recipientPublicKeyPath: string, envFilePath: string = '.env'): Promise<void> {
  if (!fs.existsSync(envFilePath)) {
    console.error(`Error: ${envFilePath} not found.`);
    process.exit(1);
  }

  if (!fs.existsSync(recipientPublicKeyPath)) {
    console.error(`Error: Recipient public key not found at ${recipientPublicKeyPath}.`);
    process.exit(1);
  }

  const envContent = fs.readFileSync(envFilePath, 'utf-8');
  const recipientPublicKey = fs.readFileSync(recipientPublicKeyPath, 'utf-8');

  const encrypted = encryptWithPublicKey(envContent, recipientPublicKey);

  const outputFileName = `shared-${Date.now()}.env.enc`;
  const outputPath = path.join(ENVAULT_DIR, outputFileName);

  if (!fs.existsSync(ENVAULT_DIR)) {
    fs.mkdirSync(ENVAULT_DIR, { recursive: true });
  }

  fs.writeFileSync(outputPath, encrypted, 'utf-8');
  console.log(`✅ Encrypted env shared successfully: ${outputPath}`);
  console.log(`Share this file with the recipient so they can decrypt it with their private key.`);
}
