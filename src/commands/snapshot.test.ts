import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  createSnapshot,
  listSnapshots,
  restoreSnapshot,
  getSnapshotsDir,
} from './snapshot';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-snapshot-'));
}

describe('snapshot', () => {
  let tmpDir: string;
  let vaultPath: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    vaultPath = path.join(tmpDir, '.env.vault');
    fs.writeFileSync(vaultPath, 'KEY1=enc:abc\nKEY2=enc:def\n');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('creates a snapshot file in the snapshots dir', () => {
    const snap = createSnapshot(vaultPath, 'before-release', tmpDir);
    expect(snap.label).toBe('before-release');
    expect(snap.vaultContent).toContain('KEY1=enc:abc');

    const dir = getSnapshotsDir(tmpDir);
    const files = fs.readdirSync(dir);
    expect(files.length).toBe(1);
    expect(files[0]).toMatch(/before-release/);
  });

  it('lists snapshots in reverse chronological order', () => {
    createSnapshot(vaultPath, 'snap-a', tmpDir);
    fs.writeFileSync(vaultPath, 'KEY1=enc:xyz\n');
    createSnapshot(vaultPath, 'snap-b', tmpDir);

    const snaps = listSnapshots(tmpDir);
    expect(snaps.length).toBe(2);
    expect(snaps[0].label).toBe('snap-b');
    expect(snaps[1].label).toBe('snap-a');
  });

  it('returns empty array when no snapshots exist', () => {
    const snaps = listSnapshots(tmpDir);
    expect(snaps).toEqual([]);
  });

  it('restores vault content from a snapshot', () => {
    createSnapshot(vaultPath, 'original', tmpDir);
    fs.writeFileSync(vaultPath, 'KEY1=enc:changed\n');
    createSnapshot(vaultPath, 'changed', tmpDir);

    // index 1 is the older 'original' snapshot
    restoreSnapshot(1, vaultPath, tmpDir);
    const restored = fs.readFileSync(vaultPath, 'utf-8');
    expect(restored).toContain('KEY1=enc:abc');
  });

  it('throws when vault file does not exist', () => {
    expect(() => createSnapshot('/nonexistent/path.vault', 'test', tmpDir)).toThrow(
      'Vault file not found'
    );
  });

  it('throws when snapshot index is out of range', () => {
    createSnapshot(vaultPath, 'only', tmpDir);
    expect(() => restoreSnapshot(5, vaultPath, tmpDir)).toThrow('out of range');
  });
});
