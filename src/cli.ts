#!/usr/bin/env node
import { Command } from 'commander';
import { runInit } from './commands/init';
import { runEncrypt } from './commands/encrypt';
import { runDecrypt } from './commands/decrypt';
import { runShare } from './commands/share';

const program = new Command();

program
  .name('envault')
  .description('Encrypt and sync .env files using asymmetric keys')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize envault in the current project (generates key pair)')
  .action(async () => {
    await runInit();
  });

program
  .command('encrypt')
  .description('Encrypt the .env file using your public key')
  .option('-f, --file <path>', 'Path to .env file', '.env')
  .action(async (opts) => {
    await runEncrypt(opts.file);
  });

program
  .command('decrypt')
  .description('Decrypt the encrypted env file using your private key')
  .option('-f, --file <path>', 'Path to encrypted file')
  .action(async (opts) => {
    await runDecrypt(opts.file);
  });

program
  .command('share')
  .description('Encrypt the .env file for a specific recipient using their public key')
  .argument('<recipientKey>', 'Path to recipient public key file')
  .option('-f, --file <path>', 'Path to .env file', '.env')
  .action(async (recipientKey, opts) => {
    await runShare(recipientKey, opts.file);
  });

program.parseAsync(process.argv);
