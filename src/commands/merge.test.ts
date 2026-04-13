import { parseVaultEntries, mergeVaults, serializeMergedVault } from './merge';

describe('parseVaultEntries', () => {
  it('parses simple key=value lines', () => {
    const content = 'FOO=bar\nBAZ=qux';
    const entries = parseVaultEntries(content);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toEqual({ key: 'FOO', value: 'bar' });
    expect(entries[1]).toEqual({ key: 'BAZ', value: 'qux' });
  });

  it('skips comments and blank lines', () => {
    const content = '# comment\n\nFOO=bar';
    const entries = parseVaultEntries(content);
    expect(entries).toHaveLength(1);
  });

  it('parses entries with tags', () => {
    const content = 'API_KEY=secret #tags:prod,backend';
    const entries = parseVaultEntries(content);
    expect(entries[0].tags).toEqual(['prod', 'backend']);
    expect(entries[0].value).toBe('secret');
  });
});

describe('mergeVaults', () => {
  const base = [{ key: 'FOO', value: 'base_foo' }, { key: 'SHARED', value: 'base_shared' }];
  const incoming = [{ key: 'BAR', value: 'inc_bar' }, { key: 'SHARED', value: 'inc_shared' }];

  it('uses incoming values by default (theirs)', () => {
    const result = mergeVaults(base, incoming, 'theirs');
    const shared = result.find((e) => e.key === 'SHARED');
    expect(shared?.value).toBe('inc_shared');
  });

  it('keeps base values when strategy is ours', () => {
    const result = mergeVaults(base, incoming, 'ours');
    const shared = result.find((e) => e.key === 'SHARED');
    expect(shared?.value).toBe('base_shared');
  });

  it('includes all keys in union strategy', () => {
    const result = mergeVaults(base, incoming, 'union');
    const keys = result.map((e) => e.key);
    expect(keys).toContain('FOO');
    expect(keys).toContain('BAR');
    expect(keys).toContain('SHARED');
  });

  it('adds new keys from incoming regardless of strategy', () => {
    const result = mergeVaults(base, incoming, 'ours');
    expect(result.find((e) => e.key === 'BAR')).toBeDefined();
  });
});

describe('serializeMergedVault', () => {
  it('serializes entries to key=value lines', () => {
    const entries = [{ key: 'FOO', value: 'bar' }];
    expect(serializeMergedVault(entries)).toBe('FOO=bar');
  });

  it('includes tag suffix when tags present', () => {
    const entries = [{ key: 'X', value: 'y', tags: ['prod'] }];
    expect(serializeMergedVault(entries)).toBe('X=y #tags:prod');
  });
});
