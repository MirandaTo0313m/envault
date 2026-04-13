import { Command } from 'commander';
import { runMerge } from './commands/merge';

export function registerMergeCommand(program: Command): void {
  program
    .command('merge <source>')
    .description('Merge another vault file into the current vault')
    .option(
      '-s, --strategy <strategy>',
      "Merge strategy: 'ours', 'theirs', or 'union' (default: theirs)",
      'theirs'
    )
    .option('-v, --vault <path>', 'Path to the vault file', '.vault')
    .action((source: string, options: { strategy: string; vault: string }) => {
      const strategy = options.strategy as 'ours' | 'theirs' | 'union';
      if (!['ours', 'theirs', 'union'].includes(strategy)) {
        console.error(`Invalid strategy '${strategy}'. Use ours, theirs, or union.`);
        process.exit(1);
      }
      runMerge(source, strategy, options.vault);
    });
}
