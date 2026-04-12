import * as crypto from 'crypto';
import * as fs from 'fs';

/**
 * Encrypts plaintext using a recipient's RSA public key.
 * Uses hybrid encryption: AES-256-GCM for the payload, RSA-OAEP for the AES key.
 */
export function encryptWithPublicKey(
  plaintext: string,
  publicKeyPem: string
): string {
  // Generate a random AES key and IV
  const aesKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12);

  // Encrypt the plaintext with AES-256-GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Encrypt the AES key with the RSA public key
  const encryptedKey = crypto.publicEncrypt(
    { key: publicKeyPem, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING },
    aesKey
  );

  // Bundle everything into a single base64-encoded JSON payload
  const payload = {
    encryptedKey: encryptedKey.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    ciphertext: encrypted.toString('base64'),
  };

  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Decrypts a payload produced by encryptWithPublicKey using the RSA private key.
 */
export function decryptWithPrivateKey(
  encryptedPayload: string,
  privateKeyPem: string
): string {
  const payload = JSON.parse(
    Buffer.from(encryptedPayload, 'base64').toString('utf8')
  );

  const encryptedKey = Buffer.from(payload.encryptedKey, 'base64');
  const iv = Buffer.from(payload.iv, 'base64');
  const authTag = Buffer.from(payload.authTag, 'base64');
  const ciphertext = Buffer.from(payload.ciphertext, 'base64');

  // Decrypt the AES key
  const aesKey = crypto.privateDecrypt(
    { key: privateKeyPem, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING },
    encryptedKey
  );

  // Decrypt the payload
  const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}
