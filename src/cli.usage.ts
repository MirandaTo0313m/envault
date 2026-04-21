import { Command } from 'commander';
import * as path from 'path';
import { runUsage, recordKeyAccess } from './commands/usage';
import { VAULT_DIR } from './constants';

const USAGE_FILE = path.join(VAULT_DIR, 'usage.json');

export function registerUsageCommand(program: Command): void {
  const usage = program
    .command('usage')
    .description('Track and display key access frequency');

  usage
    .command('show')
    .description('Show the most frequently accessed vault keys')
    .option('-n, --top <number>', 'Number of top keys to display', '10')
    .action((opts) => {
      const topN = parseInt(opts.top, 10);
      runUsage(USAGE_FILE, isNaN(topN) ? 10 : topN);
    });

  usage
    .command('record <key>')
    .description('Record an access event for a given key')
    .action((key: string) => {
      recordKeyAccess(USAGE_FILE, key);
      console.log(`Recorded access for key: ${key}`);
    });

  usage
    .command('reset')
    .description('Clear all usage data')
    .action(() => {
      const fs = require('fs');
      if (fs.existsSync(USAGE_FILE)) {
        fs.writeFileSync(USAGE_FILE, JSON.stringify({ entries: [] }, null, 2));
        console.log('Usage data cleared.');
      } else {
        console.log('No usage data to clear.');
      }
    });
}
