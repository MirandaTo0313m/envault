import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { searchVaultKeys } from './commands/search';

describe('search integration', () => {
  let tmpDir: string;
  let vaultFile: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-search-int-'));
    vaultFile = path.join(tmpDir, '.env.vault');
    const content = [
      '# envault vault file',
      'DATABASE_URL=enc:aabbcc',
      'DATABASE_HOST=enc:ddeeff',
      'REDIS_URL=enc:112233',
      'API_KEY=enc:445566',
      'API_SECRET=enc:778899',
    ].join('\n');
    fs.writeFileSync(vaultFile, content);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('finds all DATABASE keys', () => {
    const results = searchVaultKeys('DATABASE', vaultFile);
    expect(results).toHaveLength(2);
    const keys = results.map((r) => r.key);
    expect(keys).toContain('DATABASE_URL');
    expect(keys).toContain('DATABASE_HOST');
  });

  it('finds API keys case-insensitively', () => {
    const results = searchVaultKeys('api', vaultFile);
    expect(results).toHaveLength(2);
  });

  it('returns all keys when query matches common substring', () => {
    const results = searchVaultKeys('_', vaultFile);
    expect(results).toHaveLength(5);
  });

  it('returns empty for unmatched query', () => {
    const results = searchVaultKeys('STRIPE', vaultFile);
    expect(results).toHaveLength(0);
  });

  it('preview field is populated', () => {
    const results = searchVaultKeys('REDIS', vaultFile);
    expect(results[0].preview).toContain('REDIS_URL');
  });
});
