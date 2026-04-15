import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseVaultWithGroups, setGroup, listGroups } from './group';

function writeTmp(content: string): string {
  const tmpFile = path.join(os.tmpdir(), `vault-group-${Date.now()}.vault`);
  fs.writeFileSync(tmpFile, content, 'utf-8');
  return tmpFile;
}

describe('parseVaultWithGroups', () => {
  it('parses entries without groups', () => {
    const f = writeTmp('FOO=bar\nBAZ=qux\n');
    const entries = parseVaultWithGroups(f);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({ key: 'FOO', value: 'bar', group: undefined });
    fs.unlinkSync(f);
  });

  it('parses entries with group annotations', () => {
    const content = `# @group:database\nDB_HOST=localhost\nDB_PORT=5432\n# @endgroup\nAPP_KEY=secret\n`;
    const f = writeTmp(content);
    const entries = parseVaultWithGroups(f);
    expect(entries).toHaveLength(3);
    expect(entries[0].group).toBe('database');
    expect(entries[1].group).toBe('database');
    expect(entries[2].group).toBeUndefined();
    fs.unlinkSync(f);
  });

  it('returns empty array for missing file', () => {
    const entries = parseVaultWithGroups('/nonexistent/path.vault');
    expect(entries).toEqual([]);
  });
});

describe('setGroup', () => {
  it('assigns keys to a group', () => {
    const f = writeTmp('FOO=bar\nBAZ=qux\nABC=123\n');
    setGroup(f, ['FOO', 'BAZ'], 'mygroup');
    const result = parseVaultWithGroups(f);
    const grouped = result.filter(e => e.group === 'mygroup');
    expect(grouped.map(e => e.key)).toContain('FOO');
    expect(grouped.map(e => e.key)).toContain('BAZ');
    fs.unlinkSync(f);
  });

  it('preserves ungrouped keys', () => {
    const f = writeTmp('FOO=bar\nBAZ=qux\n');
    setGroup(f, ['FOO'], 'g1');
    const result = parseVaultWithGroups(f);
    const baz = result.find(e => e.key === 'BAZ');
    expect(baz).toBeDefined();
    expect(baz?.group).toBeUndefined();
    fs.unlinkSync(f);
  });

  it('exits if no matching keys found', () => {
    const f = writeTmp('FOO=bar\n');
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() => setGroup(f, ['NONEXISTENT'], 'g1')).toThrow('exit');
    mockExit.mockRestore();
    fs.unlinkSync(f);
  });
});

describe('listGroups', () => {
  it('prints grouped keys without error', () => {
    const content = `# @group:infra\nREDIS_URL=redis://localhost\n# @endgroup\nSECRET=abc\n`;
    const f = writeTmp(content);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    expect(() => listGroups(f)).not.toThrow();
    spy.mockRestore();
    fs.unlinkSync(f);
  });
});
