import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Command } from 'commander';
import { registerAliasCommand } from './cli.alias';

function setup(): { vaultPath: string; program: Command } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-alias-int-'));
  const vaultPath = path.join(dir, '.vault');
  fs.writeFileSync(vaultPath, 'API_KEY=secret123\nDB_PASS=hunter2\n', 'utf-8');
  const program = new Command();
  program.exitOverride();
  registerAliasCommand(program);
  return { vaultPath, program };
}

describe('alias CLI integration', () => {
  it('sets an alias via CLI', () => {
    const { vaultPath, program } = setup();
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    program.parse(['alias', 'set', 'API_KEY', 'api', '--vault', vaultPath], { from: 'user' });
    const content = fs.readFileSync(vaultPath, 'utf-8');
    expect(content).toContain('#alias:api');
    spy.mockRestore();
  });

  it('lists aliases via CLI', () => {
    const { vaultPath, program } = setup();
    fs.writeFileSync(vaultPath, 'API_KEY=secret123 #alias:api\nDB_PASS=hunter2\n', 'utf-8');
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    program.parse(['alias', 'list', '--vault', vaultPath], { from: 'user' });
    expect(spy).toHaveBeenCalledWith('api -> API_KEY');
    spy.mockRestore();
  });

  it('removes an alias via CLI', () => {
    const { vaultPath, program } = setup();
    fs.writeFileSync(vaultPath, 'API_KEY=secret123 #alias:api\n', 'utf-8');
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    program.parse(['alias', 'remove', 'API_KEY', '--vault', vaultPath], { from: 'user' });
    const content = fs.readFileSync(vaultPath, 'utf-8');
    expect(content).not.toContain('#alias:');
    spy.mockRestore();
  });

  it('exits with error for missing key on set', () => {
    const { vaultPath, program } = setup();
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    program.parse(['alias', 'set', 'MISSING_KEY', 'alias1', '--vault', vaultPath], { from: 'user' });
    expect(errSpy).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
    errSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
