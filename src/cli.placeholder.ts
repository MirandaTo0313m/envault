import { Command } from 'commander';
import path from 'path';
import { VAULT_FILE } from './constants';
import { runPlaceholder } from './commands/placeholder';

export function registerPlaceholderCommand(program: Command): void {
  program
    .command('placeholder')
    .description('Generate a .env.example placeholder file from the vault')
    .option('-v, --vault <path>', 'Path to vault file', VAULT_FILE)
    .option('-o, --output <path>', 'Output path for placeholder file', '.env.example')
    .action((opts) => {
      const vaultPath = path.resolve(opts.vault);
      const outputPath = path.resolve(opts.output);
      runPlaceholder(vaultPath, outputPath);
    });
}
