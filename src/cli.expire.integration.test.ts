import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execSync } from 'child_process';

const CLI = path.resolve(__dirname, '../dist/cli.js');

function setup(): { vaultPath: string; cleanup: () => void } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-expire-'));
  const vaultPath = path.join(dir, '.env.vault');
  fs.writeFileSync(vaultPath, 'API_KEY=secret123\nDB_PASS=hunter2\n', 'utf-8');
  return { vaultPath, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

describe('expire integration', () => {
  it('sets and lists an expiry date', () => {
    const { vaultPath, cleanup } = setup();
    try {
      execSync(`node ${CLI} expire set API_KEY 2099-01-01T00:00:00Z --vault ${vaultPath}`);
      const out = execSync(`node ${CLI} expire list --vault ${vaultPath}`).toString();
      expect(out).toContain('API_KEY');
      expect(out).toContain('2099-01-01T00:00:00Z');
    } finally {
      cleanup();
    }
  });

  it('check reports expired keys', () => {
    const { vaultPath, cleanup } = setup();
    try {
      execSync(`node ${CLI} expire set API_KEY 2000-01-01T00:00:00Z --vault ${vaultPath}`);
      const out = execSync(`node ${CLI} expire check --vault ${vaultPath} || true`).toString();
      expect(out).toContain('API_KEY');
    } finally {
      cleanup();
    }
  });

  it('removes an expiry date', () => {
    const { vaultPath, cleanup } = setup();
    try {
      execSync(`node ${CLI} expire set API_KEY 2099-06-01T00:00:00Z --vault ${vaultPath}`);
      execSync(`node ${CLI} expire remove API_KEY --vault ${vaultPath}`);
      const out = execSync(`node ${CLI} expire list --vault ${vaultPath}`).toString();
      expect(out).not.toContain('API_KEY');
    } finally {
      cleanup();
    }
  });
});
