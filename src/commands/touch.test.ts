import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseVaultForTouch, touchKeyInVault, runTouch } from './touch';

function writeTmp(content: string): string {
  const file = path.join(os.tmpdir(), `vault-touch-${Date.now()}.env`);
  fs.writeFileSync(file, content, 'utf-8');
  return file;
}

describe('parseVaultForTouch', () => {
  it('parses key-value pairs', () => {
    const content = 'FOO=bar\nBAZ=qux\n';
    const map = parseVaultForTouch(content);
    expect(map.get('FOO')).toBe('bar');
    expect(map.get('BAZ')).toBe('qux');
  });

  it('ignores comments and blank lines', () => {
    const content = '# comment\n\nFOO=bar\n';
    const map = parseVaultForTouch(content);
    expect(map.size).toBe(1);
    expect(map.get('FOO')).toBe('bar');
  });
});

describe('touchKeyInVault', () => {
  const ts = '2024-01-01T00:00:00.000Z';

  it('marks an existing key with a timestamp comment', () => {
    const content = 'FOO=bar\nBAZ=qux\n';
    const { content: result, existed } = touchKeyInVault(content, 'FOO', ts);
    expect(existed).toBe(true);
    expect(result).toContain(`# touched: ${ts}`);
    expect(result).toContain('FOO=bar');
  });

  it('creates a new empty key when it does not exist', () => {
    const content = 'FOO=bar\n';
    const { content: result, existed } = touchKeyInVault(content, 'NEW_KEY', ts);
    expect(existed).toBe(false);
    expect(result).toContain('NEW_KEY=');
    expect(result).toContain(`# touched: ${ts}`);
  });

  it('replaces an existing touched comment', () => {
    const oldTs = '2023-01-01T00:00:00.000Z';
    const content = `# touched: ${oldTs}\nFOO=bar\n`;
    const { content: result } = touchKeyInVault(content, 'FOO', ts);
    expect(result).not.toContain(oldTs);
    expect(result).toContain(`# touched: ${ts}`);
  });
});

describe('runTouch', () => {
  it('writes touch metadata to vault file for existing key', () => {
    const vaultPath = writeTmp('API_KEY=secret\nDEBUG=true\n');
    const result = runTouch('API_KEY', vaultPath);
    expect(result.key).toBe('API_KEY');
    expect(result.existed).toBe(true);
    expect(result.updatedAt).toBeTruthy();
    const written = fs.readFileSync(vaultPath, 'utf-8');
    expect(written).toContain('# touched:');
    expect(written).toContain('API_KEY=secret');
  });

  it('creates key entry when key does not exist', () => {
    const vaultPath = writeTmp('EXISTING=value\n');
    const result = runTouch('BRAND_NEW', vaultPath);
    expect(result.existed).toBe(false);
    const written = fs.readFileSync(vaultPath, 'utf-8');
    expect(written).toContain('BRAND_NEW=');
  });

  it('throws if vault file does not exist', () => {
    expect(() => runTouch('FOO', '/nonexistent/path/.env.vault')).toThrow(
      'Vault file not found'
    );
  });
});
