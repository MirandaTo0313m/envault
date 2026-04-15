import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  parsePermissions,
  setPermission,
  runChmod,
} from './chmod';

function writeTmp(content: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-chmod-'));
  const file = path.join(dir, '.env.vault');
  fs.writeFileSync(file, content, 'utf-8');
  return file;
}

describe('parsePermissions', () => {
  it('parses perm annotations from vault content', () => {
    const content = `# @perm API_KEY read\n# @perm DB_PASS write\nAPI_KEY=enc:abc`;
    const perms = parsePermissions(content);
    expect(perms['API_KEY']).toBe('read');
    expect(perms['DB_PASS']).toBe('write');
  });

  it('returns empty object when no perms defined', () => {
    const perms = parsePermissions('API_KEY=enc:abc\nDB_URL=enc:xyz');
    expect(Object.keys(perms)).toHaveLength(0);
  });
});

describe('setPermission', () => {
  it('adds a new permission annotation', () => {
    const content = 'API_KEY=enc:abc';
    const updated = setPermission(content, 'API_KEY', 'read');
    expect(updated).toContain('# @perm API_KEY read');
  });

  it('updates an existing permission annotation', () => {
    const content = '# @perm API_KEY read\nAPI_KEY=enc:abc';
    const updated = setPermission(content, 'API_KEY', 'write');
    expect(updated).toContain('# @perm API_KEY write');
    expect(updated).not.toContain('# @perm API_KEY read');
  });

  it('removes annotation when permission is none', () => {
    const content = '# @perm API_KEY read\nAPI_KEY=enc:abc';
    const updated = setPermission(content, 'API_KEY', 'none');
    expect(updated).not.toContain('# @perm API_KEY');
  });

  it('does nothing when setting none on non-existent key', () => {
    const content = 'API_KEY=enc:abc';
    const updated = setPermission(content, 'MISSING', 'none');
    expect(updated).toBe(content);
  });
});

describe('runChmod', () => {
  it('writes updated permissions to vault file', () => {
    const vaultFile = writeTmp('API_KEY=enc:abc');
    runChmod(vaultFile, 'API_KEY', 'read');
    const result = fs.readFileSync(vaultFile, 'utf-8');
    expect(result).toContain('# @perm API_KEY read');
  });

  it('exits if vault file does not exist', () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() => runChmod('/nonexistent/.env.vault', 'KEY', 'read')).toThrow('exit');
    exitSpy.mockRestore();
  });
});
