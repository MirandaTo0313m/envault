import * as fs from 'fs';
import * as path from 'path';
import { VAULT_FILE, ENV_FILE } from '../constants';

export interface LockStatus {
  isLocked: boolean;
  lockedAt?: string;
  lockedBy?: string;
}

export function readLockStatus(vaultPath: string = VAULT_FILE): LockStatus {
  const lockFile = vaultPath + '.lock';
  if (!fs.existsSync(lockFile)) {
    return { isLocked: false };
  }
  try {
    const raw = fs.readFileSync(lockFile, 'utf-8');
    return JSON.parse(raw) as LockStatus;
  } catch {
    return { isLocked: false };
  }
}

export function writeLockStatus(status: LockStatus, vaultPath: string = VAULT_FILE): void {
  const lockFile = vaultPath + '.lock';
  fs.writeFileSync(lockFile, JSON.stringify(status, null, 2), 'utf-8');
}

export function runLock(args: { unlock?: boolean; vaultPath?: string }): void {
  const vaultPath = args.vaultPath ?? VAULT_FILE;

  if (!fs.existsSync(vaultPath)) {
    console.error(`Vault file not found: ${vaultPath}`);
    process.exit(1);
  }

  if (args.unlock) {
    const lockFile = vaultPath + '.lock';
    if (fs.existsSync(lockFile)) {
      fs.unlinkSync(lockFile);
      console.log('Vault unlocked.');
    } else {
      console.log('Vault is not locked.');
    }
    return;
  }

  const existing = readLockStatus(vaultPath);
  if (existing.isLocked) {
    console.log(`Vault is already locked (since ${existing.lockedAt}).`);
    return;
  }

  const status: LockStatus = {
    isLocked: true,
    lockedAt: new Date().toISOString(),
    lockedBy: process.env.USER ?? 'unknown',
  };

  writeLockStatus(status, vaultPath);
  console.log(`Vault locked at ${status.lockedAt} by ${status.lockedBy}.`);
}
