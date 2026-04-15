import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { debounceEncrypt } from './watch';
import { generateKeyPair, saveKeyPair } from '../crypto/keyPair';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-watch-'));
}

describe('debounceEncrypt', () => {
  let tmpDir: string;
  let envPath: string;
  let vaultPath: string;

  beforeEach(async () => {
    tmpDir = makeTmpDir();
    envPath = path.join(tmpDir, '.env');
    vaultPath = path.join(tmpDir, '.env.vault');
    fs.writeFileSync(envPath, 'KEY=value\nSECRET=abc123\n', 'utf-8');

    const { publicKey, privateKey } = generateKeyPair();
    saveKeyPair(publicKey, privateKey, tmpDir);

    // Patch loadPublicKey to use tmpDir
    jest.resetModules();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  it('writes an encrypted vault file after debounce', (done) => {
    jest.spyOn(require('../crypto/keyPair'), 'loadPublicKey').mockImplementation(() => {
      const { generateKeyPair } = require('../crypto/keyPair');
      const { publicKey } = generateKeyPair();
      return publicKey;
    });

    jest.spyOn(require('../crypto/encrypt'), 'encryptWithPublicKey').mockReturnValue('encrypted-content');

    debounceEncrypt(envPath, vaultPath, 50);

    setTimeout(() => {
      expect(fs.existsSync(vaultPath)).toBe(true);
      const content = fs.readFileSync(vaultPath, 'utf-8');
      expect(content).toBe('encrypted-content');
      done();
    }, 150);
  });

  it('only runs once when called multiple times within delay', (done) => {
    const mockEncrypt = jest.spyOn(require('../crypto/encrypt'), 'encryptWithPublicKey').mockReturnValue('enc');
    jest.spyOn(require('../crypto/keyPair'), 'loadPublicKey').mockReturnValue('pubkey');

    debounceEncrypt(envPath, vaultPath, 100);
    debounceEncrypt(envPath, vaultPath, 100);
    debounceEncrypt(envPath, vaultPath, 100);

    setTimeout(() => {
      expect(mockEncrypt).toHaveBeenCalledTimes(1);
      done();
    }, 300);
  });
});
