import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { pinKeyInVault, unpinKeyInVault, parsePinnedKeys } from './commands/pin';

function writeTmp(content: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-pin-'));
  const file = path.join(dir, '.env.vault');
  fs.writeFileSync(file, content, 'utf-8');
  return file;
}

const SAMPLE_VAULT = `DB_HOST=enc_host
DB_PASS=enc_pass
SECRET=enc_secret
`;

describe('pin integration', () => {
  it('pins a key and persists to file', () => {
    const file = writeTmp(SAMPLE_VAULT);
    const content = fs.readFileSync(file, 'utf-8');
    const updated = pinKeyInVault(content, 'DB_HOST');
    fs.writeFileSync(file, updated, 'utf-8');

    const saved = fs.readFileSync(file, 'utf-8');
    expect(saved).toContain('@pinned:DB_HOST');
    expect(saved).toContain('DB_HOST=enc_host');
  });

  it('unpins a key and persists to file', () => {
    const file = writeTmp(SAMPLE_VAULT);
    let content = fs.readFileSync(file, 'utf-8');
    content = pinKeyInVault(content, 'SECRET');
    fs.writeFileSync(file, content, 'utf-8');

    let saved = fs.readFileSync(file, 'utf-8');
    expect(saved).toContain('@pinned:SECRET');

    const unpinned = unpinKeyInVault(saved, 'SECRET');
    fs.writeFileSync(file, unpinned, 'utf-8');

    saved = fs.readFileSync(file, 'utf-8');
    expect(saved).not.toContain('@pinned:SECRET');
  });

  it('lists all pinned keys after multiple pins', () => {
    const file = writeTmp(SAMPLE_VAULT);
    let content = fs.readFileSync(file, 'utf-8');
    content = pinKeyInVault(content, 'DB_HOST');
    content = pinKeyInVault(content, 'SECRET');
    fs.writeFileSync(file, content, 'utf-8');

    const saved = fs.readFileSync(file, 'utf-8');
    const pinned = parsePinnedKeys(saved);
    expect(pinned.map(p => p.key)).toContain('DB_HOST');
    expect(pinned.map(p => p.key)).toContain('SECRET');
    expect(pinned).toHaveLength(2);
  });

  it('pinning a non-existent key does not modify file', () => {
    const file = writeTmp(SAMPLE_VAULT);
    const content = fs.readFileSync(file, 'utf-8');
    expect(() => pinKeyInVault(content, 'NONEXISTENT')).toThrow();
    const saved = fs.readFileSync(file, 'utf-8');
    expect(saved).toBe(SAMPLE_VAULT);
  });
});
