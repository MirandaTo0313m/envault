import { describe, it, expect, beforeEach } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

function setup() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-ph-'));
  const vault = path.join(dir, '.env.vault');
  fs.writeFileSync(vault, 'API_KEY=supersecret\nPORT=3000\nDEBUG=false\n', 'utf-8');
  return { dir, vault };
}

describe('placeholder integration', () => {
  it('generates a .env.example with placeholders', () => {
    const { dir, vault } = setup();
    const output = path.join(dir, '.env.example');
    execSync(`npx ts-node src/cli.ts placeholder --vault ${vault} --output ${output}`);
    const content = fs.readFileSync(output, 'utf-8');
    expect(content).toContain('API_KEY=<api_key>');
    expect(content).toContain('PORT=<port>');
    expect(content).toContain('DEBUG=<debug>');
  });

  it('output file contains header comment', () => {
    const { dir, vault } = setup();
    const output = path.join(dir, '.env.example');
    execSync(`npx ts-node src/cli.ts placeholder --vault ${vault} --output ${output}`);
    const content = fs.readFileSync(output, 'utf-8');
    expect(content).toContain('# .env.example');
    expect(content).toContain('Do not store real secrets');
  });
});
