import { parseVaultWithDescriptions, setDescription } from './describe';

const sampleVault = `## Database URL
DB_URL=postgres://localhost/mydb
## Secret key
SECRET_KEY=abc123
PLAIN_KEY=nocomment
`;

describe('parseVaultWithDescriptions', () => {
  it('parses entries with descriptions', () => {
    const entries = parseVaultWithDescriptions(sampleVault);
    expect(entries).toHaveLength(3);
    expect(entries[0]).toEqual({ key: 'DB_URL', value: 'postgres://localhost/mydb', description: 'Database URL' });
    expect(entries[1]).toEqual({ key: 'SECRET_KEY', value: 'abc123', description: 'Secret key' });
    expect(entries[2]).toEqual({ key: 'PLAIN_KEY', value: 'nocomment', description: '' });
  });

  it('returns empty array for empty content', () => {
    expect(parseVaultWithDescriptions('')).toEqual([]);
  });
});

describe('setDescription', () => {
  it('adds a description to a key without one', () => {
    const result = setDescription(sampleVault, 'PLAIN_KEY', 'A plain key');
    expect(result).toContain('## A plain key');
    expect(result).toContain('PLAIN_KEY=nocomment');
  });

  it('updates an existing description', () => {
    const result = setDescription(sampleVault, 'DB_URL', 'Updated description');
    expect(result).toContain('## Updated description');
    expect(result).not.toContain('## Database URL');
  });

  it('throws if key is not found', () => {
    expect(() => setDescription(sampleVault, 'MISSING_KEY', 'desc')).toThrow('Key "MISSING_KEY" not found');
  });

  it('preserves other entries unchanged', () => {
    const result = setDescription(sampleVault, 'PLAIN_KEY', 'desc');
    expect(result).toContain('DB_URL=postgres://localhost/mydb');
    expect(result).toContain('SECRET_KEY=abc123');
  });
});
