import { Command } from 'commander';
import { runResolve } from './commands/resolve';
import { VAULT_FILE } from './constants';

export function registerResolveCommand(program: Command): void {
  program
    .command('resolve')
    .description(
      'Resolve variable references (${VAR}) in vault values and output the fully substituted result'
    )
    .option('-v, --vault <path>', 'Path to vault file', VAULT_FILE)
    .option(
      '-f, --format <format>',
      'Output format: env (default) or table',
      'env'
    )
    .action((options: { vault: string; format: string }) => {
      const format = options.format === 'table' ? 'table' : 'env';
      runResolve(options.vault, format);
    });
}
