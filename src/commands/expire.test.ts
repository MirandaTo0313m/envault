import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  parseVaultWithExpiry,
  setExpiry,
  removeExpiry,
  serializeVaultWithExpiry,
  getExpiredKeys,
  runExpire,
} from './expire';

function writeTmp(content: string): string {
  const p = path.join(os.tmpdir(), `expire-test-${Date.now()}.vault`);
  fs.writeFileSync(p, content, 'utf-8');
  return p;
}

const sampleVault = `# expires=2020-01-01T00:00:00Z
OLD_KEY=oldval
FRESH_KEY=freshval
`;

describe('parseVaultWithExpiry', () => {
  it('parses entries and extracts expiresAt', () => {
    const p = writeTmp(sampleVault);
    const entries = parseVaultWithExpiry(p);
    expect(entries).toHaveLength(2);
    expect(entries[0].key).toBe('OLD_KEY');
    expect(entries[0].expiresAt).toBe('2020-01-01T00:00:00Z');
    expect(entries[1].expiresAt).toBeNull();
  });

  it('returns empty array if file missing', () => {
    expect(parseVaultWithExpiry('/no/such/file.vault')).toEqual([]);
  });
});

describe('setExpiry', () => {
  it('sets expiresAt on an existing key', () => {
    const p = writeTmp(sampleVault);
    let entries = parseVaultWithExpiry(p);
    entries = setExpiry(entries, 'FRESH_KEY', '2099-12-31T00:00:00Z');
    expect(entries.find(e => e.key === 'FRESH_KEY')?.expiresAt).toBe('2099-12-31T00:00:00Z');
  });

  it('throws if key not found', () => {
    const p = writeTmp(sampleVault);
    const entries = parseVaultWithExpiry(p);
    expect(() => setExpiry(entries, 'MISSING', '2099-01-01')).toThrow();
  });
});

describe('removeExpiry', () => {
  it('clears expiresAt from a key', () => {
    const p = writeTmp(sampleVault);
    let entries = parseVaultWithExpiry(p);
    entries = removeExpiry(entries, 'OLD_KEY');
    expect(entries[0].expiresAt).toBeNull();
  });
});

describe('getExpiredKeys', () => {
  it('returns only keys with past expiry dates', () => {
    const p = writeTmp(sampleVault);
    const entries = parseVaultWithExpiry(p);
    const expired = getExpiredKeys(entries);
    expect(expired.map(e => e.key)).toContain('OLD_KEY');
    expect(expired.map(e => e.key)).not.toContain('FRESH_KEY');
  });
});

describe('runExpire', () => {
  it('writes updated vault with expiry', () => {
    const p = writeTmp(sampleVault);
    runExpire(p, 'FRESH_KEY', '2099-06-01T00:00:00Z');
    const entries = parseVaultWithExpiry(p);
    expect(entries.find(e => e.key === 'FRESH_KEY')?.expiresAt).toBe('2099-06-01T00:00:00Z');
  });
});
