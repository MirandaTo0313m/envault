import * as fs from 'fs';

export interface VaultEntry {
  key: string;
  value: string;
  note?: string;
  rest: string;
}

export function parseVaultWithNotes(content: string): VaultEntry[] {
  const entries: VaultEntry[] = [];
  const lines = content.split('\n');
  let pendingNote: string | undefined;

  for (const line of lines) {
    const noteMatch = line.match(/^#note:\s*(.+)$/);
    if (noteMatch) {
      pendingNote = noteMatch[1].trim();
      continue;
    }
    const kvMatch = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (kvMatch) {
      entries.push({ key: kvMatch[1], value: kvMatch[2], note: pendingNote, rest: line });
      pendingNote = undefined;
    } else {
      pendingNote = undefined;
    }
  }
  return entries;
}

export function setNote(entries: VaultEntry[], key: string, note: string): VaultEntry[] {
  return entries.map(e => e.key === key ? { ...e, note } : e);
}

export function removeNote(entries: VaultEntry[], key: string): VaultEntry[] {
  return entries.map(e => e.key === key ? { ...e, note: undefined } : e);
}

export function serializeVaultWithNotes(entries: VaultEntry[]): string {
  return entries.map(e => {
    const noteLine = e.note ? `#note: ${e.note}\n` : '';
    return `${noteLine}${e.rest}`;
  }).join('\n');
}

export function runNote(
  vaultPath: string,
  key: string,
  action: 'set' | 'remove' | 'get',
  note?: string
): void {
  if (!fs.existsSync(vaultPath)) throw new Error(`Vault not found: ${vaultPath}`);
  const content = fs.readFileSync(vaultPath, 'utf-8');
  const entries = parseVaultWithNotes(content);
  const entry = entries.find(e => e.key === key);
  if (!entry) throw new Error(`Key not found: ${key}`);

  if (action === 'get') {
    console.log(entry.note ?? '(no note)');
    return;
  }
  if (action === 'remove') {
    const updated = removeNote(entries, key);
    fs.writeFileSync(vaultPath, serializeVaultWithNotes(updated), 'utf-8');
    console.log(`Note removed from ${key}`);
    return;
  }
  if (!note) throw new Error('Note text required for set action');
  const updated = setNote(entries, key, note);
  fs.writeFileSync(vaultPath, serializeVaultWithNotes(updated), 'utf-8');
  console.log(`Note set on ${key}`);
}
