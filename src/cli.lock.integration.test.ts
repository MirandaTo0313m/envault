import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Command } from 'commander';
import { registerLockCommand } from './cli.lock';

function setup(): { vaultPath: string; program: Command } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-lock-int-'));
  const vaultPath = path.join(dir, '.env.vault');
  fs.writeFileSync(vaultPath, 'SECRET=abc\n', 'utf-8');
  const program = new Command();
  program.exitOverride();
  registerLockCommand(program);
  return { vaultPath, program };
}

describe('CLI lock integration', () => {
  it('locks the vault via CLI', () => {
    const { vaultPath, program } = setup();
    program.parse(['lock', '--vault', vaultPath], { from: 'user' });
    expect(fs.existsSync(vaultPath + '.lock')).toBe(true);
  });

  it('unlocks the vault via CLI', () => {
    const { vaultPath, program } = setup();
    fs.writeFileSync(
      vaultPath + '.lock',
      JSON.stringify({ isLocked: true, lockedAt: new Date().toISOString(), lockedBy: 'ci' }),
      'utf-8'
    );
    program.parse(['lock', '--unlock', '--vault', vaultPath], { from: 'user' });
    expect(fs.existsSync(vaultPath + '.lock')).toBe(false);
  });

  it('reports already locked without overwriting', () => {
    const { vaultPath, program } = setup();
    const original = { isLocked: true, lockedAt: '2024-01-01T00:00:00.000Z', lockedBy: 'original' };
    fs.writeFileSync(vaultPath + '.lock', JSON.stringify(original), 'utf-8');
    program.parse(['lock', '--vault', vaultPath], { from: 'user' });
    const raw = fs.readFileSync(vaultPath + '.lock', 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed.lockedBy).toBe('original');
  });
});
