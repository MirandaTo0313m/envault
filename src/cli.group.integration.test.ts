import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execSync } from 'child_process';

function setup(): { vaultPath: string; cleanup: () => void } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-group-'));
  const vaultPath = path.join(dir, '.env.vault');
  fs.writeFileSync(vaultPath, 'DB_HOST=localhost\nDB_PORT=5432\nAPP_SECRET=mysecret\n', 'utf-8');
  return {
    vaultPath,
    cleanup: () => fs.rmSync(dir, { recursive: true, force: true }),
  };
}

describe('group integration', () => {
  it('assigns keys to a group and lists them', () => {
    const { vaultPath, cleanup } = setup();
    const env = { ...process.env, VAULT_PATH: vaultPath };

    execSync(`npx ts-node src/cli.ts group set database DB_HOST DB_PORT`, { env });
    const content = fs.readFileSync(vaultPath, 'utf-8');
    expect(content).toContain('# @group:database');
    expect(content).toContain('DB_HOST=localhost');
    expect(content).toContain('# @endgroup');

    cleanup();
  });

  it('list command outputs group names', () => {
    const { vaultPath, cleanup } = setup();
    const env = { ...process.env, VAULT_PATH: vaultPath };

    execSync(`npx ts-node src/cli.ts group set infra DB_HOST`, { env });
    const output = execSync(`npx ts-node src/cli.ts group list`, { env }).toString();
    expect(output).toContain('infra');
    expect(output).toContain('DB_HOST');

    cleanup();
  });

  it('ungrouped keys appear under (ungrouped)', () => {
    const { vaultPath, cleanup } = setup();
    const env = { ...process.env, VAULT_PATH: vaultPath };

    execSync(`npx ts-node src/cli.ts group set database DB_HOST`, { env });
    const output = execSync(`npx ts-node src/cli.ts group list`, { env }).toString();
    expect(output).toContain('ungrouped');
    expect(output).toContain('APP_SECRET');

    cleanup();
  });
});
