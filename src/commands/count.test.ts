import { countVaultEntries } from './count';

describe('countVaultEntries', () => {
  it('counts total entries', () => {
    const vault = `KEY1=value1\nKEY2=value2\nKEY3=value3`;
    const result = countVaultEntries(vault);
    expect(result.total).toBe(3);
  });

  it('ignores comments and blank lines', () => {
    const vault = `# comment\n\nKEY1=value1`;
    const result = countVaultEntries(vault);
    expect(result.total).toBe(1);
  });

  it('counts empty values', () => {
    const vault = `KEY1=\nKEY2=value`;
    const result = countVaultEntries(vault);
    expect(result.empty).toBe(1);
  });

  it('counts tagged entries', () => {
    const vault = `KEY1=value #tag:prod\nKEY2=value`;
    const result = countVaultEntries(vault);
    expect(result.tagged).toBe(1);
  });

  it('counts pinned entries', () => {
    const vault = `KEY1=value #pinned\nKEY2=value`;
    const result = countVaultEntries(vault);
    expect(result.pinned).toBe(1);
  });

  it('counts archived entries', () => {
    const vault = `KEY1=value #archived\nKEY2=value`;
    const result = countVaultEntries(vault);
    expect(result.archived).toBe(1);
  });

  it('counts expired entries', () => {
    const past = '2000-01-01';
    const vault = `KEY1=value #expires:${past}\nKEY2=value`;
    const result = countVaultEntries(vault);
    expect(result.expired).toBe(1);
  });

  it('does not count future expiry as expired', () => {
    const future = '2099-01-01';
    const vault = `KEY1=value #expires:${future}`;
    const result = countVaultEntries(vault);
    expect(result.expired).toBe(0);
  });

  it('returns zeros for empty vault', () => {
    const result = countVaultEntries('');
    expect(result.total).toBe(0);
    expect(result.empty).toBe(0);
  });
});
