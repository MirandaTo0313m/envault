#!/usr/bin/env node
import { Command } from 'commander';
import { runInit } from './commands/init';
import { runEncrypt } from './commands/encrypt';
import { runDecrypt } from './commands/decrypt';
import { runAdd } from './commands/add';
import { runList } from './commands/list';
import { runRemove } from './commands/remove';
import { runStatus } from './commands/status';
import { runAudit } from './commands/audit';
import { runExport } from './commands/export';
import { runImport } from './commands/import';
import { runInfo } from './commands/info';
import { runSearch } from './commands/search';
import { runDiff } from './commands/diff';
import { VAULT_FILE, ENV_FILE } from './constants';

const program = new Command();

program
  .name('envault')
  .description('Encrypt and sync .env files using asymmetric keys')
  .version('1.0.0');

program.command('init').description('Initialize envault in the current project').action(runInit);

program.command('encrypt').description('Encrypt .env into vault file').action(runEncrypt);

program.command('decrypt').description('Decrypt vault file into .env').action(runDecrypt);

program.command('add').description('Add or update a key in the vault').action(runAdd);

program.command('list').description('List all keys in the vault').action(runList);

program.command('remove').description('Remove a key from the vault').action(runRemove);

program.command('status').description('Show vault status').action(runStatus);

program.command('audit').description('Audit vault vs .env file').action(runAudit);

program.command('export').description('Export vault to stdout').action(runExport);

program.command('import').description('Import .env into vault').action(runImport);

program.command('info').description('Show vault metadata').action(runInfo);

program.command('search').description('Search vault keys').action(runSearch);

program
  .command('diff')
  .description('Show differences between vault and .env file')
  .option('--vault <path>', 'Path to vault file', VAULT_FILE)
  .option('--env <path>', 'Path to .env file', ENV_FILE)
  .action((opts) => runDiff(opts.vault, opts.env));

program.parseAsync(process.argv).catch((err) => {
  console.error(err.message);
  process.exit(1);
});
