import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { readLockStatus, writeLockStatus, runLock, LockStatus } from './lock';

function tmpVault(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-lock-'));
  const vaultPath = path.join(dir, '.env.vault');
  fs.writeFileSync(vaultPath, 'KEY=value\n', 'utf-8');
  return vaultPath;
}

describe('readLockStatus', () => {
  it('returns isLocked: false when no lock file exists', () => {
    const vaultPath = tmpVault();
    const status = readLockStatus(vaultPath);
    expect(status.isLocked).toBe(false);
  });

  it('returns parsed lock status when lock file exists', () => {
    const vaultPath = tmpVault();
    const mockStatus: LockStatus = { isLocked: true, lockedAt: '2024-01-01T00:00:00.000Z', lockedBy: 'alice' };
    fs.writeFileSync(vaultPath + '.lock', JSON.stringify(mockStatus), 'utf-8');
    const status = readLockStatus(vaultPath);
    expect(status.isLocked).toBe(true);
    expect(status.lockedBy).toBe('alice');
  });
});

describe('writeLockStatus', () => {
  it('writes lock file as JSON', () => {
    const vaultPath = tmpVault();
    const status: LockStatus = { isLocked: true, lockedAt: '2024-01-01T00:00:00.000Z', lockedBy: 'bob' };
    writeLockStatus(status, vaultPath);
    const raw = fs.readFileSync(vaultPath + '.lock', 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed.lockedBy).toBe('bob');
  });
});

describe('runLock', () => {
  it('creates a lock file when vault is unlocked', () => {
    const vaultPath = tmpVault();
    runLock({ vaultPath });
    expect(fs.existsSync(vaultPath + '.lock')).toBe(true);
  });

  it('does not overwrite lock if already locked', () => {
    const vaultPath = tmpVault();
    const status: LockStatus = { isLocked: true, lockedAt: '2024-01-01T00:00:00.000Z', lockedBy: 'alice' };
    fs.writeFileSync(vaultPath + '.lock', JSON.stringify(status), 'utf-8');
    runLock({ vaultPath });
    const after = readLockStatus(vaultPath);
    expect(after.lockedBy).toBe('alice');
  });

  it('removes lock file when unlock flag is set', () => {
    const vaultPath = tmpVault();
    const status: LockStatus = { isLocked: true, lockedAt: '2024-01-01T00:00:00.000Z', lockedBy: 'alice' };
    fs.writeFileSync(vaultPath + '.lock', JSON.stringify(status), 'utf-8');
    runLock({ unlock: true, vaultPath });
    expect(fs.existsSync(vaultPath + '.lock')).toBe(false);
  });

  it('exits with error if vault file not found', () => {
    const spy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() => runLock({ vaultPath: '/nonexistent/.env.vault' })).toThrow('exit');
    spy.mockRestore();
  });
});
