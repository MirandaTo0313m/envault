import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Command } from 'commander';
import { registerNoteCommand } from './cli.note';

function setup(): { vaultPath: string; program: Command } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'note-int-'));
  const vaultPath = path.join(dir, 'test.vault');
  fs.writeFileSync(vaultPath, 'DB_URL=postgres://localhost\nAPI_KEY=secret\n', 'utf-8');
  const program = new Command();
  program.exitOverride();
  registerNoteCommand(program);
  return { vaultPath, program };
}

describe('note integration', () => {
  it('set and get note', () => {
    const { vaultPath, program } = setup();
    program.parse(['node', 'cli', 'note', 'set', 'DB_URL', 'primary db', '--vault', vaultPath]);
    const content = fs.readFileSync(vaultPath, 'utf-8');
    expect(content).toContain('#note: primary db');
  });

  it('get note logs value', () => {
    const { vaultPath, program } = setup();
    fs.writeFileSync(vaultPath, '#note: hello\nDB_URL=x\n', 'utf-8');
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    program.parse(['node', 'cli', 'note', 'get', 'DB_URL', '--vault', vaultPath]);
    expect(spy).toHaveBeenCalledWith('hello');
    spy.mockRestore();
  });

  it('remove note', () => {
    const { vaultPath, program } = setup();
    fs.writeFileSync(vaultPath, '#note: remove me\nAPI_KEY=secret\n', 'utf-8');
    program.parse(['node', 'cli', 'note', 'remove', 'API_KEY', '--vault', vaultPath]);
    const content = fs.readFileSync(vaultPath, 'utf-8');
    expect(content).not.toContain('#note:');
  });
});
