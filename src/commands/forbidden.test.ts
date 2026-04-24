import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  parseForbiddenList,
  checkForbiddenKeys,
  parseVaultKeys,
} from './forbidden';

function writeTmp(content: string, ext = '.txt'): string {
  const file = path.join(os.tmpdir(), `envault-forbidden-${Date.now()}${ext}`);
  fs.writeFileSync(file, content, 'utf-8');
  return file;
}

describe('parseForbiddenList', () => {
  it('parses simple keys', () => {
    const result = parseForbiddenList('SECRET_KEY\nANOTHER_KEY\n');
    expect(result).toEqual([
      { key: 'SECRET_KEY', reason: undefined },
      { key: 'ANOTHER_KEY', reason: undefined },
    ]);
  });

  it('parses keys with inline reasons', () => {
    const result = parseForbiddenList('AWS_SECRET # too sensitive\nDEBUG_TOKEN # dev only');
    expect(result[0]).toEqual({ key: 'AWS_SECRET', reason: 'too sensitive' });
    expect(result[1]).toEqual({ key: 'DEBUG_TOKEN', reason: 'dev only' });
  });

  it('ignores blank lines and comments', () => {
    const result = parseForbiddenList('# this is a comment\n\nMY_KEY\n');
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('MY_KEY');
  });
});

describe('parseVaultKeys', () => {
  it('extracts keys from vault content', () => {
    const content = 'DB_HOST=encrypted123\nDB_PASS=encrypted456\n# comment\n';
    const keys = parseVaultKeys(content);
    expect(keys).toContain('DB_HOST');
    expect(keys).toContain('DB_PASS');
    expect(keys).toHaveLength(2);
  });

  it('ignores comment lines', () => {
    const content = '# DB_HOST=should_ignore\nREAL_KEY=value\n';
    const keys = parseVaultKeys(content);
    expect(keys).toEqual(['REAL_KEY']);
  });
});

describe('checkForbiddenKeys', () => {
  it('returns violations for forbidden keys present in vault', () => {
    const vaultKeys = ['DB_HOST', 'AWS_SECRET', 'PORT'];
    const forbidden = [
      { key: 'AWS_SECRET', reason: 'too sensitive' },
      { key: 'MASTER_KEY', reason: undefined },
    ];
    const violations = checkForbiddenKeys(vaultKeys, forbidden);
    expect(violations).toHaveLength(1);
    expect(violations[0].key).toBe('AWS_SECRET');
    expect(violations[0].reason).toBe('too sensitive');
  });

  it('returns empty array when no violations', () => {
    const vaultKeys = ['DB_HOST', 'PORT'];
    const forbidden = [{ key: 'AWS_SECRET', reason: undefined }];
    const violations = checkForbiddenKeys(vaultKeys, forbidden);
    expect(violations).toHaveLength(0);
  });

  it('handles empty forbidden list', () => {
    const violations = checkForbiddenKeys(['KEY_A', 'KEY_B'], []);
    expect(violations).toHaveLength(0);
  });
});
