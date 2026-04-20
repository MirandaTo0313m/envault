import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execSync } from 'child_process';

const CLI = path.resolve(__dirname, '../dist/cli.js');

function setup(): { dir: string; vault: string; env: string } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-verify-int-'));
  const vault = path.join(dir, '.env.vault');
  const env = path.join(dir, '.env');
  return { dir, vault, env };
}

function runVerify(vault: string, env: string): string {
  return execSync(`node ${CLI} verify --vault ${vault} --env ${env}`, { stdio: 'pipe' }).toString();
}

describe('cli verify integration', () => {
  it('exits 0 when vault and env match', () => {
    const { vault, env } = setup();
    fs.writeFileSync(vault, 'API_KEY=secret123\n');
    fs.writeFileSync(env, 'API_KEY=secret123\n');
    expect(() => runVerify(vault, env)).not.toThrow();
  });

  it('exits non-zero when values differ', () => {
    const { vault, env } = setup();
    fs.writeFileSync(vault, 'API_KEY=secret123\n');
    fs.writeFileSync(env, 'API_KEY=different\n');
    expect(() => runVerify(vault, env)).toThrow();
  });

  it('exits non-zero when key missing from env', () => {
    const { vault, env } = setup();
    fs.writeFileSync(vault, 'API_KEY=secret123\n');
    fs.writeFileSync(env, '');
    expect(() => runVerify(vault, env)).toThrow();
  });

  it('exits non-zero when vault file does not exist', () => {
    const { dir, env } = setup();
    const missingVault = path.join(dir, '.env.vault.missing');
    fs.writeFileSync(env, 'API_KEY=secret123\n');
    expect(() => runVerify(missingVault, env)).toThrow();
  });
});
