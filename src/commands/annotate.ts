import * as fs from 'fs';

export interface VaultEntry {
  key: string;
  value: string;
  annotation?: string;
}

export function parseVaultWithAnnotations(content: string): VaultEntry[] {
  const lines = content.split('\n');
  const entries: VaultEntry[] = [];
  let pendingAnnotation: string | undefined;

  for (const line of lines) {
    const annotationMatch = line.match(/^#@annotation:\s*(.+)$/);
    if (annotationMatch) {
      pendingAnnotation = annotationMatch[1].trim();
      continue;
    }
    const kvMatch = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (kvMatch) {
      entries.push({ key: kvMatch[1], value: kvMatch[2], annotation: pendingAnnotation });
      pendingAnnotation = undefined;
    } else {
      pendingAnnotation = undefined;
    }
  }
  return entries;
}

export function setAnnotation(entries: VaultEntry[], key: string, annotation: string): VaultEntry[] {
  const idx = entries.findIndex(e => e.key === key);
  if (idx === -1) throw new Error(`Key "${key}" not found in vault.`);
  entries[idx].annotation = annotation;
  return entries;
}

export function removeAnnotation(entries: VaultEntry[], key: string): VaultEntry[] {
  const idx = entries.findIndex(e => e.key === key);
  if (idx === -1) throw new Error(`Key "${key}" not found in vault.`);
  delete entries[idx].annotation;
  return entries;
}

export function serializeVaultWithAnnotations(entries: VaultEntry[]): string {
  return entries.map(e => {
    const lines: string[] = [];
    if (e.annotation) lines.push(`#@annotation: ${e.annotation}`);
    lines.push(`${e.key}=${e.value}`);
    return lines.join('\n');
  }).join('\n') + '\n';
}

export function runAnnotate(
  vaultPath: string,
  key: string,
  action: 'set' | 'remove' | 'list',
  annotation?: string
): void {
  const content = fs.readFileSync(vaultPath, 'utf-8');
  let entries = parseVaultWithAnnotations(content);

  if (action === 'list') {
    const annotated = entries.filter(e => e.annotation);
    if (annotated.length === 0) {
      console.log('No annotations found.');
    } else {
      annotated.forEach(e => console.log(`${e.key}: ${e.annotation}`));
    }
    return;
  }

  if (action === 'set') {
    if (!annotation) throw new Error('Annotation text is required for set.');
    entries = setAnnotation(entries, key, annotation);
  } else if (action === 'remove') {
    entries = removeAnnotation(entries, key);
  }

  fs.writeFileSync(vaultPath, serializeVaultWithAnnotations(entries), 'utf-8');
  console.log(`Annotation ${action === 'set' ? 'set' : 'removed'} for "${key}".`);
}
