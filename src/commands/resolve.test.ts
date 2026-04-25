import { parseVaultForResolve, resolveValue, resolveVaultEntries } from './resolve';

describe('parseVaultForResolve', () => {
  it('parses simple key=value lines', () => {
    const content = 'FOO=bar\nBAZ=qux';
    const result = parseVaultForResolve(content);
    expect(result).toEqual({ FOO: 'bar', BAZ: 'qux' });
  });

  it('ignores comments and blank lines', () => {
    const content = '# comment\n\nFOO=bar';
    const result = parseVaultForResolve(content);
    expect(result).toEqual({ FOO: 'bar' });
  });

  it('handles values with equals signs', () => {
    const content = 'URL=http://example.com?a=1';
    const result = parseVaultForResolve(content);
    expect(result).toEqual({ URL: 'http://example.com?a=1' });
  });
});

describe('resolveValue', () => {
  const context = { HOST: 'localhost', PORT: '5432', DB: 'mydb' };

  it('returns value unchanged if no references', () => {
    expect(resolveValue('hello', context)).toBe('hello');
  });

  it('substitutes a single reference', () => {
    expect(resolveValue('${HOST}', context)).toBe('localhost');
  });

  it('substitutes multiple references', () => {
    expect(resolveValue('${HOST}:${PORT}', context)).toBe('localhost:5432');
  });

  it('leaves unknown references unchanged', () => {
    expect(resolveValue('${UNKNOWN}', context)).toBe('${UNKNOWN}');
  });

  it('handles nested references', () => {
    const ctx = { BASE: 'http://${HOST}', HOST: 'example.com' };
    expect(resolveValue('${BASE}/path', ctx)).toBe('http://example.com/path');
  });

  it('handles circular references without infinite loop', () => {
    const ctx = { A: '${B}', B: '${A}' };
    const result = resolveValue('${A}', ctx);
    // Should not throw; circular ref left as-is
    expect(typeof result).toBe('string');
  });
});

describe('resolveVaultEntries', () => {
  it('marks entries with references as hadReference=true', () => {
    const entries = { HOST: 'localhost', URL: 'http://${HOST}:8080' };
    const resolved = resolveVaultEntries(entries);
    const urlEntry = resolved.find(e => e.key === 'URL')!;
    expect(urlEntry.hadReference).toBe(true);
    expect(urlEntry.resolvedValue).toBe('http://localhost:8080');
  });

  it('marks plain entries as hadReference=false', () => {
    const entries = { HOST: 'localhost' };
    const resolved = resolveVaultEntries(entries);
    expect(resolved[0].hadReference).toBe(false);
  });

  it('returns all keys', () => {
    const entries = { A: '1', B: '${A}', C: '3' };
    const resolved = resolveVaultEntries(entries);
    expect(resolved).toHaveLength(3);
  });
});
