import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  parseVaultWithProtection,
  setProtected,
  unsetProtected,
  isKeyProtected,
  runProtect,
} from './protect';

const sampleVault = `API_KEY=abc123
DB_PASSWORD=secret
!PROTECTED JWT_SECRET=myjwt
`;

function writeTmp(content: string): string {
  const tmpFile = path.join(os.tmpdir(), `vault-protect-${Date.now()}.env`);
  fs.writeFileSync(tmpFile, content, 'utf-8');
  return tmpFile;
}

describe('parseVaultWithProtection', () => {
  it('parses protected and unprotected keys', () => {
    const entries = parseVaultWithProtection(sampleVault);
    expect(entries).toHaveLength(3);
    expect(entries.find((e) => e.key === 'API_KEY')?.protected).toBe(false);
    expect(entries.find((e) => e.key === 'JWT_SECRET')?.protected).toBe(true);
  });

  it('ignores blank lines and comments', () => {
    const content = `# comment\n\nFOO=bar\n`;
    const entries = parseVaultWithProtection(content);
    expect(entries).toHaveLength(1);
    expect(entries[0].key).toBe('FOO');
  });
});

describe('setProtected', () => {
  it('marks an existing key as protected', () => {
    const result = setProtected(sampleVault, 'API_KEY');
    expect(result).toContain('!PROTECTED API_KEY=abc123');
  });

  it('does not double-protect an already protected key', () => {
    const result = setProtected(sampleVault, 'JWT_SECRET');
    expect(result.match(/!PROTECTED/g)?.length).toBe(1);
  });

  it('throws if key not found', () => {
    expect(() => setProtected(sampleVault, 'MISSING_KEY')).toThrow();
  });
});

describe('unsetProtected', () => {
  it('removes protection from a protected key', () => {
    const result = unsetProtected(sampleVault, 'JWT_SECRET');
    expect(result).not.toContain('!PROTECTED JWT_SECRET');
    expect(result).toContain('JWT_SECRET=myjwt');
  });

  it('throws if key is not protected', () => {
    expect(() => unsetProtected(sampleVault, 'API_KEY')).toThrow();
  });
});

describe('isKeyProtected', () => {
  it('returns true for protected keys', () => {
    expect(isKeyProtected(sampleVault, 'JWT_SECRET')).toBe(true);
  });

  it('returns false for unprotected keys', () => {
    expect(isKeyProtected(sampleVault, 'API_KEY')).toBe(false);
  });

  it('returns false for missing keys', () => {
    expect(isKeyProtected(sampleVault, 'NONEXISTENT')).toBe(false);
  });
});

describe('runProtect', () => {
  it('sets protection on a key and writes to file', () => {
    const tmpFile = writeTmp(sampleVault);
    runProtect(tmpFile, 'API_KEY', 'set');
    const updated = fs.readFileSync(tmpFile, 'utf-8');
    expect(updated).toContain('!PROTECTED API_KEY=abc123');
    fs.unlinkSync(tmpFile);
  });

  it('unsets protection on a key and writes to file', () => {
    const tmpFile = writeTmp(sampleVault);
    runProtect(tmpFile, 'JWT_SECRET', 'unset');
    const updated = fs.readFileSync(tmpFile, 'utf-8');
    expect(updated).not.toContain('!PROTECTED JWT_SECRET');
    fs.unlinkSync(tmpFile);
  });
});
