import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  hashValue,
  parseVaultValues,
  parseEnvValues,
  verifyVaultIntegrity,
} from './verify';

function writeTmp(name: string, content: string): string {
  const p = path.join(os.tmpdir(), `envault-verify-${Date.now()}-${name}`);
  fs.writeFileSync(p, content, 'utf-8');
  return p;
}

describe('hashValue', () => {
  it('returns a 16-char hex string', () => {
    const h = hashValue('hello');
    expect(h).toHaveLength(16);
    expect(h).toMatch(/^[0-9a-f]+$/);
  });

  it('is deterministic', () => {
    expect(hashValue('abc')).toBe(hashValue('abc'));
  });

  it('differs for different values', () => {
    expect(hashValue('a')).not.toBe(hashValue('b'));
  });
});

describe('parseVaultValues', () => {
  it('parses key=value lines', () => {
    const p = writeTmp('vault.env', 'FOO=bar\nBAZ=qux\n');
    expect(parseVaultValues(p)).toEqual({ FOO: 'bar', BAZ: 'qux' });
    fs.unlinkSync(p);
  });

  it('ignores comments and blank lines', () => {
    const p = writeTmp('vault.env', '# comment\n\nKEY=val\n');
    expect(parseVaultValues(p)).toEqual({ KEY: 'val' });
    fs.unlinkSync(p);
  });

  it('returns empty object when file missing', () => {
    expect(parseVaultValues('/nonexistent/path')).toEqual({});
  });
});

describe('parseEnvValues', () => {
  it('parses .env file', () => {
    const p = writeTmp('.env', 'A=1\nB=2\n');
    expect(parseEnvValues(p)).toEqual({ A: '1', B: '2' });
    fs.unlinkSync(p);
  });
});

describe('verifyVaultIntegrity', () => {
  it('reports match when values are identical', () => {
    const vault = writeTmp('vault', 'SECRET=hello\n');
    const env = writeTmp('env', 'SECRET=hello\n');
    const results = verifyVaultIntegrity(vault, env);
    expect(results).toHaveLength(1);
    expect(results[0].match).toBe(true);
    fs.unlinkSync(vault);
    fs.unlinkSync(env);
  });

  it('reports mismatch when values differ', () => {
    const vault = writeTmp('vault', 'SECRET=hello\n');
    const env = writeTmp('env', 'SECRET=world\n');
    const results = verifyVaultIntegrity(vault, env);
    expect(results[0].match).toBe(false);
    fs.unlinkSync(vault);
    fs.unlinkSync(env);
  });

  it('reports missing key in env', () => {
    const vault = writeTmp('vault', 'SECRET=hello\n');
    const env = writeTmp('env', '');
    const results = verifyVaultIntegrity(vault, env);
    expect(results[0].envHash).toBe('(missing)');
    expect(results[0].match).toBe(false);
    fs.unlinkSync(vault);
    fs.unlinkSync(env);
  });
});
