import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  parseVaultWithAliases,
  setAlias,
  removeAlias,
  serializeVaultWithAliases,
  runAlias,
} from './alias';

function writeTmp(content: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-alias-'));
  const filePath = path.join(dir, '.vault');
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

describe('parseVaultWithAliases', () => {
  it('parses entries without aliases', () => {
    const p = writeTmp('API_KEY=abc123\nDB_URL=postgres://localhost\n');
    const entries = parseVaultWithAliases(p);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toEqual({ key: 'API_KEY', value: 'abc123', alias: undefined });
  });

  it('parses entries with aliases', () => {
    const p = writeTmp('API_KEY=abc123 #alias:api\n');
    const entries = parseVaultWithAliases(p);
    expect(entries[0].alias).toBe('api');
    expect(entries[0].value).toBe('abc123');
  });

  it('returns empty array for missing file', () => {
    const entries = parseVaultWithAliases('/nonexistent/path/.vault');
    expect(entries).toEqual([]);
  });
});

describe('setAlias', () => {
  it('sets an alias for an existing key', () => {
    const p = writeTmp('SECRET=mysecret\n');
    setAlias(p, 'SECRET', 'sec');
    const entries = parseVaultWithAliases(p);
    expect(entries[0].alias).toBe('sec');
  });

  it('throws if key not found', () => {
    const p = writeTmp('SECRET=mysecret\n');
    expect(() => setAlias(p, 'MISSING', 'alias')).toThrow('not found');
  });

  it('throws if alias already used by another key', () => {
    const p = writeTmp('A=1 #alias:shared\nB=2\n');
    expect(() => setAlias(p, 'B', 'shared')).toThrow('already used');
  });
});

describe('removeAlias', () => {
  it('removes an alias from a key', () => {
    const p = writeTmp('API_KEY=abc #alias:api\n');
    removeAlias(p, 'API_KEY');
    const entries = parseVaultWithAliases(p);
    expect(entries[0].alias).toBeUndefined();
  });

  it('resolves by alias name', () => {
    const p = writeTmp('API_KEY=abc #alias:api\n');
    removeAlias(p, 'api');
    const entries = parseVaultWithAliases(p);
    expect(entries[0].alias).toBeUndefined();
  });
});

describe('runAlias', () => {
  it('lists aliases', () => {
    const p = writeTmp('A=1 #alias:alpha\nB=2\n');
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    runAlias('list', p);
    expect(spy).toHaveBeenCalledWith('alpha -> A');
    spy.mockRestore();
  });

  it('prints no aliases message when none defined', () => {
    const p = writeTmp('A=1\n');
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    runAlias('list', p);
    expect(spy).toHaveBeenCalledWith('No aliases defined.');
    spy.mockRestore();
  });
});
