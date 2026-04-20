import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseVaultForTrim, trimVaultValues, serializeTrimmedVault, runTrim } from './trim';

function writeTmp(content: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-trim-'));
  const file = path.join(dir, '.env.vault');
  fs.writeFileSync(file, content, 'utf-8');
  return file;
}

describe('parseVaultForTrim', () => {
  it('parses key=value lines', () => {
    const entries = parseVaultForTrim('FOO=bar\nBAZ=  qux  \n');
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({ key: 'FOO', value: 'bar' });
    expect(entries[1]).toMatchObject({ key: 'BAZ', value: '  qux  ' });
  });

  it('ignores comment lines', () => {
    const entries = parseVaultForTrim('# comment\nFOO=bar\n');
    expect(entries).toHaveLength(1);
  });

  it('ignores blank lines', () => {
    const entries = parseVaultForTrim('\nFOO=bar\n\n');
    expect(entries).toHaveLength(1);
  });
});

describe('trimVaultValues', () => {
  it('marks values with surrounding whitespace as changed', () => {
    const entries = [{ key: 'FOO', value: '  hello  ', raw: 'FOO=  hello  ' }];
    const results = trimVaultValues(entries);
    expect(results[0].changed).toBe(true);
    expect(results[0].trimmed).toBe('hello');
  });

  it('does not mark clean values as changed', () => {
    const entries = [{ key: 'BAR', value: 'world', raw: 'BAR=world' }];
    const results = trimVaultValues(entries);
    expect(results[0].changed).toBe(false);
  });
});

describe('serializeTrimmedVault', () => {
  it('replaces only changed values', () => {
    const content = 'FOO=  hello  \nBAR=world\n';
    const entries = parseVaultForTrim(content);
    const results = trimVaultValues(entries);
    const output = serializeTrimmedVault(content, results);
    expect(output).toContain('FOO=hello');
    expect(output).toContain('BAR=world');
  });
});

describe('runTrim', () => {
  it('trims whitespace from vault values in place', () => {
    const file = writeTmp('API_KEY=  abc123  \nDEBUG=true\n');
    runTrim(file);
    const result = fs.readFileSync(file, 'utf-8');
    expect(result).toContain('API_KEY=abc123');
    expect(result).toContain('DEBUG=true');
  });

  it('does not modify file in dry-run mode', () => {
    const original = 'API_KEY=  abc123  \n';
    const file = writeTmp(original);
    runTrim(file, true);
    const result = fs.readFileSync(file, 'utf-8');
    expect(result).toBe(original);
  });

  it('exits with error if vault file does not exist', () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() => runTrim('/nonexistent/.env.vault')).toThrow('exit');
    mockExit.mockRestore();
  });
});
