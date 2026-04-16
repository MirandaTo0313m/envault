import { parseVaultForMask, maskValue, formatMaskedOutput } from './mask';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

function writeTmp(content: string): string {
  const p = path.join(os.tmpdir(), `mask-test-${Date.now()}.vault`);
  fs.writeFileSync(p, content);
  return p;
}

describe('maskValue', () => {
  it('masks values longer than visibleChars', () => {
    expect(maskValue('supersecret')).toBe('supe********');
  });

  it('masks short values fully', () => {
    expect(maskValue('abc')).toBe('***');
  });

  it('respects custom visibleChars', () => {
    expect(maskValue('hello', 2)).toBe('he***');
  });
});

describe('parseVaultForMask', () => {
  it('parses key=value lines', () => {
    const entries = parseVaultForMask('API_KEY=mysecretkey\nDB_PASS=hunter2');
    expect(entries).toHaveLength(2);
    expect(entries[0].key).toBe('API_KEY');
    expect(entries[0].original).toBe('mysecretkey');
    expect(entries[0].masked).not.toBe('mysecretkey');
  });

  it('skips comments and blank lines', () => {
    const entries = parseVaultForMask('# comment\n\nFOO=bar');
    expect(entries).toHaveLength(1);
    expect(entries[0].key).toBe('FOO');
  });

  it('returns empty array for empty content', () => {
    expect(parseVaultForMask('')).toHaveLength(0);
  });
});

describe('formatMaskedOutput', () => {
  it('formats entries as masked key=value lines', () => {
    const entries = parseVaultForMask('TOKEN=abcdefghij');
    const output = formatMaskedOutput(entries);
    expect(output).toContain('TOKEN=');
    expect(output).not.toContain('abcdefghij');
  });

  it('returns message when no entries', () => {
    expect(formatMaskedOutput([])).toBe('No entries found.');
  });
});
