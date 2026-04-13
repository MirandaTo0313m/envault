#!/usr/bin/env node
import { Command } from 'commander';
import { runInit } from './commands/init';
import { runEncrypt } from './commands/encrypt';
import { runDecrypt } from './commands/decrypt';
import { runShare } from './commands/share';
import { runAdd } from './commands/add';
import { runRotate } from './commands/rotate';
import { runList } from './commands/list';
import { runRemove } from './commands/remove';
import { runStatus } from './commands/status';
import { runAudit } from './commands/audit';
import { runExport } from './commands/export';
import { runImport } from './commands/import';
import { runInfo } from './commands/info';
import { runSearch } from './commands/search';
import { runDiff } from './commands/diff';
import { runTag } from './commands/tag';
import { runRename } from './commands/rename';
import { runCopy } from './commands/copy';
import { runHistory } from './commands/history';
import { runVerify } from './commands/verify';
import { VAULT_FILE, ENV_FILE } from './constants';

const program = new Command();

program.name('envault').description('Encrypt and sync .env files').version('1.0.0');

program.command('init').description('Initialize envault in this project').action(runInit);
program.command('encrypt').description('Encrypt .env into vault').action(runEncrypt);
program.command('decrypt').description('Decrypt vault into .env').action(runDecrypt);
program.command('share <recipient>').description('Share vault with a recipient').action(runShare);
program.command('add <key> [value]').description('Add or update a key').action(runAdd);
program.command('rotate').description('Rotate encryption keys').action(runRotate);
program.command('list').description('List all vault keys').action(runList);
program.command('remove <key>').description('Remove a key from vault').action(runRemove);
program.command('status').description('Show vault status').action(runStatus);
program.command('audit').description('Audit vault vs .env').action(runAudit);
program.command('export').description('Export vault contents').option('-f, --format <fmt>', 'Output format').action((opts) => runExport(opts.format));
program.command('import <file>').description('Import entries into vault').action(runImport);
program.command('info').description('Show vault metadata').action(runInfo);
program.command('search <query>').description('Search vault keys').action(runSearch);
program.command('diff').description('Diff vault vs .env').action(runDiff);
program.command('tag <key> <tag>').description('Tag a vault entry').action(runTag);
program.command('rename <oldKey> <newKey>').description('Rename a vault key').action(runRename);
program.command('copy <srcKey> <destKey>').description('Copy a vault key').action(runCopy);
program.command('history [key]').description('Show history for a key').action(runHistory);

program
  .command('verify')
  .description('Verify vault and .env values match')
  .option('--vault <path>', 'Path to vault file', VAULT_FILE)
  .option('--env <path>', 'Path to .env file', ENV_FILE)
  .action((opts) => runVerify(opts.vault, opts.env));

program.parse(process.argv);
