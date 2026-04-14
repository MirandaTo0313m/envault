import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const CLI = path.resolve(__dirname, '../dist/cli.js');

function setup(): { tmpDir: string; vaultPath: string } {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-snap-int-'));
  const vaultPath = path.join(tmpDir, '.env.vault');
  fs.writeFileSync(vaultPath, 'API_KEY=enc:testvalue\nDB_PASS=enc:secret\n');
  // write a lock file indicating unlocked state
  fs.mkdirSync(path.join(tmpDir, '.envault'), { recursive: true });
  fs.writeFileSync(
    path.join(tmpDir, '.envault', 'lock.json'),
    JSON.stringify({ locked: false })
  );
  return { tmpDir, vaultPath };
}

describe('snapshot CLI integration', () => {
  it('creates and lists snapshots', () => {
    const { tmpDir, vaultPath } = setup();
    try {
      const createOut = execSync(
        `node ${CLI} snapshot create --label ci-test`,
        { cwd: tmpDir, env: { ...process.env, ENVAULT_VAULT: vaultPath } }
      ).toString();
      expect(createOut).toContain('ci-test');

      const listOut = execSync(
        `node ${CLI} snapshot list`,
        { cwd: tmpDir, env: { ...process.env, ENVAULT_VAULT: vaultPath } }
      ).toString();
      expect(listOut).toContain('ci-test');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('restores a snapshot', () => {
    const { tmpDir, vaultPath } = setup();
    try {
      execSync(`node ${CLI} snapshot create --label before`, {
        cwd: tmpDir,
        env: { ...process.env, ENVAULT_VAULT: vaultPath },
      });

      fs.writeFileSync(vaultPath, 'API_KEY=enc:changed\n');

      const restoreOut = execSync(
        `node ${CLI} snapshot restore 0`,
        { cwd: tmpDir, env: { ...process.env, ENVAULT_VAULT: vaultPath } }
      ).toString();
      expect(restoreOut).toContain('Restored');

      const content = fs.readFileSync(vaultPath, 'utf-8');
      expect(content).toContain('API_KEY=enc:testvalue');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
