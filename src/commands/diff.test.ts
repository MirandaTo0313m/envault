import { parseEnvPairs, computeDiff, DiffEntry } from './diff';
import * as exportModule from './export';
import * as encryptModule from '../crypto/encrypt';
import * as keyPairModule from '../crypto/keyPair';
import * as fs from 'fs';

jest.mock('fs');
jest.mock('./export');
jest.mock('../crypto/encrypt');
jest.mock('../crypto/keyPair');

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedParseVaultEntries = exportModule.parseVaultEntries as jest.Mock;
const mockedDecrypt = encryptModule.decryptWithPrivateKey as jest.Mock;
const mockedLoadPrivateKey = keyPairModule.loadPrivateKey as jest.Mock;

describe('parseEnvPairs', () => {
  it('parses key=value lines', () => {
    const content = 'FOO=bar\nBAZ=qux';
    expect(parseEnvPairs(content)).toEqual({ FOO: 'bar', BAZ: 'qux' });
  });

  it('ignores comments and blank lines', () => {
    const content = '# comment\n\nKEY=value';
    expect(parseEnvPairs(content)).toEqual({ KEY: 'value' });
  });

  it('handles values containing =', () => {
    const content = 'URL=http://example.com?a=1';
    expect(parseEnvPairs(content)).toEqual({ URL: 'http://example.com?a=1' });
  });
});

describe('computeDiff', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedFs.existsSync = jest.fn().mockReturnValue(true);
    mockedLoadPrivateKey.mockReturnValue('private-key');
  });

  it('detects added keys (in env but not vault)', async () => {
    mockedFs.readFileSync = jest.fn()
      .mockReturnValueOnce('vault-content')
      .mockReturnValueOnce('NEW_KEY=newval');
    mockedParseVaultEntries.mockReturnValue([]);

    const diffs = await computeDiff('vault.env.enc', '.env');
    expect(diffs).toContainEqual(expect.objectContaining({ key: 'NEW_KEY', status: 'added' }));
  });

  it('detects removed keys (in vault but not env)', async () => {
    mockedFs.readFileSync = jest.fn()
      .mockReturnValueOnce('vault-content')
      .mockReturnValueOnce('');
    mockedParseVaultEntries.mockReturnValue([{ key: 'OLD_KEY', encryptedValue: 'enc' }]);
    mockedDecrypt.mockReturnValue('oldval');

    const diffs = await computeDiff('vault.env.enc', '.env');
    expect(diffs).toContainEqual(expect.objectContaining({ key: 'OLD_KEY', status: 'removed' }));
  });

  it('detects changed keys', async () => {
    mockedFs.readFileSync = jest.fn()
      .mockReturnValueOnce('vault-content')
      .mockReturnValueOnce('KEY=newval');
    mockedParseVaultEntries.mockReturnValue([{ key: 'KEY', encryptedValue: 'enc' }]);
    mockedDecrypt.mockReturnValue('oldval');

    const diffs = await computeDiff('vault.env.enc', '.env');
    expect(diffs).toContainEqual(expect.objectContaining({ key: 'KEY', status: 'changed' }));
  });

  it('marks unchanged keys correctly', async () => {
    mockedFs.readFileSync = jest.fn()
      .mockReturnValueOnce('vault-content')
      .mockReturnValueOnce('KEY=samevalue');
    mockedParseVaultEntries.mockReturnValue([{ key: 'KEY', encryptedValue: 'enc' }]);
    mockedDecrypt.mockReturnValue('samevalue');

    const diffs = await computeDiff('vault.env.enc', '.env');
    expect(diffs).toContainEqual(expect.objectContaining({ key: 'KEY', status: 'unchanged' }));
  });

  it('throws if vault file is missing', async () => {
    mockedFs.existsSync = jest.fn().mockReturnValueOnce(false);
    await expect(computeDiff('missing.enc', '.env')).rejects.toThrow('Vault file not found');
  });
});
