import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execSync } from 'child_process';

function setup() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-annotate-'));
  const vault = path.join(dir, '.env.vault');
  fs.writeFileSync(vault, 'DB_URL=postgres://localhost/db\nAPI_KEY=secret\n');
  return { dir, vault };
}

describe('annotate integration', () => {
  it('sets and lists an annotation', () => {
    const { vault } = setup();
    execSync(`npx ts-node src/cli.ts annotate set API_KEY "The API key" --vault ${vault}`);
    const content = fs.readFileSync(vault, 'utf-8');
    expect(content).toContain('#@annotation: The API key');
    expect(content).toContain('API_KEY=secret');
  });

  it('removes an annotation', () => {
    const { vault } = setup();
    execSync(`npx ts-node src/cli.ts annotate set DB_URL "Database" --vault ${vault}`);
    execSync(`npx ts-node src/cli.ts annotate remove DB_URL --vault ${vault}`);
    const content = fs.readFileSync(vault, 'utf-8');
    expect(content).not.toContain('#@annotation:');
  });

  it('lists annotated keys', () => {
    const { vault } = setup();
    execSync(`npx ts-node src/cli.ts annotate set API_KEY "Key for API" --vault ${vault}`);
    const out = execSync(`npx ts-node src/cli.ts annotate list --vault ${vault}`).toString();
    expect(out).toContain('API_KEY: Key for API');
  });

  it('exits with error for missing key', () => {
    const { vault } = setup();
    expect(() =>
      execSync(`npx ts-node src/cli.ts annotate set MISSING "oops" --vault ${vault}`, { stdio: 'pipe' })
    ).toThrow();
  });
});
