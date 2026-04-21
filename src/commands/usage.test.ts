import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  parseUsageFile,
  recordKeyAccess,
  getTopKeys,
  runUsage,
} from './usage';

function makeTmpFile(): string {
  return path.join(os.tmpdir(), `usage-test-${Date.now()}.json`);
}

describe('parseUsageFile', () => {
  it('returns empty data when file does not exist', () => {
    const result = parseUsageFile('/nonexistent/path/usage.json');
    expect(result.entries).toEqual([]);
  });

  it('returns empty data on malformed JSON', () => {
    const tmp = makeTmpFile();
    fs.writeFileSync(tmp, 'not-json');
    const result = parseUsageFile(tmp);
    expect(result.entries).toEqual([]);
    fs.unlinkSync(tmp);
  });

  it('parses valid usage file', () => {
    const tmp = makeTmpFile();
    const data = { entries: [{ key: 'API_KEY', accessCount: 3, lastAccessed: '2024-01-01T00:00:00.000Z' }] };
    fs.writeFileSync(tmp, JSON.stringify(data));
    const result = parseUsageFile(tmp);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].key).toBe('API_KEY');
    fs.unlinkSync(tmp);
  });
});

describe('recordKeyAccess', () => {
  it('creates a new entry for a new key', () => {
    const tmp = makeTmpFile();
    recordKeyAccess(tmp, 'DB_HOST');
    const data = parseUsageFile(tmp);
    expect(data.entries).toHaveLength(1);
    expect(data.entries[0].key).toBe('DB_HOST');
    expect(data.entries[0].accessCount).toBe(1);
    fs.unlinkSync(tmp);
  });

  it('increments count for an existing key', () => {
    const tmp = makeTmpFile();
    recordKeyAccess(tmp, 'DB_HOST');
    recordKeyAccess(tmp, 'DB_HOST');
    const data = parseUsageFile(tmp);
    expect(data.entries[0].accessCount).toBe(2);
    fs.unlinkSync(tmp);
  });
});

describe('getTopKeys', () => {
  it('returns keys sorted by access count descending', () => {
    const data = {
      entries: [
        { key: 'A', accessCount: 1, lastAccessed: '' },
        { key: 'B', accessCount: 5, lastAccessed: '' },
        { key: 'C', accessCount: 3, lastAccessed: '' },
      ],
    };
    const top = getTopKeys(data, 2);
    expect(top[0].key).toBe('B');
    expect(top[1].key).toBe('C');
  });
});

describe('runUsage', () => {
  it('prints no data message when empty', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    runUsage('/nonexistent/usage.json');
    expect(spy).toHaveBeenCalledWith('No usage data recorded yet.');
    spy.mockRestore();
  });
});
