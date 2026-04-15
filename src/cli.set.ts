import { Command } from 'commander';
import { runSet } from './commands/set';

export function registerSetCommand(program: Command): void {
  program
    .command('set <key> <value>')
    .description('Set or update a key-value pair in the vault (value is encrypted)')
    .option('-v, --vault <path>', 'Path to vault file', '.vault')
    .action(async (key: string, value: string, options: { vault: string }) => {
      try {
        await runSet(key, value, options.vault);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
