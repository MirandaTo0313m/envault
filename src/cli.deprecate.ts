import { Command } from 'commander';
import * as path from 'path';
import { VAULT_FILE } from './constants';
import { runDeprecate, parseVaultWithDeprecations, listDeprecatedKeys } from './commands/deprecate';
import * as fs from 'fs';

export function registerDeprecateCommand(program: Command): void {
  const cmd = program
    .command('deprecate <key>')
    .description('Mark or unmark a vault key as deprecated')
    .option('--since <version>', 'Version when the key was deprecated')
    .option('--note <message>', 'Deprecation note or migration hint')
    .option('--remove', 'Remove the deprecation marker from the key')
    .option('--list', 'List all deprecated keys in the vault')
    .option('--vault <path>', 'Path to vault file', VAULT_FILE)
    .action((key: string, options: { since?: string; note?: string; remove?: boolean; list?: boolean; vault: string }) => {
      const vaultPath = path.resolve(options.vault);

      if (options.list) {
        if (!fs.existsSync(vaultPath)) {
          console.error(`Vault not found: ${vaultPath}`);
          process.exit(1);
        }
        const content = fs.readFileSync(vaultPath, 'utf-8');
        const entries = parseVaultWithDeprecations(content);
        const deprecated = listDeprecatedKeys(entries);
        if (deprecated.length === 0) {
          console.log('No deprecated keys found.');
        } else {
          console.log(`Deprecated keys (${deprecated.length}):`);
          for (const entry of deprecated) {
            let line = `  ${entry.key}`;
            if (entry.deprecatedSince) line += ` (since ${entry.deprecatedSince})`;
            if (entry.deprecationNote) line += ` — ${entry.deprecationNote}`;
            console.log(line);
          }
        }
        return;
      }

      runDeprecate(vaultPath, key, {
        remove: options.remove,
        since: options.since,
        note: options.note,
      });
    });

  return;
}
