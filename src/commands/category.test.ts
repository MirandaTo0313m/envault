import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  parseVaultWithCategories,
  setCategory,
  removeCategory,
  listCategories,
  serializeVaultWithCategories,
} from './category';

const SAMPLE_VAULT = `# @category database
DB_HOST=localhost
DB_PORT=5432

# @category auth
JWT_SECRET=abc123
API_KEY=xyz789

UNCATEGORIZED=value
`;

function writeTmp(content: string): string {
  const p = path.join(os.tmpdir(), `vault-category-${Date.now()}.env`);
  fs.writeFileSync(p, content, 'utf-8');
  return p;
}

describe('parseVaultWithCategories', () => {
  it('parses categories from vault content', () => {
    const entries = parseVaultWithCategories(SAMPLE_VAULT);
    expect(entries.find(e => e.key === 'DB_HOST')?.category).toBe('database');
    expect(entries.find(e => e.key === 'JWT_SECRET')?.category).toBe('auth');
    expect(entries.find(e => e.key === 'UNCATEGORIZED')?.category).toBeUndefined();
  });

  it('returns all keys', () => {
    const entries = parseVaultWithCategories(SAMPLE_VAULT);
    expect(entries.map(e => e.key)).toContain('DB_HOST');
    expect(entries.map(e => e.key)).toContain('DB_PORT');
    expect(entries.map(e => e.key)).toContain('JWT_SECRET');
    expect(entries.map(e => e.key)).toContain('API_KEY');
  });
});

describe('setCategory', () => {
  it('sets category on a key', () => {
    const entries = parseVaultWithCategories(SAMPLE_VAULT);
    const updated = setCategory(entries, 'UNCATEGORIZED', 'misc');
    expect(updated.find(e => e.key === 'UNCATEGORIZED')?.category).toBe('misc');
  });

  it('does not affect other keys', () => {
    const entries = parseVaultWithCategories(SAMPLE_VAULT);
    const updated = setCategory(entries, 'DB_HOST', 'infra');
    expect(updated.find(e => e.key === 'JWT_SECRET')?.category).toBe('auth');
  });
});

describe('removeCategory', () => {
  it('removes category from a key', () => {
    const entries = parseVaultWithCategories(SAMPLE_VAULT);
    const updated = removeCategory(entries, 'DB_HOST');
    expect(updated.find(e => e.key === 'DB_HOST')?.category).toBeUndefined();
  });
});

describe('listCategories', () => {
  it('groups keys by category', () => {
    const entries = parseVaultWithCategories(SAMPLE_VAULT);
    const cats = listCategories(entries);
    expect(cats['database']).toContain('DB_HOST');
    expect(cats['auth']).toContain('JWT_SECRET');
    expect(cats['(uncategorized)']).toContain('UNCATEGORIZED');
  });
});

describe('serializeVaultWithCategories', () => {
  it('serializes entries grouping by category', () => {
    const entries = parseVaultWithCategories(SAMPLE_VAULT);
    const output = serializeVaultWithCategories(entries);
    expect(output).toContain('# @category database');
    expect(output).toContain('DB_HOST=localhost');
  });

  it('round-trips correctly', () => {
    const entries = parseVaultWithCategories(SAMPLE_VAULT);
    const serialized = serializeVaultWithCategories(entries);
    const reparsed = parseVaultWithCategories(serialized);
    expect(reparsed.find(e => e.key === 'DB_HOST')?.category).toBe('database');
  });
});
