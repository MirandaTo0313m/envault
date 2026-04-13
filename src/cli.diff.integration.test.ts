import * as fs from 'fs';
import * as path from 'path';
import { generateKeyPair, saveKeyPair } from './crypto/keyPair';
import { encryptWithPublicKey } from './crypto/encrypt';
import { computeDiff } from './commands/diff';
import * as os from 'os';

describe('diff integration', () => {
  let tmpDir: string;
  let vaultPath: string;
  let envPath: string;
  let originalHome: string | undefined;

  beforeAll(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-diff-'));
    originalHome = process.env.HOME;
    process.env.HOME = tmpDir;

    const { publicKey, privateKey } = generateKeyPair();
    saveKeyPair(publicKey, privateKey);

    const entries = [
      { key: 'SHARED_KEY', value: 'same_value' },
      { key: 'CHANGED_KEY', value: 'vault_value' },
      { key: 'VAULT_ONLY', value: 'secret' },
    ];

    const lines = entries.map(({ key, value }) => {
      const encrypted = encryptWithPublicKey(value, publicKey);
      return `${key}=${encrypted}`;
    });

    vaultPath = path.join(tmpDir, 'vault.env.enc');
    fs.writeFileSync(vaultPath, lines.join('\n'), 'utf-8');

    envPath = path.join(tmpDir, '.env');
    fs.writeFileSync(
      envPath,
      'SHARED_KEY=same_value\nCHANGED_KEY=env_value\nENV_ONLY=local_secret',
      'utf-8'
    );
  });

  afterAll(() => {
    process.env.HOME = originalHome;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('correctly identifies all diff statuses', async () => {
    const diffs = await computeDiff(vaultPath, envPath);

    const byKey = Object.fromEntries(diffs.map(d => [d.key, d]));

    expect(byKey['SHARED_KEY'].status).toBe('unchanged');
    expect(byKey['CHANGED_KEY'].status).toBe('changed');
    expect(byKey['VAULT_ONLY'].status).toBe('removed');
    expect(byKey['ENV_ONLY'].status).toBe('added');
  });

  it('returns sorted keys', async () => {
    const diffs = await computeDiff(vaultPath, envPath);
    const keys = diffs.map(d => d.key);
    expect(keys).toEqual([...keys].sort());
  });
});
