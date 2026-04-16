import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseVaultForPeek, formatPeekOutput, runPeek } from './peek';

function writeTmp(content: string): string {
  const p = path.join(os.tmpdir(), `peek-test-${Date.now()}.vault`);
  fs.writeFileSync(p, content, 'utf-8');
  return p;
}

describe('parseVaultForPeek', () => {
  it('parses key-value pairs', () => {
    const entries = parseVaultForPeek('API_KEY=supersecretvalue\nDB_PASS=abc');
    expect(entries).toHaveLength(2);
    expect(entries[0].key).toBe('API_KEY');
    expect(entries[0].length).toBe(15);
  });

  it('skips comments and blank lines', () => {
    const entries = parseVaultForPeek('# comment\n\nFOO=bar');
    expect(entries).toHaveLength(1);
    expect(entries[0].key).toBe('FOO');
  });

  it('masks short values fully', () => {
    const entries = parseVaultForPeek('X=abc');
    expect(entries[0].preview).toBe('***');
  });

  it('shows partial preview for longer values', () => {
    const entries = parseVaultForPeek('TOKEN=abcdefghij');
    expect(entries[0].preview).toMatch(/^abc\.\.\./);
  });
});

describe('formatPeekOutput', () => {
  it('returns message when no entries', () => {
    expect(formatPeekOutput([])).toBe('No entries found in vault.');
  });

  it('includes header and entries', () => {
    const out = formatPeekOutput([{ key: 'FOO', preview: 'ba*', length: 3 }]);
    expect(out).toContain('FOO');
    expect(out).toContain('ba*');
    expect(out).toContain('3 chars');
  });
});

describe('runPeek', () => {
  it('prints vault peek output', () => {
    const p = writeTmp('SECRET=helloworld\nTOKEN=xyz');
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    runPeek(p);
    expect(spy).toHaveBeenCalled();
    const output = spy.mock.calls[0][0] as string;
    expect(output).toContain('SECRET');
    spy.mockRestore();
    fs.unlinkSync(p);
  });

  it('exits if vault not found', () => {
    const exit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() => runPeek('/nonexistent/path.vault')).toThrow('exit');
    exit.mockRestore();
  });
});
