import * as fs from 'fs';
import * as path from 'path';
import { runDecrypt } from './decrypt';
import { encryptWithPublicKey, decryptWithPrivateKey } from '../crypto/encrypt';
import { generateKeyPair } from '../crypto/keyPair';

jest.mock('fs');

const mockFs = fs as jest.Mocked<typeof fs>;

describe('runDecrypt', () => {
  const mockPrivateKey = 'mock-private-key';
  const mockPublicKey = 'mock-public-key';
  const mockEnvContent = 'API_KEY=secret\nDB_URL=postgres://localhost/db';
  const encryptedPayload = JSON.stringify({
    data: 'encryptedData',
    key: 'encryptedKey',
    iv: 'mockIv',
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws if encrypted file does not exist', async () => {
    mockFs.existsSync.mockReturnValue(false);

    await expect(
      runDecrypt('.env.vault', '.env', '/path/to/private.pem')
    ).rejects.toThrow('Encrypted file not found');
  });

  it('throws if encrypted file has invalid JSON', async () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('not-valid-json' as any);

    jest.mock('../crypto/keyPair', () => ({
      loadPrivateKey: jest.fn().mockResolvedValue(mockPrivateKey),
    }));

    await expect(
      runDecrypt('.env.vault', '.env', '/path/to/private.pem')
    ).rejects.toThrow();
  });

  it('writes decrypted content to output file on success', async () => {
    const { generateKeyPair } = await import('../crypto/keyPair');
    const { encryptWithPublicKey, decryptWithPrivateKey } = await import('../crypto/encrypt');

    const { publicKey, privateKey } = await generateKeyPair();
    const encrypted = encryptWithPublicKey(mockEnvContent, publicKey);
    const payload = JSON.stringify(encrypted);

    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(payload as any);
    mockFs.writeFileSync.mockImplementation(() => {});

    jest.spyOn(require('../crypto/keyPair'), 'loadPrivateKey').mockResolvedValue(privateKey);

    await expect(
      runDecrypt('.env.vault', '.env', '/path/to/private.pem')
    ).resolves.not.toThrow();

    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('.env'),
      mockEnvContent,
      'utf-8'
    );
  });
});
