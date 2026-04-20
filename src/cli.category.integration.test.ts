import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseVaultWithCategories, serializeVaultWithCategories, setCategory, listCategories } from './commands/category';

const INITIAL_VAULT = `DB_HOST=localhost
DB_PORT=5432
JWT_SECRET=abc123
API_KEY=xyz789
`;

function setup(): { vaultPath: string } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-category-'));
  const vaultPath = path.join(dir, '.env.vault');
  fs.writeFileSync(vaultPath, INITIAL_VAULT, 'utf-8');
  return { vaultPath };
}

describe('category integration', () => {
  let vaultPath: string;

  beforeEach(() => {
    ({ vaultPath } = setup());
  });

  it('sets a category and persists it', () => {
    const content = fs.readFileSync(vaultPath, 'utf-8');
    let entries = parseVaultWithCategories(content);
    entries = setCategory(entries, 'DB_HOST', 'database');
    fs.writeFileSync(vaultPath, serializeVaultWithCategories(entries), 'utf-8');

    const updated = fs.readFileSync(vaultPath, 'utf-8');
    expect(updated).toContain('# @category database');
    expect(updated).toContain('DB_HOST=localhost');
  });

  it('lists categories after multiple assignments', () => {
    const content = fs.readFileSync(vaultPath, 'utf-8');
    let entries = parseVaultWithCategories(content);
    entries = setCategory(entries, 'DB_HOST', 'database');
    entries = setCategory(entries, 'DB_PORT', 'database');
    entries = setCategory(entries, 'JWT_SECRET', 'auth');

    const cats = listCategories(entries);
    expect(cats['database']).toEqual(expect.arrayContaining(['DB_HOST', 'DB_PORT']));
    expect(cats['auth']).toContain('JWT_SECRET');
    expect(cats['(uncategorized)']).toContain('API_KEY');
  });

  it('removes a category and key becomes uncategorized', () => {
    let entries = parseVaultWithCategories(
      `# @category auth\nJWT_SECRET=abc123\nAPI_KEY=xyz789\n`
    );
    const { removeCategory } = require('./commands/category');
    entries = removeCategory(entries, 'JWT_SECRET');
    const cats = listCategories(entries);
    expect(cats['(uncategorized)']).toContain('JWT_SECRET');
  });

  it('serializes and re-parses without data loss', () => {
    let entries = parseVaultWithCategories(INITIAL_VAULT);
    entries = setCategory(entries, 'API_KEY', 'integrations');
    const serialized = serializeVaultWithCategories(entries);
    const reparsed = parseVaultWithCategories(serialized);
    expect(reparsed.find(e => e.key === 'API_KEY')?.value).toBe('xyz789');
    expect(reparsed.find(e => e.key === 'API_KEY')?.category).toBe('integrations');
  });
});
