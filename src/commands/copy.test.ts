import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { copyKeyInVault, parseVaultForCopy } from './copy';

function createTempVault(content: string): string {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-copy-'));
  const vaultPath = path.join(tmpDir, '.env.vault');
  fs.writeFileSync(vaultPath, content, 'utf-8');
  return vaultPath;
}

describe('parseVaultForCopy', () => {
  it('parses key-value pairs from vault file', () => {
    const vaultPath = createTempVault('API_KEY=abc123\nDB_URL=postgres://localhost\n');
    const result = parseVaultForCopy(vaultPath);
    expect(result['API_KEY']).toBe('abc123');
    expect(result['DB_URL']).toBe('postgres://localhost');
  });

  it('ignores comment lines and blank lines', () => {
    const vaultPath = createTempVault('# comment\n\nFOO=bar\n');
    const result = parseVaultForCopy(vaultPath);
    expect(Object.keys(result)).toEqual(['FOO']);
  });

  it('throws if vault file does not exist', () => {
    expect(() => parseVaultForCopy('/nonexistent/path/.env.vault')).toThrow(
      'Vault file not found'
    );
  });
});

describe('copyKeyInVault', () => {
  it('copies an existing key to a new key', () => {
    const vaultPath = createTempVault('SECRET=mysecret\n');
    copyKeyInVault(vaultPath, 'SECRET', 'SECRET_BACKUP');
    const entries = parseVaultForCopy(vaultPath);
    expect(entries['SECRET']).toBe('mysecret');
    expect(entries['SECRET_BACKUP']).toBe('mysecret');
  });

  it('throws if source key does not exist', () => {
    const vaultPath = createTempVault('FOO=bar\n');
    expect(() => copyKeyInVault(vaultPath, 'MISSING', 'DEST')).toThrow(
      'Key "MISSING" not found in vault.'
    );
  });

  it('throws if destination key already exists', () => {
    const vaultPath = createTempVault('FOO=bar\nBAZ=qux\n');
    expect(() => copyKeyInVault(vaultPath, 'FOO', 'BAZ')).toThrow(
      'Key "BAZ" already exists in vault.'
    );
  });

  it('preserves existing entries after copy', () => {
    const vaultPath = createTempVault('A=1\nB=2\n');
    copyKeyInVault(vaultPath, 'A', 'A_COPY');
    const entries = parseVaultForCopy(vaultPath);
    expect(entries['A']).toBe('1');
    expect(entries['B']).toBe('2');
    expect(entries['A_COPY']).toBe('1');
  });
});
