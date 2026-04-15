import { Command } from 'commander';
import { runGroup } from './commands/group';

export function registerGroupCommand(program: Command): void {
  const group = program
    .command('group')
    .description('Manage key groups within the vault');

  group
    .command('set <groupName> <keys...>')
    .description('Assign one or more keys to a named group')
    .action((groupName: string, keys: string[]) => {
      runGroup(['set', groupName, ...keys]);
    });

  group
    .command('list')
    .description('List all groups and their keys')
    .action(() => {
      runGroup(['list']);
    });
}
