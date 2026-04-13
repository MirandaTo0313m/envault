import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  parseVaultWithTags,
  addTagToEntry,
  filterByTag,
  runTag,
} from './tag';

const tmpDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'envault-tag-'));

function createVault(dir: string, content: string): string {
  const vaultPath = path.join(dir, '.env.vault');
  fs.writeFileSync(vaultPath, content, 'utf-8');
  return vaultPath;
}

describe('parseVaultWithTags', () => {
  it('parses entries without tags', () => {
    const dir = tmpDir();
    const vaultPath = createVault(dir, 'API_KEY=abc123\nDB_URL=postgres://localhost');
    const entries = parseVaultWithTags(vaultPath);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toEqual({ key: 'API_KEY', value: 'abc123', tags: [] });
  });

  it('parses entries with tags', () => {
    const dir = tmpDir();
    const vaultPath = createVault(dir, 'API_KEY=abc123 #tags:prod,backend');
    const entries = parseVaultWithTags(vaultPath);
    expect(entries[0].tags).toEqual(['prod', 'backend']);
  });

  it('returns empty array if vault does not exist', () => {
    const entries = parseVaultWithTags('/nonexistent/.env.vault');
    expect(entries).toEqual([]);
  });
});

describe('addTagToEntry', () => {
  it('adds a tag to an existing key', () => {
    const dir = tmpDir();
    const vaultPath = createVault(dir, 'API_KEY=abc123\n');
    const result = addTagToEntry(vaultPath, 'API_KEY', 'prod');
    expect(result).toBe(true);
    const content = fs.readFileSync(vaultPath, 'utf-8');
    expect(content).toContain('#tags:prod');
  });

  it('does not duplicate existing tags', () => {
    const dir = tmpDir();
    const vaultPath = createVault(dir, 'API_KEY=abc123 #tags:prod\n');
    addTagToEntry(vaultPath, 'API_KEY', 'prod');
    const content = fs.readFileSync(vaultPath, 'utf-8');
    expect(content.match(/prod/g)?.length).toBe(1);
  });

  it('returns false if key does not exist', () => {
    const dir = tmpDir();
    const vaultPath = createVault(dir, 'API_KEY=abc123\n');
    const result = addTagToEntry(vaultPath, 'MISSING_KEY', 'prod');
    expect(result).toBe(false);
  });
});

describe('filterByTag', () => {
  it('returns entries matching the given tag', () => {
    const dir = tmpDir();
    const vaultPath = createVault(
      dir,
      'API_KEY=abc123 #tags:prod\nDB_URL=postgres #tags:dev\nSECRET=xyz #tags:prod,shared'
    );
    const results = filterByTag(vaultPath, 'prod');
    expect(results).toHaveLength(2);
    expect(results.map(r => r.key)).toEqual(['API_KEY', 'SECRET']);
  });

  it('returns empty array if no entries match', () => {
    const dir = tmpDir();
    const vaultPath = createVault(dir, 'API_KEY=abc123 #tags:dev\n');
    const results = filterByTag(vaultPath, 'prod');
    expect(results).toHaveLength(0);
  });
});
