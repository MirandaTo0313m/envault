import { Command } from 'commander';
import { runCompare } from './commands/compare';

export function registerCompareCommand(program: Command): void {
  program
    .command('compare <fileA> <fileB>')
    .description('Compare two vault or .env files and show key differences')
    .option('--json', 'Output result as JSON')
    .option('-q, --quiet', 'Suppress summary output')
    .action((fileA: string, fileB: string, opts: { json?: boolean; quiet?: boolean }) => {
      try {
        runCompare(fileA, fileB, { json: opts.json, quiet: opts.quiet });
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
