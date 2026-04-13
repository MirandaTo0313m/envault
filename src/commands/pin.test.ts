import { parsePinnedKeys, pinKeyInVault, unpinKeyInVault } from './pin';

const BASE_VAULT = `DB_HOST=encrypted_abc123
DB_PORT=encrypted_def456
API_KEY=encrypted_ghi789
`;

describe('parsePinnedKeys', () => {
  it('returns empty array when no pins', () => {
    expect(parsePinnedKeys(BASE_VAULT)).toEqual([]);
  });

  it('parses a single pinned key', () => {
    const vault = `# @pinned:DB_HOST pinned_at=2024-01-01T00:00:00.000Z\n${BASE_VAULT}`;
    const result = parsePinnedKeys(vault);
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('DB_HOST');
    expect(result[0].pinnedAt).toBe('2024-01-01T00:00:00.000Z');
  });

  it('parses multiple pinned keys', () => {
    const vault = `# @pinned:DB_HOST pinned_at=2024-01-01T00:00:00.000Z\n# @pinned:API_KEY pinned_at=2024-02-01T00:00:00.000Z\n${BASE_VAULT}`;
    const result = parsePinnedKeys(vault);
    expect(result).toHaveLength(2);
  });
});

describe('pinKeyInVault', () => {
  it('adds a pin comment before the key line', () => {
    const result = pinKeyInVault(BASE_VAULT, 'DB_HOST');
    const lines = result.split('\n');
    const pinIdx = lines.findIndex(l => l.includes('@pinned:DB_HOST'));
    const keyIdx = lines.findIndex(l => l.startsWith('DB_HOST='));
    expect(pinIdx).toBeGreaterThanOrEqual(0);
    expect(pinIdx).toBe(keyIdx - 1);
  });

  it('does not double-pin a key', () => {
    const once = pinKeyInVault(BASE_VAULT, 'DB_HOST');
    const twice = pinKeyInVault(once, 'DB_HOST');
    const count = (twice.match(/@pinned:DB_HOST/g) || []).length;
    expect(count).toBe(1);
  });

  it('throws if key does not exist', () => {
    expect(() => pinKeyInVault(BASE_VAULT, 'MISSING_KEY')).toThrow('not found in vault');
  });
});

describe('unpinKeyInVault', () => {
  it('removes the pin comment', () => {
    const pinned = pinKeyInVault(BASE_VAULT, 'DB_HOST');
    const unpinned = unpinKeyInVault(pinned, 'DB_HOST');
    expect(unpinned).not.toContain('@pinned:DB_HOST');
    expect(unpinned).toContain('DB_HOST=encrypted_abc123');
  });

  it('throws if key is not pinned', () => {
    expect(() => unpinKeyInVault(BASE_VAULT, 'DB_HOST')).toThrow('is not pinned');
  });
});
