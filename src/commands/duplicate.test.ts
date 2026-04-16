import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseVaultForDuplicate, duplicateKeyInVault, runDuplicate } from './duplicate';

function writeTmp(content: string): string {
  const p = path.join(os.tmpdir(), `vault-dup-${Date.now()}.env`);
  fs.writeFileSync(p, content, 'utf-8');
  return p;
}

describe('parseVaultForDuplicate', () => {
  it('parses key=value lines', () => {
    const map = parseVaultForDuplicate('FOO=bar\nBAZ=qux\n');
    expect(map.get('FOO')).toBe('bar');
    expect(map.get('BAZ')).toBe('qux');
  });

  it('ignores comments and blank lines', () => {
    const map = parseVaultForDuplicate('# comment\n\nKEY=val\n');
    expect(map.size).toBe(1);
    expect(map.get('KEY')).toBe('val');
  });
});

describe('duplicateKeyInVault', () => {
  it('duplicates an existing key', () => {
    const content = 'FOO=bar\nBAZ=qux\n';
    const result = duplicateKeyInVault(content, 'FOO', 'FOO_COPY');
    expect(result).toContain('FOO_COPY=bar');
    expect(result).toContain('FOO=bar');
  });

  it('inserts duplicate after source key', () => {
    const content = 'FOO=bar\nBAZ=qux';
    const result = duplicateKeyInVault(content, 'FOO', 'FOO2');
    const lines = result.split('\n');
    const srcIdx = lines.findIndex(l => l.startsWith('FOO='));
    const dupIdx = lines.findIndex(l => l.startsWith('FOO2='));
    expect(dupIdx).toBe(srcIdx + 1);
  });

  it('throws if source key not found', () => {
    expect(() => duplicateKeyInVault('FOO=bar', 'MISSING', 'COPY')).toThrow('not found');
  });

  it('throws if dest key already exists', () => {
    expect(() => duplicateKeyInVault('FOO=bar\nCOPY=x', 'FOO', 'COPY')).toThrow('already exists');
  });
});

describe('runDuplicate', () => {
  it('writes duplicated vault to file', () => {
    const p = writeTmp('API_KEY=secret\nDEBUG=true\n');
    runDuplicate(p, 'API_KEY', 'API_KEY_BACKUP');
    const content = fs.readFileSync(p, 'utf-8');
    expect(content).toContain('API_KEY_BACKUP=secret');
  });

  it('exits on missing vault file', () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() => runDuplicate('/nonexistent/path.env', 'A', 'B')).toThrow('exit');
    exitSpy.mockRestore();
  });
});
