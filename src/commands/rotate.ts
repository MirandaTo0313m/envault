import fs from "fs";
import path from "path";
import { generateKeyPair, saveKeyPair, loadPublicKey } from "../crypto/keyPair";
import { encryptWithPublicKey, decryptWithPrivateKey } from "../crypto/encrypt";
import {
  ENVAULT_DIR,
  ENCRYPTED_ENV_FILE,
  PUBLIC_KEY_FILE,
  PRIVATE_KEY_FILE,
} from "../constants";

export async function runRotate(): Promise<void> {
  const encryptedFilePath = path.join(ENVAULT_DIR, ENCRYPTED_ENV_FILE);
  const oldPrivateKeyPath = path.join(ENVAULT_DIR, PRIVATE_KEY_FILE);

  if (!fs.existsSync(encryptedFilePath)) {
    console.error("No encrypted .env file found. Run 'envault encrypt' first.");
    process.exit(1);
  }

  if (!fs.existsSync(oldPrivateKeyPath)) {
    console.error("Private key not found. Cannot decrypt existing secrets.");
    process.exit(1);
  }

  // Decrypt existing secrets with old private key
  const encryptedData = fs.readFileSync(encryptedFilePath, "utf-8");
  const oldPrivateKey = fs.readFileSync(oldPrivateKeyPath, "utf-8");

  let plaintext: string;
  try {
    plaintext = decryptWithPrivateKey(encryptedData, oldPrivateKey);
  } catch {
    console.error("Failed to decrypt with existing private key.");
    process.exit(1);
  }

  // Back up old keys
  const timestamp = Date.now();
  fs.renameSync(
    path.join(ENVAULT_DIR, PUBLIC_KEY_FILE),
    path.join(ENVAULT_DIR, `${PUBLIC_KEY_FILE}.${timestamp}.bak`)
  );
  fs.renameSync(
    oldPrivateKeyPath,
    path.join(ENVAULT_DIR, `${PRIVATE_KEY_FILE}.${timestamp}.bak`)
  );

  // Generate new key pair
  const { publicKey, privateKey } = generateKeyPair();
  saveKeyPair(publicKey, privateKey);

  // Re-encrypt with new public key
  const newPublicKey = loadPublicKey();
  const reEncrypted = encryptWithPublicKey(plaintext, newPublicKey);
  fs.writeFileSync(encryptedFilePath, reEncrypted, "utf-8");

  console.log("Key rotation complete. Old keys backed up with timestamp suffix.");
  console.log("Share your new public key with team members: envault share");
}
