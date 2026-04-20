import { Command } from 'commander';
import { runCategory } from './commands/category';
import { VAULT_FILE } from './constants';

export function registerCategoryCommand(program: Command): void {
  const category = program
    .command('category')
    .description('Manage categories for vault keys');

  category
    .command('set <key> <category>')
    .description('Assign a category to a vault key')
    .option('-v, --vault <path>', 'Path to vault file', VAULT_FILE)
    .action((key: string, cat: string, opts: { vault: string }) => {
      try {
        runCategory(opts.vault, 'set', key, cat);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  category
    .command('remove <key>')
    .description('Remove category from a vault key')
    .option('-v, --vault <path>', 'Path to vault file', VAULT_FILE)
    .action((key: string, opts: { vault: string }) => {
      try {
        runCategory(opts.vault, 'remove', key);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  category
    .command('list')
    .description('List all categories and their keys')
    .option('-v, --vault <path>', 'Path to vault file', VAULT_FILE)
    .action((opts: { vault: string }) => {
      try {
        runCategory(opts.vault, 'list');
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
