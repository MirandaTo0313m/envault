import { Command } from 'commander';
import * as path from 'path';
import { VAULT_FILE } from './constants';
import { runAlias } from './commands/alias';

export function registerAliasCommand(program: Command): void {
  const alias = program
    .command('alias')
    .description('Manage aliases for vault keys');

  alias
    .command('set <key> <alias>')
    .description('Set an alias for a vault key')
    .option('--vault <path>', 'Path to vault file', VAULT_FILE)
    .action((key: string, aliasName: string, opts: { vault: string }) => {
      try {
        runAlias('set', opts.vault, key, aliasName);
      } catch (err: unknown) {
        console.error((err as Error).message);
        process.exit(1);
      }
    });

  alias
    .command('remove <key>')
    .description('Remove the alias from a vault key')
    .option('--vault <path>', 'Path to vault file', VAULT_FILE)
    .action((key: string, opts: { vault: string }) => {
      try {
        runAlias('remove', opts.vault, key);
      } catch (err: unknown) {
        console.error((err as Error).message);
        process.exit(1);
      }
    });

  alias
    .command('list')
    .description('List all key aliases in the vault')
    .option('--vault <path>', 'Path to vault file', VAULT_FILE)
    .action((opts: { vault: string }) => {
      try {
        runAlias('list', opts.vault);
      } catch (err: unknown) {
        console.error((err as Error).message);
        process.exit(1);
      }
    });
}
