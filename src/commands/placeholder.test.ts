import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { parseVaultForPlaceholders, generatePlaceholderFile, runPlaceholder } from './placeholder';

function writeTmp(name: string, content: string): string {
  const p = path.join(os.tmpdir(), name);
  fs.writeFileSync(p, content, 'utf-8');
  return p;
}

describe('parseVaultForPlaceholders', () => {
  it('parses key=value lines', () => {
    const entries = parseVaultForPlaceholders('FOO=bar\nBAZ=qux\n');
    expect(entries).toEqual([
      { key: 'FOO', placeholder: 'bar' },
      { key: 'BAZ', placeholder: 'qux' },
    ]);
  });

  it('skips comments and blank lines', () => {
    const entries = parseVaultForPlaceholders('# comment\n\nKEY=val\n');
    expect(entries).toHaveLength(1);
    expect(entries[0].key).toBe('KEY');
  });

  it('handles empty values', () => {
    const entries = parseVaultForPlaceholders('EMPTY=\n');
    expect(entries[0].placeholder).toBe('');
  });
});

describe('generatePlaceholderFile', () => {
  it('generates placeholder lines', () => {
    const out = generatePlaceholderFile([{ key: 'DB_URL', placeholder: 'postgres://...' }]);
    expect(out).toContain('DB_URL=<db_url>');
    expect(out).toContain('# .env.example');
  });

  it('uses empty string for empty values', () => {
    const out = generatePlaceholderFile([{ key: 'EMPTY', placeholder: '' }]);
    expect(out).toContain('EMPTY=');
  });
});

describe('runPlaceholder', () => {
  it('writes output file', () => {
    const vault = writeTmp('vault_ph.env', 'API_KEY=secret\nDEBUG=true\n');
    const out = path.join(os.tmpdir(), 'env_example_out.env');
    runPlaceholder(vault, out);
    const content = fs.readFileSync(out, 'utf-8');
    expect(content).toContain('API_KEY=_key>');
    expect(content).toContain('DEBUG=<debug>');
  });

  it('exits if vault missing', () => {
    const spy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() => runPlaceholder('/nonexistent/path.env', '/tmp/out.env')).toThrow('exit');
    spy.mockRestore();
  });
});
