import { Command } from 'commander';
import { runLock } from './commands/lock';

export function registerLockCommand(program: Command): void {
  program
    .command('lock')
    .description('Lock the vault to prevent modifications')
    .option('--unlock', 'Unlock a previously locked vault')
    .option('--vault <path>', 'Path to vault file')
    .action((opts) => {
      runLock({
        unlock: opts.unlock ?? false,
        vaultPath: opts.vault,
      });
    });
}
