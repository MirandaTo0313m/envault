import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import { parseVaultWithExpiry, getExpiredKeys, removeExpiry, serializeVaultWithExpiry, runExpire } from './commands/expire';
import { VAULT_FILE } from './constants';

export function registerExpireCommand(program: Command): void {
  const expire = program
    .command('expire')
    .description('Manage expiry dates on vault keys');

  expire
    .command('set <key> <date>')
    .description('Set an expiry date (ISO 8601) on a vault key')
    .option('-v, --vault <path>', 'Path to vault file', VAULT_FILE)
    .action((key: string, date: string, opts: { vault: string }) => {
      try {
        runExpire(opts.vault, key, date);
      } catch (err: any) {
        console.error(err.message);
        process.exit(1);
      }
    });

  expire
    .command('list')
    .description('List all keys with expiry dates')
    .option('-v, --vault <path>', 'Path to vault file', VAULT_FILE)
    .action((opts: { vault: string }) => {
      const entries = parseVaultWithExpiry(opts.vault);
      const withExpiry = entries.filter(e => e.expiresAt !== null);
      if (withExpiry.length === 0) {
        console.log('No keys have expiry dates set.');
        return;
      }
      withExpiry.forEach(e => console.log(`${e.key}  expires: ${e.expiresAt}`));
    });

  expire
    .command('check')
    .description('Print keys that have already expired')
    .option('-v, --vault <path>', 'Path to vault file', VAULT_FILE)
    .action((opts: { vault: string }) => {
      const entries = parseVaultWithExpiry(opts.vault);
      const expired = getExpiredKeys(entries);
      if (expired.length === 0) {
        console.log('No expired keys found.');
        return;
      }
      console.warn('Expired keys:');
      expired.forEach(e => console.warn(`  ${e.key}  (expired: ${e.expiresAt})`) );
    });

  expire
    .command('remove <key>')
    .description('Remove expiry date from a vault key')
    .option('-v, --vault <path>', 'Path to vault file', VAULT_FILE)
    .action((key: string, opts: { vault: string }) => {
      try {
        let entries = parseVaultWithExpiry(opts.vault);
        entries = removeExpiry(entries, key);
        fs.writeFileSync(opts.vault, serializeVaultWithExpiry(entries), 'utf-8');
        console.log(`Removed expiry from "${key}".`);
      } catch (err: any) {
        console.error(err.message);
        process.exit(1);
      }
    });
}
