import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseVaultEntries, formatOutput, runExport } from './export';
import fs from 'fs';

vi.mock('fs');
vi.mock('../crypto/encrypt', () => ({
  decryptWithPrivateKey: vi.fn((_, v) => `decrypted_${v}`),
}));
vi.mock('../crypto/keyPair', () => ({
  loadPrivateKey: vi.fn(() => 'mock-private-key'),
}));
vi.mock('../constants', () => ({
  VAULT_FILE: '.envault',
  PRIVATE_KEY_FILE: '.envault.key',
}));

describe('parseVaultEntries', () => {
  it('parses key=value lines', () => {
    const result = parseVaultEntries('FOO=bar\nBAZ=qux\n');
    expect(result).toEqual({ FOO: 'bar', BAZ: 'qux' });
  });

  it('handles values with equals signs', () => {
    const result = parseVaultEntries('TOKEN=abc=def==');
    expect(result).toEqual({ TOKEN: 'abc=def==' });
  });

  it('skips empty lines', () => {
    const result = parseVaultEntries('\n\nFOO=bar\n\n');
    expect(result).toEqual({ FOO: 'bar' });
  });
});

describe('formatOutput', () => {
  const entries = { FOO: 'bar', BAZ: 'qux' };

  it('formats as dotenv by default', () => {
    expect(formatOutput(entries, 'dotenv')).toBe('FOO=bar\nBAZ=qux');
  });

  it('formats as json', () => {
    const result = JSON.parse(formatOutput(entries, 'json'));
    expect(result).toEqual(entries);
  });

  it('formats as export statements', () => {
    const result = formatOutput(entries, 'export');
    expect(result).toContain('export FOO="bar"');
    expect(result).toContain('export BAZ="qux"');
  });
});

describe('runExport', () => {
  beforeEach(() => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('FOO=enc_bar\n');
  });

  it('prints to stdout when no output file specified', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await runExport({ format: 'dotenv' });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('writes to file when output is specified', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    await runExport({ output: '.env', format: 'dotenv' });
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  it('exits if vault file does not exist', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(runExport()).rejects.toThrow('exit');
    exitSpy.mockRestore();
  });
});
