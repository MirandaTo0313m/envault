import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  parseVaultWithComments,
  serializeVaultWithComments,
  setComment,
  runComment,
} from './comment';

function writeTmp(content: string): string {
  const file = path.join(os.tmpdir(), `vault-comment-${Date.now()}.env`);
  fs.writeFileSync(file, content, 'utf-8');
  return file;
}

describe('parseVaultWithComments', () => {
  it('parses entries without comments', () => {
    const entries = parseVaultWithComments('FOO=bar\nBAZ=qux\n');
    expect(entries).toHaveLength(2);
    expect(entries[0]).toEqual({ key: 'FOO', value: 'bar' });
    expect(entries[1].comment).toBeUndefined();
  });

  it('parses entries with preceding comments', () => {
    const content = '# This is foo\nFOO=bar\nBAZ=qux\n';
    const entries = parseVaultWithComments(content);
    expect(entries[0].comment).toBe('This is foo');
    expect(entries[1].comment).toBeUndefined();
  });

  it('ignores blank lines between comment and entry', () => {
    const content = '# note\n\nFOO=bar\n';
    const entries = parseVaultWithComments(content);
    expect(entries[0].comment).toBeUndefined();
  });

  it('parses multiple entries each with their own comment', () => {
    const content = '# first comment\nFOO=bar\n# second comment\nBAZ=qux\n';
    const entries = parseVaultWithComments(content);
    expect(entries[0].comment).toBe('first comment');
    expect(entries[1].comment).toBe('second comment');
  });
});

describe('serializeVaultWithComments', () => {
  it('serializes entries with comments', () => {
    const entries = [{ key: 'FOO', value: 'bar', comment: 'my comment' }];
    const out = serializeVaultWithComments(entries);
    expect(out).toContain('# my comment');
    expect(out).toContain('FOO=bar');
  });

  it('serializes entries without comments', () => {
    const entries = [{ key: 'FOO', value: 'bar' }];
    const out = serializeVaultWithComments(entries);
    expect(out).not.toContain('#');
    expect(out).toContain('FOO=bar');
  });

  it('places comment on the line immediately before the key', () => {
    const entries = [{ key: 'FOO', value: 'bar', comment: 'my comment' }];
    const out = serializeVaultWithComments(entries);
    const lines = out.split('\n').filter(Boolean);
    const commentIndex = lines.findIndex((l) => l === '# my comment');
    const keyIndex = lines.findIndex((l) => l.startsWith('FOO='));
    expect(keyIndex).toBe(commentIndex + 1);
  });
});

describe('setComment', () => {
  it('sets a comment on an existing key', () => {
    const file = writeTmp('FOO=bar\nBAZ=qux\n');
    setComment(file, 'FOO', 'hello world');
    const content = fs.readFileSync(file, 'utf-8');
    expect(content).toContain('# hello world');
    expect(content).toContain('FOO=bar');
  });

  it('throws if key not found', () => {
    const file = writeTmp('FOO=bar\n');
    expect(() => setComment(file, 'MISSING', 'note')).toThrow('Key "MISSING" not found');
  });

  it('throws if vault file not found', () => {
    expect(() => setComment('/nonexistent/vault.env', 'FOO', 'note')).toThrow('Vault file not found');
  });
});

describe('runComment', () => {
  it('prints confirmation after setting comment', () => {
    const file = writeTmp('API_KEY=secret\n');
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    runComment('API_KEY', 'sensitive value', file);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('API_KEY'));
    spy.mockRestore();
  });
});
