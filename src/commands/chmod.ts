import * as fs from 'fs';
import * as path from 'path';
import { VAULT_FILE } from '../constants';

export type Permission = 'read' | 'write' | 'none';

export interface VaultPermissions {
  [key: string]: Permission;
}

export function parsePermissions(vaultContent: string): VaultPermissions {
  const permissions: VaultPermissions = {};
  const lines = vaultContent.split('\n');
  for (const line of lines) {
    const match = line.match(/^#\s*@perm\s+(\S+)\s+(read|write|none)$/);
    if (match) {
      permissions[match[1]] = match[2] as Permission;
    }
  }
  return permissions;
}

export function setPermission(
  vaultContent: string,
  key: string,
  permission: Permission
): string {
  const lines = vaultContent.split('\n');
  const permLine = `# @perm ${key} ${permission}`;
  const existingIndex = lines.findIndex((l) =>
    l.match(new RegExp(`^#\\s*@perm\\s+${key}\\s+`))
  );

  if (existingIndex !== -1) {
    if (permission === 'none') {
      lines.splice(existingIndex, 1);
    } else {
      lines[existingIndex] = permLine;
    }
  } else if (permission !== 'none') {
    lines.unshift(permLine);
  }

  return lines.join('\n');
}

export function runChmod(
  vaultPath: string,
  key: string,
  permission: Permission
): void {
  const resolved = path.resolve(vaultPath || VAULT_FILE);

  if (!fs.existsSync(resolved)) {
    console.error(`Vault file not found: ${resolved}`);
    process.exit(1);
  }

  const content = fs.readFileSync(resolved, 'utf-8');
  const updated = setPermission(content, key, permission);
  fs.writeFileSync(resolved, updated, 'utf-8');
  console.log(`Permission for "${key}" set to "${permission}".`);
}
