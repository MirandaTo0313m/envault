import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execSync } from 'child_process';

function setupVault(dir: string, content: string): string {
  const vaultPath = path.join(dir, '.env.vault');
  fs.writeFileSync(vaultPath, content, 'utf-8');
  return vaultPath;
}

describe('cli history integration', () => {
  let tmpDir: string;
  let vaultPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-cli-history-'));
    vaultPath = setupVault(
      tmpDir,
      '# history: API_KEY 2024-03-01T10:00:00.000Z added aaa111\n' +
      '# history: DB_URL 2024-03-02T10:00:00.000Z added bbb222\n' +
      '# history: API_KEY 2024-03-03T10:00:00.000Z updated ccc333\n'
    );
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('shows all history entries', () => {
    const { parseHistoryFromVault, runHistory } = require('./commands/history');
    const entries = parseHistoryFromVault(vaultPath);
    expect(entries).toHaveLength(3);
  });

  it('filters history by key', () => {
    const { parseHistoryFromVault } = require('./commands/history');
    const all = parseHistoryFromVault(vaultPath);
    const filtered = all.filter((e: { key: string }) => e.key === 'API_KEY');
    expect(filtered).toHaveLength(2);
    expect(filtered.every((e: { key: string }) => e.key === 'API_KEY')).toBe(true);
  });

  it('limits history entries correctly', () => {
    const { parseHistoryFromVault } = require('./commands/history');
    const all = parseHistoryFromVault(vaultPath);
    const limited = all.slice(-2);
    expect(limited).toHaveLength(2);
    expect(limited[limited.length - 1].hash).toBe('ccc333');
  });

  it('appends and re-reads history entry', () => {
    const { appendHistoryEntry, parseHistoryFromVault } = require('./commands/history');
    appendHistoryEntry(vaultPath, 'NEW_KEY', 'added', 'newHash');
    const entries = parseHistoryFromVault(vaultPath);
    expect(entries).toHaveLength(4);
    expect(entries[3]).toMatchObject({ key: 'NEW_KEY', action: 'added', hash: 'newHash' });
  });
});
