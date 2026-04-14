import { Command } from 'commander';
import { runSnapshot } from './commands/snapshot';
import { VAULT_FILE } from './constants';
import { assertUnlocked } from './utils/assertUnlocked';

export function registerSnapshotCommand(program: Command): void {
  const snapshot = program
    .command('snapshot')
    .description('Manage vault snapshots (create, list, restore)');

  snapshot
    .command('create')
    .description('Create a snapshot of the current vault')
    .option('-l, --label <label>', 'Label for the snapshot', 'manual')
    .action((opts) => {
      assertUnlocked();
      runSnapshot('create', VAULT_FILE, { label: opts.label });
    });

  snapshot
    .command('list')
    .description('List all available snapshots')
    .action(() => {
      runSnapshot('list', VAULT_FILE);
    });

  snapshot
    .command('restore')
    .description('Restore vault from a snapshot by index')
    .argument('<index>', 'Snapshot index (0 = most recent)', parseInt)
    .action((index: number) => {
      assertUnlocked();
      runSnapshot('restore', VAULT_FILE, { index });
    });
}
