import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  parseVaultForRenameKey,
  serializeRenamedVault,
  runRenameKey,
} from './rename-key';

function writeTmp(content: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-rename-key-'));
  const file = path.join(dir, '.env.vault');
  fs.writeFileSync(file, content, 'utf-8');
  return file;
}

describe('parseVaultForRenameKey', () => {
  it('parses key-value pairs', () => {
    const content = 'FOO=bar\nBAZ=qux\n';
    const map = parseVaultForRenameKey(content);
    expect(map.get('FOO')).toBe('bar');
    expect(map.get('BAZ')).toBe('qux');
  });

  it('ignores comments and blank lines', () => {
    const content = '# comment\n\nFOO=bar\n';
    const map = parseVaultForRenameKey(content);
    expect(map.size).toBe(1);
    expect(map.get('FOO')).toBe('bar');
  });
});

describe('serializeRenamedVault', () => {
  it('renames the target key in output', () => {
    const content = 'FOO=bar\nBAZ=qux\n';
    const entries = parseVaultForRenameKey(content);
    const lines = content.split('\n');
    const result = serializeRenamedVault(entries, lines, 'FOO', 'NEW_FOO');
    expect(result).toContain('NEW_FOO=bar');
    expect(result).not.toContain('FOO=bar');
    expect(result).toContain('BAZ=qux');
  });

  it('preserves comments and blank lines', () => {
    const content = '# header\nFOO=bar\n';
    const entries = parseVaultForRenameKey(content);
    const lines = content.split('\n');
    const result = serializeRenamedVault(entries, lines, 'FOO', 'NEW_FOO');
    expect(result).toContain('# header');
  });
});

describe('runRenameKey', () => {
  it('renames a key in the vault file', () => {
    const vaultPath = writeTmp('FOO=bar\nBAZ=qux\n');
    runRenameKey(vaultPath, 'FOO', 'NEW_FOO');
    const updated = fs.readFileSync(vaultPath, 'utf-8');
    expect(updated).toContain('NEW_FOO=bar');
    expect(updated).not.toContain('FOO=bar');
  });

  it('exits with error when key not found', () => {
    const vaultPath = writeTmp('FOO=bar\n');
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() => runRenameKey(vaultPath, 'MISSING', 'NEW')).toThrow('exit');
    exitSpy.mockRestore();
  });

  it('exits with error when new key already exists', () => {
    const vaultPath = writeTmp('FOO=bar\nBAZ=qux\n');
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() => runRenameKey(vaultPath, 'FOO', 'BAZ')).toThrow('exit');
    exitSpy.mockRestore();
  });
});
