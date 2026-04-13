import { readLockStatus } from '../commands/lock';
import { VAULT_FILE } from '../constants';

/**
 * Asserts that the vault is not locked before performing a mutating operation.
 * Exits the process with an error message if the vault is locked.
 */
export function assertUnlocked(vaultPath: string = VAULT_FILE): void {
  const status = readLockStatus(vaultPath);
  if (status.isLocked) {
    const who = status.lockedBy ? ` by ${status.lockedBy}` : '';
    const when = status.lockedAt ? ` at ${status.lockedAt}` : '';
    console.error(`Error: Vault is locked${who}${when}. Run \`envault lock --unlock\` to unlock it.`);
    process.exit(1);
  }
}
