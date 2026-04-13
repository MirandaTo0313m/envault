import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseHistoryFromVault, appendHistoryEntry, runHistory } from './history';

function createTempVault(content: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-history-'));
  const vaultPath = path.join(dir, '.env.vault');
  fs.writeFileSync(vaultPath, content, 'utf-8');
  return vaultPath;
}

describe('parseHistoryFromVault', () => {
  it('parses history entries from vault file', () => {
    const vaultPath = createTempVault(
      '# history: API_KEY 2024-01-01T00:00:00.000Z added abc123\n' +
      '# history: DB_URL 2024-01-02T00:00:00.000Z updated def456\n'
    );
    const entries = parseHistoryFromVault(vaultPath);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({ key: 'API_KEY', action: 'added', hash: 'abc123' });
    expect(entries[1]).toMatchObject({ key: 'DB_URL', action: 'updated', hash: 'def456' });
  });

  it('returns empty array when no history entries exist', () => {
    const vaultPath = createTempVault('API_KEY=encryptedvalue\n');
    const entries = parseHistoryFromVault(vaultPath);
    expect(entries).toHaveLength(0);
  });

  it('throws if vault file does not exist', () => {
    expect(() => parseHistoryFromVault('/nonexistent/.env.vault')).toThrow('Vault file not found');
  });
});

describe('appendHistoryEntry', () => {
  it('appends a history entry to the vault file', () => {
    const vaultPath = createTempVault('');
    appendHistoryEntry(vaultPath, 'SECRET', 'added', 'hash999');
    const content = fs.readFileSync(vaultPath, 'utf-8');
    expect(content).toMatch(/# history: SECRET .+ added hash999/);
  });

  it('appends multiple entries', () => {
    const vaultPath = createTempVault('');
    appendHistoryEntry(vaultPath, 'KEY1', 'added', 'h1');
    appendHistoryEntry(vaultPath, 'KEY1', 'updated', 'h2');
    const entries = parseHistoryFromVault(vaultPath);
    expect(entries).toHaveLength(2);
    expect(entries[1].action).toBe('updated');
  });
});

describe('runHistory', () => {
  it('filters by key when provided', () => {
    const vaultPath = createTempVault(
      '# history: API_KEY 2024-01-01T00:00:00.000Z added abc\n' +
      '# history: DB_URL 2024-01-01T00:00:00.000Z added xyz\n'
    );
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    runHistory({ key: 'API_KEY', vaultPath });
    const output = spy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('API_KEY');
    expect(output).not.toContain('DB_URL');
    spy.mockRestore();
  });

  it('limits output when limit is provided', () => {
    const lines = Array.from({ length: 5 }, (_, i) =>
      `# history: KEY${i} 2024-01-0${i + 1}T00:00:00.000Z added h${i}`
    ).join('\n') + '\n';
    const vaultPath = createTempVault(lines);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    runHistory({ limit: 2, vaultPath });
    const dataRows = spy.mock.calls.filter((c) => c[0].startsWith('KEY'));
    expect(dataRows).toHaveLength(2);
    spy.mockRestore();
  });
});
