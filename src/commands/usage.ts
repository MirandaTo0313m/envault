import * as fs from 'fs';
import * as path from 'path';

export interface UsageEntry {
  key: string;
  accessCount: number;
  lastAccessed: string;
}

export interface UsageData {
  entries: UsageEntry[];
}

export function parseUsageFile(filePath: string): UsageData {
  if (!fs.existsSync(filePath)) {
    return { entries: [] };
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  try {
    return JSON.parse(raw) as UsageData;
  } catch {
    return { entries: [] };
  }
}

export function recordKeyAccess(filePath: string, key: string): void {
  const data = parseUsageFile(filePath);
  const now = new Date().toISOString();
  const existing = data.entries.find((e) => e.key === key);
  if (existing) {
    existing.accessCount += 1;
    existing.lastAccessed = now;
  } else {
    data.entries.push({ key, accessCount: 1, lastAccessed: now });
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export function getTopKeys(data: UsageData, limit: number): UsageEntry[] {
  return [...data.entries]
    .sort((a, b) => b.accessCount - a.accessCount)
    .slice(0, limit);
}

export function runUsage(usageFilePath: string, topN = 10): void {
  const data = parseUsageFile(usageFilePath);
  if (data.entries.length === 0) {
    console.log('No usage data recorded yet.');
    return;
  }
  const top = getTopKeys(data, topN);
  console.log(`Top ${top.length} accessed keys:\n`);
  top.forEach((entry, idx) => {
    console.log(
      `  ${idx + 1}. ${entry.key} — ${entry.accessCount} access(es), last: ${entry.lastAccessed}`
    );
  });
}
