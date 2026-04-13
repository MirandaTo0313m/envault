import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { searchVaultKeys, runSearch } from './search';

describe('searchVaultKeys', () => {
  let tmpDir: string;
  let vaultFile: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-search-'));
    vaultFile = path.join(tmpDir, '.env.vault');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns matching keys case-insensitively', () => {
    fs.writeFileSync(vaultFile, 'DATABASE_URL=enc:abc123\nAPI_KEY=enc:def456\nDB_HOST=enc:ghi789\n');
    const results = searchVaultKeys('db', vaultFile);
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.key)).toContain('DATABASE_URL');
    expect(results.map((r) => r.key)).toContain('DB_HOST');
  });

  it('returns empty array when no keys match', () => {
    fs.writeFileSync(vaultFile, 'API_KEY=enc:abc\nSECRET=enc:def\n');
    const results = searchVaultKeys('database', vaultFile);
    expect(results).toHaveLength(0);
  });

  it('skips comment lines and blank lines', () => {
    fs.writeFileSync(vaultFile, '# DB comment\n\nDB_PASSWORD=enc:xyz\n');
    const results = searchVaultKeys('db', vaultFile);
    expect(results).toHaveLength(1);
    expect(results[0].key).toBe('DB_PASSWORD');
  });

  it('includes correct line numbers', () => {
    fs.writeFileSync(vaultFile, 'FIRST=enc:1\nSECOND=enc:2\nTHIRD=enc:3\n');
    const results = searchVaultKeys('second', vaultFile);
    expect(results).toHaveLength(1);
    expect(results[0].lineNumber).toBe(2);
  });

  it('throws when vault file does not exist', () => {
    expect(() => searchVaultKeys('key', '/nonexistent/.env.vault')).toThrow(
      'Vault file not found'
    );
  });

  it('exact key match returns single result', () => {
    fs.writeFileSync(vaultFile, 'API_KEY=enc:abc\nAPI_SECRET=enc:def\n');
    const results = searchVaultKeys('API_KEY', vaultFile);
    expect(results).toHaveLength(1);
    expect(results[0].key).toBe('API_KEY');
  });
});

describe('runSearch', () => {
  it('exits with code 1 for empty query', () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() => runSearch('')).toThrow('exit');
    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
  });
});
