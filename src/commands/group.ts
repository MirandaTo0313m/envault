import * as fs from 'fs';
import * as path from 'path';

export interface VaultEntry {
  key: string;
  value: string;
  group?: string;
  [meta: string]: string | undefined;
}

export function parseVaultWithGroups(vaultPath: string): VaultEntry[] {
  if (!fs.existsSync(vaultPath)) return [];
  const lines = fs.readFileSync(vaultPath, 'utf-8').split('\n');
  const entries: VaultEntry[] = [];
  let currentGroup: string | undefined;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# @group:')) {
      currentGroup = trimmed.replace('# @group:', '').trim();
      continue;
    }
    if (trimmed.startsWith('# @endgroup')) {
      currentGroup = undefined;
      continue;
    }
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    entries.push({ key, value, group: currentGroup });
  }
  return entries;
}

export function setGroup(vaultPath: string, keys: string[], groupName: string): void {
  const entries = parseVaultWithGroups(vaultPath);
  const grouped = entries.filter(e => keys.includes(e.key));
  const ungrouped = entries.filter(e => !keys.includes(e.key));

  if (grouped.length === 0) {
    console.error(`No matching keys found for group assignment.`);
    process.exit(1);
  }

  const lines: string[] = [];
  for (const entry of ungrouped) {
    const grp = entry.group;
    if (grp) lines.push(`# @group:${grp}`);
    lines.push(`${entry.key}=${entry.value}`);
    if (grp) lines.push(`# @endgroup`);
  }
  lines.push(`# @group:${groupName}`);
  for (const entry of grouped) {
    lines.push(`${entry.key}=${entry.value}`);
  }
  lines.push(`# @endgroup`);

  fs.writeFileSync(vaultPath, lines.join('\n') + '\n', 'utf-8');
  console.log(`Assigned ${grouped.length} key(s) to group "${groupName}".`);
}

export function listGroups(vaultPath: string): void {
  const entries = parseVaultWithGroups(vaultPath);
  const groupMap = new Map<string, string[]>();

  for (const entry of entries) {
    const g = entry.group ?? '(ungrouped)';
    if (!groupMap.has(g)) groupMap.set(g, []);
    groupMap.get(g)!.push(entry.key);
  }

  for (const [group, keys] of groupMap.entries()) {
    console.log(`\n[${group}]`);
    keys.forEach(k => console.log(`  ${k}`));
  }
}

export function runGroup(args: string[]): void {
  const vaultPath = process.env.VAULT_PATH ?? '.env.vault';
  const subcommand = args[0];

  if (subcommand === 'set') {
    const groupName = args[1];
    const keys = args.slice(2);
    if (!groupName || keys.length === 0) {
      console.error('Usage: envault group set <groupName> <KEY1> [KEY2...]');
      process.exit(1);
    }
    setGroup(vaultPath, keys, groupName);
  } else if (subcommand === 'list') {
    listGroups(vaultPath);
  } else {
    console.error('Usage: envault group <set|list>');
    process.exit(1);
  }
}
