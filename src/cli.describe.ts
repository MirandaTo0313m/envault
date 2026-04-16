import { Command } from 'commander';
import { runDescribe } from './commands/describe';
import { VAULT_FILE } from './constants';

export function registerDescribeCommand(program: Command): void {
  program
    .command('describe <key> <description>')
    .description('Set a human-readable description for a vault key')
    .option('-v, --vault <path>', 'Path to vault file', VAULT_FILE)
    .action((key: string, description: string, options: { vault: string }) => {
      runDescribe(options.vault, key, description);
    });
}
