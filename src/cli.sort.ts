import { Command } from 'commander';
import * as path from 'path';
import { runSort, SortOrder } from './commands/sort';
import { DEFAULT_VAULT_FILE } from './constants';

export function registerSortCommand(program: Command): void {
  program
    .command('sort')
    .description('Sort vault entries alphabetically by key')
    .option(
      '-f, --file <path>',
      'Path to vault file',
      DEFAULT_VAULT_FILE
    )
    .option(
      '-o, --order <order>',
      'Sort order: asc or desc',
      'asc'
    )
    .option(
      '-d, --dry-run',
      'Print sorted output without writing to file',
      false
    )
    .action((opts: { file: string; order: string; dryRun: boolean }) => {
      const vaultPath = path.resolve(opts.file);
      const order = (opts.order === 'desc' ? 'desc' : 'asc') as SortOrder;
      runSort(vaultPath, order, opts.dryRun);
    });
}
