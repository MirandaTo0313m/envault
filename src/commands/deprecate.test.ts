import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  parseVaultWithDeprecations,
  setDeprecated,
  removeDeprecated,
  serializeVaultWithDeprecations,
  listDeprecatedKeys,
  runDeprecate,
} from './deprecate';

function writeTmp(content: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-deprecate-'));
  const file = path.join(dir, '.env.vault');
  fs.writeFileSync(file, content, 'utf-8');
  return file;
}

describe('parseVaultWithDeprecations', () => {
  it('parses a deprecated key with since and note', () => {
    const content = '# @deprecated:1.2.0|Use NEW_KEY instead\nOLD_KEY=value';
    const entries = parseVaultWithDeprecations(content);
    const entry = entries.find((e) => e.key === 'OLD_KEY')!;
    expect(entry.deprecated).toBe(true);
    expect(entry.deprecatedSince).toBe('1.2.0');
    expect(entry.deprecationNote).toBe('Use NEW_KEY instead');
  });

  it('parses a deprecated key without metadata', () => {
    const content = '# @deprecated\nFOO=bar';
    const entries = parseVaultWithDeprecations(content);
    const entry = entries.find((e) => e.key === 'FOO')!;
    expect(entry.deprecated).toBe(true);
    expect(entry.deprecatedSince).toBeUndefined();
  });

  it('parses non-deprecated keys normally', () => {
    const content = 'API_KEY=secret';
    const entries = parseVaultWithDeprecations(content);
    const entry = entries.find((e) => e.key === 'API_KEY')!;
    expect(entry.deprecated).toBeUndefined();
  });
});

describe('setDeprecated', () => {
  it('marks a key as deprecated', () => {
    const entries = parseVaultWithDeprecations('FOO=bar');
    const updated = setDeprecated(entries, 'FOO', '2.0.0', 'Use BAR');
    expect(updated[0].deprecated).toBe(true);
    expect(updated[0].deprecatedSince).toBe('2.0.0');
    expect(updated[0].deprecationNote).toBe('Use BAR');
  });
});

describe('removeDeprecated', () => {
  it('removes deprecation from a key', () => {
    const entries = parseVaultWithDeprecations('# @deprecated:1.0.0\nFOO=bar');
    const updated = removeDeprecated(entries, 'FOO');
    const entry = updated.find((e) => e.key === 'FOO')!;
    expect(entry.deprecated).toBeUndefined();
  });
});

describe('serializeVaultWithDeprecations', () => {
  it('round-trips deprecated entries', () => {
    const content = '# @deprecated:1.0.0|Old key\nOLD=val\nNEW=val2';
    const entries = parseVaultWithDeprecations(content);
    const out = serializeVaultWithDeprecations(entries);
    expect(out).toContain('# @deprecated:1.0.0|Old key');
    expect(out).toContain('OLD=val');
  });
});

describe('listDeprecatedKeys', () => {
  it('returns only deprecated entries', () => {
    const content = '# @deprecated\nOLD=1\nNEW=2';
    const entries = parseVaultWithDeprecations(content);
    const deprecated = listDeprecatedKeys(entries);
    expect(deprecated).toHaveLength(1);
    expect(deprecated[0].key).toBe('OLD');
  });
});

describe('runDeprecate', () => {
  it('marks a key as deprecated in the vault file', () => {
    const file = writeTmp('API_KEY=secret\nDB_URL=postgres://localhost');
    runDeprecate(file, 'API_KEY', { since: '3.0.0', note: 'Use NEW_API_KEY' });
    const out = fs.readFileSync(file, 'utf-8');
    expect(out).toContain('# @deprecated:3.0.0|Use NEW_API_KEY');
    expect(out).toContain('API_KEY=secret');
  });

  it('removes deprecation when --remove is passed', () => {
    const file = writeTmp('# @deprecated:1.0.0\nOLD=val');
    runDeprecate(file, 'OLD', { remove: true });
    const out = fs.readFileSync(file, 'utf-8');
    expect(out).not.toContain('@deprecated');
  });

  it('exits with error if key not found', () => {
    const file = writeTmp('FOO=bar');
    const exit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() => runDeprecate(file, 'MISSING', {})).toThrow();
    exit.mockRestore();
  });
});
