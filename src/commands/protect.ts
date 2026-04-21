import * as fs from 'fs';
import * as path from 'path';

export interface ProtectedEntry {
  key: string;
  protected: boolean;
}

export function parseVaultWithProtection(content: string): ProtectedEntry[] {
  const entries: ProtectedEntry[] = [];
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const isProtected = trimmed.startsWith('!PROTECTED ');
    const actualLine = isProtected ? trimmed.slice('!PROTECTED '.length) : trimmed;
    const eqIdx = actualLine.indexOf('=');
    if (eqIdx === -1) continue;
    const key = actualLine.slice(0, eqIdx).trim();
    entries.push({ key, protected: isProtected });
  }
  return entries;
}

export function setProtected(content: string, key: string): string {
  const lines = content.split('\n');
  let found = false;
  const result = lines.map((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('!PROTECTED ')) {
      const inner = trimmed.slice('!PROTECTED '.length);
      if (inner.startsWith(key + '=') || inner.startsWith(key + ' =')) {
        found = true;
        return line;
      }
    } else if (trimmed.startsWith(key + '=') || trimmed.startsWith(key + ' =')) {
      found = true;
      return '!PROTECTED ' + line;
    }
    return line;
  });
  if (!found) throw new Error(`Key "${key}" not found in vault.`);
  return result.join('\n');
}

export function unsetProtected(content: string, key: string): string {
  const lines = content.split('\n');
  let found = false;
  const result = lines.map((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('!PROTECTED ')) {
      const inner = trimmed.slice('!PROTECTED '.length);
      if (inner.startsWith(key + '=') || inner.startsWith(key + ' =')) {
        found = true;
        return inner;
      }
    }
    return line;
  });
  if (!found) throw new Error(`Key "${key}" is not protected or not found.`);
  return result.join('\n');
}

export function isKeyProtected(content: string, key: string): boolean {
  const entries = parseVaultWithProtection(content);
  const entry = entries.find((e) => e.key === key);
  return entry?.protected ?? false;
}

export function runProtect(
  vaultPath: string,
  key: string,
  action: 'set' | 'unset' | 'list'
): void {
  if (action === 'list') {
    const content = fs.existsSync(vaultPath) ? fs.readFileSync(vaultPath, 'utf-8') : '';
    const entries = parseVaultWithProtection(content);
    const protected_ = entries.filter((e) => e.protected);
    if (protected_.length === 0) {
      console.log('No protected keys.');
    } else {
      console.log('Protected keys:');
      protected_.forEach((e) => console.log(`  🔒 ${e.key}`));
    }
    return;
  }
  const content = fs.readFileSync(vaultPath, 'utf-8');
  const updated = action === 'set' ? setProtected(content, key) : unsetProtected(content, key);
  fs.writeFileSync(vaultPath, updated, 'utf-8');
  console.log(`Key "${key}" ${action === 'set' ? 'protected' : 'unprotected'} successfully.`);
}
