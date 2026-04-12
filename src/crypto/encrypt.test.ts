import { encryptWithPublicKey, decryptWithPrivateKey } from './encrypt';
import { generateKeyPair } from './keyPair';
import * as crypto from 'crypto';

describe('encrypt / decrypt', () => {
  let publicKeyPem: string;
  let privateKeyPem: string;

  beforeAll(() => {
    const { publicKey, privateKey } = generateKeyPair();
    publicKeyPem = publicKey;
    privateKeyPem = privateKey;
  });

  it('should encrypt and decrypt a simple string', () => {
    const original = 'DATABASE_URL=postgres://localhost/mydb';
    const encrypted = encryptWithPublicKey(original, publicKeyPem);
    const decrypted = decryptWithPrivateKey(encrypted, privateKeyPem);
    expect(decrypted).toBe(original);
  });

  it('should produce a different ciphertext on each call (random IV)', () => {
    const original = 'SECRET=hello';
    const enc1 = encryptWithPublicKey(original, publicKeyPem);
    const enc2 = encryptWithPublicKey(original, publicKeyPem);
    expect(enc1).not.toBe(enc2);
  });

  it('should encrypt and decrypt multi-line .env content', () => {
    const envContent = [
      'API_KEY=abc123',
      'DATABASE_URL=postgres://user:pass@localhost/db',
      'SECRET_TOKEN=supersecret',
    ].join('\n');

    const encrypted = encryptWithPublicKey(envContent, publicKeyPem);
    const decrypted = decryptWithPrivateKey(encrypted, privateKeyPem);
    expect(decrypted).toBe(envContent);
  });

  it('should throw when decrypting with a wrong private key', () => {
    const { privateKey: wrongPrivateKey } = generateKeyPair();
    const encrypted = encryptWithPublicKey('SECRET=test', publicKeyPem);
    expect(() => decryptWithPrivateKey(encrypted, wrongPrivateKey)).toThrow();
  });

  it('should return a valid base64 string', () => {
    const encrypted = encryptWithPublicKey('TEST=1', publicKeyPem);
    const decoded = Buffer.from(encrypted, 'base64').toString('utf8');
    const parsed = JSON.parse(decoded);
    expect(parsed).toHaveProperty('encryptedKey');
    expect(parsed).toHaveProperty('iv');
    expect(parsed).toHaveProperty('authTag');
    expect(parsed).toHaveProperty('ciphertext');
  });
});
