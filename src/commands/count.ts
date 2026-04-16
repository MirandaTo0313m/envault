import * as fs from 'fs';

export interface VaultCountResult {
  total: number;
  tagged: number;
  pinned: number;
  archived: number;
  expired: number;
  empty: number;
}

export function countVaultEntries(vaultContent: string): VaultCountResult {
  const lines = vaultContent.split('\n');
  let total = 0;
  let tagged = 0;
  let pinned = 0;
  let archived = 0;
  let expired = 0;
  let empty = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    if (!trimmed.includes('=')) continue;

    total++;

    const [, value] = trimmed.split('=').map(s => s.trim());
    if (!value || value === '') empty++;
    if (trimmed.includes('#tag:')) tagged++;
    if (trimmed.includes('#pinned')) pinned++;
    if (trimmed.includes('#archived')) archived++;
    if (trimmed.includes('#expires:')) {
      const match = trimmed.match(/#expires:(\S+)/);
      if (match) {
        const expiry = new Date(match[1]);
        if (!isNaN(expiry.getTime()) && expiry < new Date()) expired++;
      }
    }
  }

  return { total, tagged, pinned, archived, expired, empty };
}

export function runCount(vaultPath: string): void {
  if (!fs.existsSync(vaultPath)) {
    console.error(`Vault file not found: ${vaultPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(vaultPath, 'utf-8');
  const result = countVaultEntries(content);

  console.log(`Vault entry counts (${vaultPath})`);
  console.log(`  Total   : ${result.total}`);
  console.log(`  Tagged  : ${result.tagged}`);
  console.log(`  Pinned  : ${result.pinned}`);
  console.log(`  Archived: ${result.archived}`);
  console.log(`  Expired : ${result.expired}`);
  console.log(`  Empty   : ${result.empty}`);
}
