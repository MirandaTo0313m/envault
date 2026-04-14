import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface SnapshotEntry {
  timestamp: string;
  label: string;
  vaultContent: string;
}

const SNAPSHOTS_DIR = '.envault/snapshots';

export function getSnapshotsDir(baseDir: string = process.cwd()): string {
  return path.join(baseDir, SNAPSHOTS_DIR);
}

export function listSnapshots(baseDir: string = process.cwd()): SnapshotEntry[] {
  const dir = getSnapshotsDir(baseDir);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .reverse()
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), 'utf-8');
      return JSON.parse(raw) as SnapshotEntry;
    });
}

export function createSnapshot(
  vaultPath: string,
  label: string,
  baseDir: string = process.cwd()
): SnapshotEntry {
  if (!fs.existsSync(vaultPath)) {
    throw new Error(`Vault file not found: ${vaultPath}`);
  }

  const vaultContent = fs.readFileSync(vaultPath, 'utf-8');
  const timestamp = new Date().toISOString();
  const entry: SnapshotEntry = { timestamp, label, vaultContent };

  const dir = getSnapshotsDir(baseDir);
  fs.mkdirSync(dir, { recursive: true });

  const filename = `${timestamp.replace(/[:.]/g, '-')}_${label.replace(/\s+/g, '-')}.json`;
  fs.writeFileSync(path.join(dir, filename), JSON.stringify(entry, null, 2));

  return entry;
}

export function restoreSnapshot(
  snapshotIndex: number,
  vaultPath: string,
  baseDir: string = process.cwd()
): SnapshotEntry {
  const snapshots = listSnapshots(baseDir);
  if (snapshotIndex < 0 || snapshotIndex >= snapshots.length) {
    throw new Error(`Snapshot index ${snapshotIndex} out of range (0–${snapshots.length - 1})`);
  }

  const entry = snapshots[snapshotIndex];
  fs.writeFileSync(vaultPath, entry.vaultContent);
  return entry;
}

export function runSnapshot(
  action: 'create' | 'list' | 'restore',
  vaultPath: string,
  opts: { label?: string; index?: number } = {}
): void {
  if (action === 'create') {
    const label = opts.label ?? 'manual';
    const snap = createSnapshot(vaultPath, label);
    console.log(`Snapshot created: [${snap.timestamp}] ${snap.label}`);
  } else if (action === 'list') {
    const snaps = listSnapshots();
    if (snaps.length === 0) {
      console.log('No snapshots found.');
    } else {
      snaps.forEach((s, i) => console.log(`[${i}] ${s.timestamp}  ${s.label}`));
    }
  } else if (action === 'restore') {
    const idx = opts.index ?? 0;
    const snap = restoreSnapshot(idx, vaultPath);
    console.log(`Restored snapshot: [${snap.timestamp}] ${snap.label}`);
  }
}
