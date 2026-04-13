import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { runMerge } from './commands/merge';

function writeTmp(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

describe('runMerge integration', () => {
  let tmpDir: string;
  let vaultPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-merge-'));
    vaultPath = path.join(tmpDir, '.vault');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('merges a source vault into an empty vault', () => {
    const source = writeTmp(tmpDir, 'source.vault', 'FOO=bar\nBAZ=qux');
    runMerge(source, 'theirs', vaultPath);
    const result = fs.readFileSync(vaultPath, 'utf-8');
    expect(result).toContain('FOO=bar');
    expect(result).toContain('BAZ=qux');
  });

  it('respects ours strategy on conflict', () => {
    writeTmp(tmpDir, '.vault', 'FOO=original');
    fs.copyFileSync(path.join(tmpDir, '.vault'), vaultPath);
    const source = writeTmp(tmpDir, 'source.vault', 'FOO=overwritten\nNEW=val');
    runMerge(source, 'ours', vaultPath);
    const result = fs.readFileSync(vaultPath, 'utf-8');
    expect(result).toContain('FOO=original');
    expect(result).toContain('NEW=val');
  });

  it('respects theirs strategy on conflict', () => {
    fs.writeFileSync(vaultPath, 'FOO=original', 'utf-8');
    const source = writeTmp(tmpDir, 'source.vault', 'FOO=overwritten');
    runMerge(source, 'theirs', vaultPath);
    const result = fs.readFileSync(vaultPath, 'utf-8');
    expect(result).toContain('FOO=overwritten');
  });

  it('exits with error when source file does not exist', () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() => runMerge('/nonexistent/file.vault', 'theirs', vaultPath)).toThrow('exit');
    exitSpy.mockRestore();
  });
});
