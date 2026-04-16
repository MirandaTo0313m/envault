import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  parseVaultWithNotes,
  setNote,
  removeNote,
  serializeVaultWithNotes,
  runNote,
} from './note';

function writeTmp(content: string): string {
  const p = path.join(os.tmpdir(), `note-test-${Date.now()}.vault`);
  fs.writeFileSync(p, content, 'utf-8');
  return p;
}

const SAMPLE = `#note: database url\nDB_URL=postgres://localhost\nAPI_KEY=secret\n`;

describe('parseVaultWithNotes', () => {
  it('parses note before key', () => {
    const entries = parseVaultWithNotes(SAMPLE);
    expect(entries[0].key).toBe('DB_URL');
    expect(entries[0].note).toBe('database url');
  });

  it('entry without note has undefined note', () => {
    const entries = parseVaultWithNotes(SAMPLE);
    expect(entries[1].note).toBeUndefined();
  });
});

describe('setNote', () => {
  it('sets note on existing key', () => {
    const entries = parseVaultWithNotes(SAMPLE);
    const updated = setNote(entries, 'API_KEY', 'my api key');
    expect(updated.find(e => e.key === 'API_KEY')?.note).toBe('my api key');
  });
});

describe('removeNote', () => {
  it('removes note from key', () => {
    const entries = parseVaultWithNotes(SAMPLE);
    const updated = removeNote(entries, 'DB_URL');
    expect(updated.find(e => e.key === 'DB_URL')?.note).toBeUndefined();
  });
});

describe('serializeVaultWithNotes', () => {
  it('round-trips correctly', () => {
    const entries = parseVaultWithNotes(SAMPLE);
    const out = serializeVaultWithNotes(entries);
    expect(out).toContain('#note: database url');
    expect(out).toContain('DB_URL=postgres://localhost');
  });
});

describe('runNote', () => {
  it('gets note', () => {
    const p = writeTmp(SAMPLE);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    runNote(p, 'DB_URL', 'get');
    expect(spy).toHaveBeenCalledWith('database url');
    spy.mockRestore();
  });

  it('sets note', () => {
    const p = writeTmp(SAMPLE);
    runNote(p, 'API_KEY', 'set', 'the api key');
    const content = fs.readFileSync(p, 'utf-8');
    expect(content).toContain('#note: the api key');
  });

  it('removes note', () => {
    const p = writeTmp(SAMPLE);
    runNote(p, 'DB_URL', 'remove');
    const content = fs.readFileSync(p, 'utf-8');
    expect(content).not.toContain('#note:');
  });

  it('throws if key missing', () => {
    const p = writeTmp(SAMPLE);
    expect(() => runNote(p, 'MISSING', 'get')).toThrow('Key not found');
  });
});
