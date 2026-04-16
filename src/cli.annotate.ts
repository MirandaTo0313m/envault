import { Command } from 'commander';
import { runAnnotate } from './commands/annotate';
import { VAULT_FILE } from './constants';

export function registerAnnotateCommand(program: Command): void {
  const annotate = program
    .command('annotate')
    .description('Manage inline annotations for vault keys');

  annotate
    .command('set <key> <annotation>')
    .description('Set an annotation for a key')
    .option('-v, --vault <path>', 'Path to vault file', VAULT_FILE)
    .action((key: string, annotation: string, opts: { vault: string }) => {
      try {
        runAnnotate(opts.vault, key, 'set', annotation);
      } catch (e: any) {
        console.error(e.message);
        process.exit(1);
      }
    });

  annotate
    .command('remove <key>')
    .description('Remove annotation from a key')
    .option('-v, --vault <path>', 'Path to vault file', VAULT_FILE)
    .action((key: string, opts: { vault: string }) => {
      try {
        runAnnotate(opts.vault, key, 'remove');
      } catch (e: any) {
        console.error(e.message);
        process.exit(1);
      }
    });

  annotate
    .command('list')
    .description('List all annotated keys')
    .option('-v, --vault <path>', 'Path to vault file', VAULT_FILE)
    .action((opts: { vault: string }) => {
      try {
        runAnnotate(opts.vault, '', 'list');
      } catch (e: any) {
        console.error(e.message);
        process.exit(1);
      }
    });
}
