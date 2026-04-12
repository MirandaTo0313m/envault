import fs from 'fs';
import path from 'path';
import { runShare } from './share';
import { generateKeyPair } from '../crypto/keyPair';
import { decryptWithPrivateKey } from '../crypto/encrypt';
import { ENVAULT_DIR } from '../constants';

const TEST_DIR = path.join(__dirname, '../../tmp/share-test');
const TEST_ENV = path.join(TEST_DIR, '.env');
const TEST_PUB_KEY = path.join(TEST_DIR, 'recipient.pub');
const TEST_PRIV_KEY = path.join(TEST_DIR, 'recipient.priv');

beforeAll(() => {
  fs.mkdirSync(TEST_DIR, { recursive: true });
  fs.writeFileSync(TEST_ENV, 'SECRET=hello\nAPI_KEY=world', 'utf-8');
});

afterAll(() => {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
  if (fs.existsSync(ENVAULT_DIR)) {
    fs.rmSync(ENVAULT_DIR, { recursive: true, force: true });
  }
});

describe('runShare', () => {
  it('should encrypt env for recipient and write shared file', async () => {
    const { publicKey, privateKey } = generateKeyPair();
    fs.writeFileSync(TEST_PUB_KEY, publicKey, 'utf-8');
    fs.writeFileSync(TEST_PRIV_KEY, privateKey, 'utf-8');

    await runShare(TEST_PUB_KEY, TEST_ENV);

    const sharedFiles = fs.readdirSync(ENVAULT_DIR).filter(f => f.startsWith('shared-'));
    expect(sharedFiles.length).toBeGreaterThan(0);

    const encryptedContent = fs.readFileSync(path.join(ENVAULT_DIR, sharedFiles[0]), 'utf-8');
    const decrypted = decryptWithPrivateKey(encryptedContent, privateKey);
    expect(decrypted).toBe('SECRET=hello\nAPI_KEY=world');
  });

  it('should exit if env file does not exist', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(runShare(TEST_PUB_KEY, '/nonexistent/.env')).rejects.toThrow('exit');
    exitSpy.mockRestore();
  });

  it('should exit if recipient public key does not exist', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(runShare('/nonexistent/key.pub', TEST_ENV)).rejects.toThrow('exit');
    exitSpy.mockRestore();
  });
});
