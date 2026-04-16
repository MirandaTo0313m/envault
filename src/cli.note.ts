import { Command } from 'commander';
import { runNote } from './commands/note';
import { VAULT_FILE } from './constants';

export function registerNoteCommand(program: Command): void {
  const note = program
    .command('note')
    .description('Manage inline notes on vault keys');

  note
    .command('set <key> <text>')
    .description('Set a note on a vault key')
    .option('-v, --vault <path>', 'Path to vault file', VAULT_FILE)
    .action((key: string, text: string, opts: { vault: string }) => {
      try {
        runNote(opts.vault, key, 'set', text);
      } catch (e: any) {
        console.error(e.message);
        process.exit(1);
      }
    });

  note
    .command('get <key>')
    .description('Get the note on a vault key')
    .option('-v, --vault <path>', 'Path to vault file', VAULT_FILE)
    .action((key: string, opts: { vault: string }) => {
      try {
        runNote(opts.vault, key, 'get');
      } catch (e: any) {
        console.error(e.message);
        process.exit(1);
      }
    });

  note
    .command('remove <key>')
    .description('Remove the note from a vault key')
    .option('-v, --vault <path>', 'Path to vault file', VAULT_FILE)
    .action((key: string, opts: { vault: string }) => {
      try {
        runNote(opts.vault, key, 'remove');
      } catch (e: any) {
        console.error(e.message);
        process.exit(1);
      }
    });
}
