import { Command } from 'commander';
import { VAULT_FILE } from './constants';
import { runPin } from './commands/pin';

export function registerPinCommand(program: Command): void {
  const pin = program
    .command('pin <key>')
    .description('Pin a key in the vault to prevent accidental removal or overwrite')
    .option('-v, --vault <path>', 'Path to vault file', VAULT_FILE)
    .option('--unpin', 'Remove the pin from the specified key', false)
    .action((key: string, options: { vault: string; unpin: boolean }) => {
      runPin(options.vault, key, options.unpin);
    });

  return;
}
