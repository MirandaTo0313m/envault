import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatOutput, parseVaultEntries } from './export';
import { mergeVaultEntries, parseEnvFileToEntries, serializeVault } from './import';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('export/import integration', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('round-trips env file through vault serialization', () => {
    const envContent = 'DB_HOST=localhost\nDB_PORT=5432\nSECRET=abc123\n';
    const envPath = path.join(tmpDir, '.env');
    fs.writeFileSync(envPath, envContent);

    const entries = parseEnvFileToEntries(envPath);
    expect(entries).toEqual({ DB_HOST: 'localhost', DB_PORT: '5432', SECRET: 'abc123' });

    const serialized = serializeVault(entries);
    const vaultPath = path.join(tmpDir, '.envault');
    fs.writeFileSync(vaultPath, serialized);

    const parsed = parseVaultEntries(fs.readFileSync(vaultPath, 'utf-8'));
    expect(parsed).toEqual(entries);
  });

  it('mergeVaultEntries respects overwrite flag', () => {
    const existing = { FOO: 'enc_old', BAR: 'enc_bar' };
    const incoming = { FOO: 'enc_new', BAZ: 'enc_baz' };

    const noOverwrite = mergeVaultEntries(existing, incoming, false);
    expect(noOverwrite.FOO).toBe('enc_old');
    expect(noOverwrite.BAZ).toBe('enc_baz');

    const withOverwrite = mergeVaultEntries(existing, incoming, true);
    expect(withOverwrite.FOO).toBe('enc_new');
  });

  it('formatOutput json is valid JSON with all keys', () => {
    const entries = { A: 'alpha', B: 'beta' };
    const json = formatOutput(entries, 'json');
    const parsed = JSON.parse(json);
    expect(parsed).toEqual(entries);
  });

  it('formatOutput export wraps values in quotes', () => {
    const entries = { MY_VAR: 'hello world' };
    const result = formatOutput(entries, 'export');
    expect(result).toBe('export MY_VAR="hello world"');
  });
});
