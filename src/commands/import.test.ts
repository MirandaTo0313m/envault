import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseEnvFileToEntries, mergeVaultEntries, serializeVault, runImport } from './import';
import fs from 'fs';

vi.mock('fs');
vi.mock('../crypto/encrypt', () => ({
  encryptWithPublicKey: vi.fn((_, v) => `enc_${v}`),
}));
vi.mock('../crypto/keyPair', () => ({
  loadPublicKey: vi.fn(() => 'mock-public-key'),
}));
vi.mock('../constants', () => ({
  VAULT_FILE: '.envault',
  PUBLIC_KEY_FILE: '.envault.pub',
}));

describe('parseEnvFileToEntries', () => {
  it('parses standard .env file', () => {
    vi.mocked(fs.readFileSync).mockReturnValue('FOO=bar\nBAZ=qux\n');
    const result = parseEnvFileToEntries('.env');
    expect(result).toEqual({ FOO: 'bar', BAZ: 'qux' });
  });

  it('skips comment lines', () => {
    vi.mocked(fs.readFileSync).mockReturnValue('# comment\nFOO=bar\n');
    const result = parseEnvFileToEntries('.env');
    expect(result).toEqual({ FOO: 'bar' });
  });

  it('skips blank lines', () => {
    vi.mocked(fs.readFileSync).mockReturnValue('\n\nFOO=bar\n');
    const result = parseEnvFileToEntries('.env');
    expect(result).toEqual({ FOO: 'bar' });
  });
});

describe('mergeVaultEntries', () => {
  it('does not overwrite existing keys when overwrite=false', () => {
    const result = mergeVaultEntries({ FOO: 'old' }, { FOO: 'new', BAR: 'baz' }, false);
    expect(result.FOO).toBe('old');
    expect(result.BAR).toBe('baz');
  });

  it('overwrites existing keys when overwrite=true', () => {
    const result = mergeVaultEntries({ FOO: 'old' }, { FOO: 'new' }, true);
    expect(result.FOO).toBe('new');
  });
});

describe('serializeVault', () => {
  it('serializes entries to newline-separated key=value', () => {
    const result = serializeVault({ A: '1', B: '2' });
    expect(result).toBe('A=1\nB=2\n');
  });
});

describe('runImport', () => {
  beforeEach(() => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('FOO=bar\n');
  });

  it('writes merged vault to disk', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    await runImport('.env');
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  it('exits if env file does not exist', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(runImport('.env')).rejects.toThrow('exit');
    exitSpy.mockRestore();
  });
});
