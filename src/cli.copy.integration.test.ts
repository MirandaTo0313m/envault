import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { copyKeyInVault, parseVaultForCopy } from './commands/copy';

function setupVault(content: string): { vaultPath: string; tmpDir: string } {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-copy-int-'));
  const vaultPath = path.join(tmpDir, '.env.vault');
  fs.writeFileSync(vaultPath, content, 'utf-8');
  return { vaultPath, tmpDir };
}

describe('copy integration', () => {
  it('copies a key and both keys coexist with correct values', () => {
    const { vaultPath } = setupVault(
      'TOKEN=secret-token\nANOTHER=value\n'
    );

    copyKeyInVault(vaultPath, 'TOKEN', 'TOKEN_COPY');

    const entries = parseVaultForCopy(vaultPath);
    expect(entries['TOKEN']).toBe('secret-token');
    expect(entries['TOKEN_COPY']).toBe('secret-token');
    expect(entries['ANOTHER']).toBe('value');
    expect(Object.keys(entries)).toHaveLength(3);
  });

  it('does not modify source key value after copy', () => {
    const { vaultPath } = setupVault('DB_PASS=hunter2\n');

    copyKeyInVault(vaultPath, 'DB_PASS', 'DB_PASS_OLD');

    const raw = fs.readFileSync(vaultPath, 'utf-8');
    expect(raw).toContain('DB_PASS=hunter2');
    expect(raw).toContain('DB_PASS_OLD=hunter2');
  });

  it('fails gracefully when copying to an existing key', () => {
    const { vaultPath } = setupVault('X=1\nY=2\n');

    expect(() => copyKeyInVault(vaultPath, 'X', 'Y')).toThrow(
      'Key "Y" already exists in vault.'
    );

    // Vault should remain unchanged
    const entries = parseVaultForCopy(vaultPath);
    expect(Object.keys(entries)).toHaveLength(2);
  });

  it('handles vault with comments and blank lines correctly', () => {
    const { vaultPath } = setupVault(
      '# This is a comment\n\nAPI_KEY=key123\n'
    );

    copyKeyInVault(vaultPath, 'API_KEY', 'API_KEY_STAGING');

    const entries = parseVaultForCopy(vaultPath);
    expect(entries['API_KEY']).toBe('key123');
    expect(entries['API_KEY_STAGING']).toBe('key123');
  });
});
