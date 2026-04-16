import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  parseVaultForSort,
  sortVaultEntries,
  serializeSortedVault,
  runSort,
} from './sort';

function writeTmp(content: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-sort-'));
  const file = path.join(dir, 'vault.env');
  fs.writeFileSync(file, content, 'utf-8');
  return file;
}

const SAMPLE_VAULT = `# envault vault
ZEBRA=enc:abc123
APPLE=enc:def456
MIDDLE=enc:ghi789
`;

describe('parseVaultForSort', () => {
  it('separates header comments from entries', () => {
    const { header, entries } = parseVaultForSort(SAMPLE_VAULT);
    expect(header).toContain('# envault vault');
    expect(entries).toHaveLength(3);
    expect(entries.map(e => e.key)).toEqual(['ZEBRA', 'APPLE', 'MIDDLE']);
  });

  it('handles vault with no header', () => {
    const { header, entries } = parseVaultForSort('FOO=enc:1\nBAR=enc:2\n');
    expect(header).toHaveLength(0);
    expect(entries).toHaveLength(2);
  });
});

describe('sortVaultEntries', () => {
  it('sorts entries ascending by default', () => {
    const { entries } = parseVaultForSort(SAMPLE_VAULT);
    const sorted = sortVaultEntries(entries);
    expect(sorted.map(e => e.key)).toEqual(['APPLE', 'MIDDLE', 'ZEBRA']);
  });

  it('sorts entries descending when specified', () => {
    const { entries } = parseVaultForSort(SAMPLE_VAULT);
    const sorted = sortVaultEntries(entries, 'desc');
    expect(sorted.map(e => e.key)).toEqual(['ZEBRA', 'MIDDLE', 'APPLE']);
  });

  it('does not mutate the original array', () => {
    const { entries } = parseVaultForSort(SAMPLE_VAULT);
    const original = entries.map(e => e.key);
    sortVaultEntries(entries, 'asc');
    expect(entries.map(e => e.key)).toEqual(original);
  });
});

describe('serializeSortedVault', () => {
  it('preserves header and writes sorted entries', () => {
    const { header, entries } = parseVaultForSort(SAMPLE_VAULT);
    const sorted = sortVaultEntries(entries);
    const output = serializeSortedVault(header, sorted);
    expect(output).toContain('# envault vault');
    const lines = output.split('\n').filter(l => l.includes('='));
    expect(lines[0]).toContain('APPLE');
    expect(lines[2]).toContain('ZEBRA');
  });
});

describe('runSort', () => {
  it('writes sorted vault to file', () => {
    const file = writeTmp(SAMPLE_VAULT);
    runSort(file, 'asc');
    const result = fs.readFileSync(file, 'utf-8');
    const lines = result.split('\n').filter(l => l.includes('='));
    expect(lines[0]).toContain('APPLE');
  });

  it('prints output in dry-run mode without writing', () => {
    const file = writeTmp(SAMPLE_VAULT);
    const before = fs.readFileSync(file, 'utf-8');
    const logs: string[] = [];
    const spy = vi.spyOn(console, 'log').mockImplementation((...args) => logs.push(args.join(' ')));
    runSort(file, 'asc', true);
    spy.mockRestore();
    expect(fs.readFileSync(file, 'utf-8')).toBe(before);
    expect(logs.join('\n')).toContain('APPLE');
  });

  it('exits on missing vault file', () => {
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() => runSort('/nonexistent/vault.env')).toThrow('exit');
    exit.mockRestore();
  });
});
