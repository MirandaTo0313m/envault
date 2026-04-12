import fs from "fs";
import path from "path";
import { ENVAULT_DIR, PUBLIC_KEY_FILE, PRIVATE_KEY_FILE } from "../constants";

export interface KeyBackupEntry {
  timestamp: number;
  publicKeyFile: string;
  privateKeyFile: string;
}

export function listKeyBackups(): KeyBackupEntry[] {
  if (!fs.existsSync(ENVAULT_DIR)) return [];

  const files = fs.readdirSync(ENVAULT_DIR);
  const backups: Map<number, Partial<KeyBackupEntry>> = new Map();

  for (const file of files) {
    const pubMatch = file.match(new RegExp(`^${PUBLIC_KEY_FILE}\\.(\\d+)\.bak$`));
    const privMatch = file.match(new RegExp(`^${PRIVATE_KEY_FILE}\\.(\\d+)\.bak$`));

    if (pubMatch) {
      const ts = parseInt(pubMatch[1], 10);
      const entry = backups.get(ts) ?? {};
      entry.timestamp = ts;
      entry.publicKeyFile = path.join(ENVAULT_DIR, file);
      backups.set(ts, entry);
    }

    if (privMatch) {
      const ts = parseInt(privMatch[1], 10);
      const entry = backups.get(ts) ?? {};
      entry.timestamp = ts;
      entry.privateKeyFile = path.join(ENVAULT_DIR, file);
      backups.set(ts, entry);
    }
  }

  return Array.from(backups.values()).filter(
    (e): e is KeyBackupEntry =>
      e.timestamp !== undefined &&
      e.publicKeyFile !== undefined &&
      e.privateKeyFile !== undefined
  ).sort((a, b) => b.timestamp - a.timestamp);
}

export function pruneOldBackups(keepCount = 3): void {
  const backups = listKeyBackups();
  const toDelete = backups.slice(keepCount);

  for (const backup of toDelete) {
    fs.unlinkSync(backup.publicKeyFile);
    fs.unlinkSync(backup.privateKeyFile);
    console.log(`Pruned backup from ${new Date(backup.timestamp).toISOString()}`);
  }
}
