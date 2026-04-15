import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseVaultForSet, serializeVaultEntries, runSet } from './set';
import * as encrypt from '../crypto/encrypt';
import * as keyPair from '../crypto/keyPair';
import * as assertUnlockedModule from '../utils/assertUnlocked';

describe('parseVaultForSet', () => {
  it('parses key=value lines', () => {
    const content = 'FOO=bar\nBAZ=qux\n';
    expect(parseVaultForSet(content)).toEqual({ FOO: 'bar', BAZ: 'qux' });
  });

  it('ignores comments and blank lines', () => {
    const content = '# comment\n\nKEY=value\n';
    expect(parseVaultForSet(content)).toEqual({ KEY: 'value' });
  });

  it('handles values with = signs', () => {
    const content = 'KEY=val=ue\n';
    expect(parseVaultForSet(content)).toEqual({ KEY: 'val=ue' });
  });
});

describe('serializeVaultEntries', () => {
  it('serializes entries to key=value lines', () => {
    const entries = { A: '1', B: '2' };
    const result = serializeVaultEntries(entries);
    expect(result).toContain('A=1');
    expect(result).toContain('B=2');
    expect(result.endsWith('\n')).toBe(true);
  });
});

describe('runSet', () => {
  let tmpDir: string;
  let vaultPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-set-'));
    vaultPath = path.join(tmpDir, '.vault');
    jest.spyOn(assertUnlockedModule, 'assertUnlocked').mockImplementation(() => {});
    jest.spyOn(keyPair, 'loadPublicKey').mockReturnValue('mock-public-key');
    jest.spyOn(encrypt, 'encryptWithPublicKey').mockReturnValue('enc:mockvalue');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  it('creates vault and adds new key', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await runSet('MY_KEY', 'my_secret', vaultPath);
    const content = fs.readFileSync(vaultPath, 'utf-8');
    expect(content).toContain('MY_KEY=enc:mockvalue');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Added'));
  });

  it('updates existing key', async () => {
    fs.writeFileSync(vaultPath, 'MY_KEY=old_encrypted\n');
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await runSet('MY_KEY', 'new_secret', vaultPath);
    const content = fs.readFileSync(vaultPath, 'utf-8');
    expect(content).toContain('MY_KEY=enc:mockvalue');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Updated'));
  });
});
