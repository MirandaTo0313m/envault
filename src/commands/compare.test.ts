import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseVaultKeysAndValues, compareVaults, runCompare } from './compare';

function writeTmp(name: string, content: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-compare-'));
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

describe('parseVaultKeysAndValues', () => {
  it('parses key=value pairs', () => {
    const f = writeTmp('a.env', 'FOO=bar\nBAZ=qux\n');
    expect(parseVaultKeysAndValues(f)).toEqual({ FOO: 'bar', BAZ: 'qux' });
  });

  it('ignores comments and blank lines', () => {
    const f = writeTmp('b.env', '# comment\n\nKEY=val\n');
    expect(parseVaultKeysAndValues(f)).toEqual({ KEY: 'val' });
  });

  it('throws if file does not exist', () => {
    expect(() => parseVaultKeysAndValues('/nonexistent/file.env')).toThrow('File not found');
  });
});

describe('compareVaults', () => {
  it('detects keys only in A', () => {
    const result = compareVaults({ A: '1', B: '2' }, { B: '2' });
    expect(result.onlyInA).toContain('A');
    expect(result.same).toContain('B');
  });

  it('detects keys only in B', () => {
    const result = compareVaults({ A: '1' }, { A: '1', C: '3' });
    expect(result.onlyInB).toContain('C');
  });

  it('detects different values', () => {
    const result = compareVaults({ X: 'old' }, { X: 'new' });
    expect(result.different).toContain('X');
  });

  it('detects same values', () => {
    const result = compareVaults({ Y: 'same' }, { Y: 'same' });
    expect(result.same).toContain('Y');
  });
});

describe('runCompare', () => {
  it('outputs JSON when --json flag is set', () => {
    const a = writeTmp('a.env', 'KEY=1\n');
    const b = writeTmp('b.env', 'KEY=2\n');
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    runCompare(a, b, { json: true });
    const output = JSON.parse(spy.mock.calls[0][0]);
    expect(output.different).toContain('KEY');
    spy.mockRestore();
  });

  it('runs without error in quiet mode', () => {
    const a = writeTmp('a.env', 'A=1\n');
    const b = writeTmp('b.env', 'B=2\n');
    expect(() => runCompare(a, b, { quiet: true })).not.toThrow();
  });
});
