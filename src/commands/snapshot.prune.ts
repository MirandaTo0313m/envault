import * as fs from 'fs';
import * as path from 'path';
import { getSnapshotsDir, listSnapshots } from './snapshot';

export interface PruneOptions {
  keep?: number;
  olderThanDays?: number;
}

export function pruneSnapshots(
  opts: PruneOptions = {},
  baseDir: string = process.cwd()
): number {
  const { keep = 10, olderThanDays } = opts;
  const dir = getSnapshotsDir(baseDir);

  if (!fs.existsSync(dir)) return 0;

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .reverse();

  const toDelete: string[] = [];

  if (olderThanDays !== undefined) {
    const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
    for (const file of files) {
      const raw = fs.readFileSync(path.join(dir, file), 'utf-8');
      const entry = JSON.parse(raw);
      if (new Date(entry.timestamp).getTime() < cutoff) {
        toDelete.push(file);
      }
    }
  } else {
    if (files.length > keep) {
      toDelete.push(...files.slice(keep));
    }
  }

  for (const file of toDelete) {
    fs.unlinkSync(path.join(dir, file));
  }

  return toDelete.length;
}

export function runPrune(opts: PruneOptions = {}): void {
  const removed = pruneSnapshots(opts);
  if (removed === 0) {
    console.log('No snapshots pruned.');
  } else {
    console.log(`Pruned ${removed} snapshot(s).`);
  }
}
