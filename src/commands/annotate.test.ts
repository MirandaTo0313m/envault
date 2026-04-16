import { parseVaultWithAnnotations, setAnnotation, removeAnnotation, serializeVaultWithAnnotations } from './annotate';

const sampleVault = `#@annotation: Database URL
DB_URL=postgres://localhost/db
API_KEY=secret123
#@annotation: Feature flag
FEATURE_X=true
`;

describe('parseVaultWithAnnotations', () => {
  it('parses annotated entries', () => {
    const entries = parseVaultWithAnnotations(sampleVault);
    expect(entries).toHaveLength(3);
    expect(entries[0]).toEqual({ key: 'DB_URL', value: 'postgres://localhost/db', annotation: 'Database URL' });
    expect(entries[1]).toEqual({ key: 'API_KEY', value: 'secret123', annotation: undefined });
    expect(entries[2]).toEqual({ key: 'FEATURE_X', value: 'true', annotation: 'Feature flag' });
  });
});

describe('setAnnotation', () => {
  it('sets annotation on existing key', () => {
    const entries = parseVaultWithAnnotations(sampleVault);
    const updated = setAnnotation(entries, 'API_KEY', 'The API key');
    expect(updated.find(e => e.key === 'API_KEY')?.annotation).toBe('The API key');
  });

  it('throws if key not found', () => {
    const entries = parseVaultWithAnnotations(sampleVault);
    expect(() => setAnnotation(entries, 'MISSING', 'x')).toThrow('Key "MISSING" not found');
  });
});

describe('removeAnnotation', () => {
  it('removes annotation from key', () => {
    const entries = parseVaultWithAnnotations(sampleVault);
    const updated = removeAnnotation(entries, 'DB_URL');
    expect(updated.find(e => e.key === 'DB_URL')?.annotation).toBeUndefined();
  });

  it('throws if key not found', () => {
    const entries = parseVaultWithAnnotations(sampleVault);
    expect(() => removeAnnotation(entries, 'NOPE')).toThrow('Key "NOPE" not found');
  });
});

describe('serializeVaultWithAnnotations', () => {
  it('round-trips correctly', () => {
    const entries = parseVaultWithAnnotations(sampleVault);
    const serialized = serializeVaultWithAnnotations(entries);
    const reparsed = parseVaultWithAnnotations(serialized);
    expect(reparsed).toEqual(entries);
  });

  it('omits annotation line when not set', () => {
    const entries = [{ key: 'FOO', value: 'bar' }];
    const out = serializeVaultWithAnnotations(entries);
    expect(out).toBe('FOO=bar\n');
  });
});
