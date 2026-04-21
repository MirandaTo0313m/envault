import * as fs from 'fs';

export interface VaultEntry {
  key: string;
  value: string;
  deprecated?: boolean;
  deprecatedSince?: string;
  deprecationNote?: string;
  raw: string;
}

export function parseVaultWithDeprecations(content: string): VaultEntry[] {
  const lines = content.split('\n');
  const entries: VaultEntry[] = [];
  let pendingDeprecated = false;
  let pendingSince: string | undefined;
  let pendingNote: string | undefined;

  for (const line of lines) {
    const deprecatedMatch = line.match(/^#\s*@deprecated(?::([^|]*)(?:\|(.*))?)?$/);
    if (deprecatedMatch) {
      pendingDeprecated = true;
      pendingSince = deprecatedMatch[1]?.trim() || undefined;
      pendingNote = deprecatedMatch[2]?.trim() || undefined;
      continue;
    }

    const kvMatch = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (kvMatch) {
      entries.push({
        key: kvMatch[1],
        value: kvMatch[2],
        deprecated: pendingDeprecated || undefined,
        deprecatedSince: pendingSince,
        deprecationNote: pendingNote,
        raw: line,
      });
      pendingDeprecated = false;
      pendingSince = undefined;
      pendingNote = undefined;
    } else {
      entries.push({ key: '', value: '', raw: line });
    }
  }

  return entries;
}

export function setDeprecated(
  entries: VaultEntry[],
  key: string,
  since?: string,
  note?: string
): VaultEntry[] {
  return entries.map((e) =>
    e.key === key
      ? { ...e, deprecated: true, deprecatedSince: since, deprecationNote: note }
      : e
  );
}

export function removeDeprecated(entries: VaultEntry[], key: string): VaultEntry[] {
  return entries.map((e) =>
    e.key === key
      ? { ...e, deprecated: undefined, deprecatedSince: undefined, deprecationNote: undefined }
      : e
  );
}

export function serializeVaultWithDeprecations(entries: VaultEntry[]): string {
  const lines: string[] = [];
  for (const entry of entries) {
    if (!entry.key) {
      lines.push(entry.raw);
      continue;
    }
    if (entry.deprecated) {
      let tag = '# @deprecated';
      if (entry.deprecatedSince) {
        tag += `:${entry.deprecatedSince}`;
        if (entry.deprecationNote) tag += `|${entry.deprecationNote}`;
      }
      lines.push(tag);
    }
    lines.push(`${entry.key}=${entry.value}`);
  }
  return lines.join('\n');
}

export function listDeprecatedKeys(entries: VaultEntry[]): VaultEntry[] {
  return entries.filter((e) => e.key && e.deprecated);
}

export function runDeprecate(
  vaultPath: string,
  key: string,
  options: { remove?: boolean; since?: string; note?: string }
): void {
  if (!fs.existsSync(vaultPath)) {
    console.error(`Vault not found: ${vaultPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(vaultPath, 'utf-8');
  let entries = parseVaultWithDeprecations(content);
  const exists = entries.some((e) => e.key === key);

  if (!exists) {
    console.error(`Key not found: ${key}`);
    process.exit(1);
  }

  if (options.remove) {
    entries = removeDeprecated(entries, key);
    console.log(`Removed deprecation from '${key}'.`);
  } else {
    entries = setDeprecated(entries, key, options.since, options.note);
    console.log(`Marked '${key}' as deprecated.`);
    if (options.since) console.log(`  Since: ${options.since}`);
    if (options.note) console.log(`  Note: ${options.note}`);
  }

  fs.writeFileSync(vaultPath, serializeVaultWithDeprecations(entries), 'utf-8');
}
