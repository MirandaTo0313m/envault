import * as fs from 'fs';

export interface CompareResult {
  onlyInA: string[];
  onlyInB: string[];
  different: string[];
  same: string[];
}

export function parseVaultKeysAndValues(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const result: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.substring(0, eqIdx).trim();
    const value = trimmed.substring(eqIdx + 1).trim();
    if (key) result[key] = value;
  }
  return result;
}

export function compareVaults(
  a: Record<string, string>,
  b: Record<string, string>
): CompareResult {
  const keysA = new Set(Object.keys(a));
  const keysB = new Set(Object.keys(b));
  const allKeys = new Set([...keysA, ...keysB]);

  const onlyInA: string[] = [];
  const onlyInB: string[] = [];
  const different: string[] = [];
  const same: string[] = [];

  for (const key of allKeys) {
    const inA = keysA.has(key);
    const inB = keysB.has(key);
    if (inA && !inB) {
      onlyInA.push(key);
    } else if (!inA && inB) {
      onlyInB.push(key);
    } else if (a[key] !== b[key]) {
      different.push(key);
    } else {
      same.push(key);
    }
  }

  return { onlyInA, onlyInB, different, same };
}

export function runCompare(
  fileA: string,
  fileB: string,
  options: { quiet?: boolean; json?: boolean } = {}
): void {
  const a = parseVaultKeysAndValues(fileA);
  const b = parseVaultKeysAndValues(fileB);
  const result = compareVaults(a, b);

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (!options.quiet) {
    console.log(`Comparing:\n  A: ${fileA}\n  B: ${fileB}\n`);
  }

  if (result.onlyInA.length) {
    console.log(`Only in A (${result.onlyInA.length}):`);
    result.onlyInA.forEach(k => console.log(`  - ${k}`));
  }
  if (result.onlyInB.length) {
    console.log(`Only in B (${result.onlyInB.length}):`);
    result.onlyInB.forEach(k => console.log(`  + ${k}`));
  }
  if (result.different.length) {
    console.log(`Different values (${result.different.length}):`);
    result.different.forEach(k => console.log(`  ~ ${k}`));
  }
  if (!options.quiet) {
    console.log(`\nSame: ${result.same.length} key(s)`);
  }
}
