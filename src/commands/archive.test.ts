import { describe, it, expect } from "vitest";
import {
  parseArchivedEntries,
  archiveKeyInVault,
  restoreKeyFromArchive,
} from "./archive";

const sampleVault = `API_KEY=abc123
DB_PASS=secret
DEBUG=true`;

describe("parseArchivedEntries", () => {
  it("returns empty array when no archived entries", () => {
    expect(parseArchivedEntries(sampleVault)).toEqual([]);
  });

  it("parses archived entries correctly", () => {
    const vault = `API_KEY=abc123\n#archived:{\"key\":\"OLD_KEY\",\"value\":\"xyz\",\"archivedAt\":\"2024-01-01T00:00:00.000Z\"}`;
    const entries = parseArchivedEntries(vault);
    expect(entries).toHaveLength(1);
    expect(entries[0].key).toBe("OLD_KEY");
    expect(entries[0].value).toBe("xyz");
  });

  it("skips malformed archived lines", () => {
    const vault = `#archived:not-valid-json`;
    expect(parseArchivedEntries(vault)).toEqual([]);
  });
});

describe("archiveKeyInVault", () => {
  it("removes key from active entries and adds archive comment", () => {
    const result = archiveKeyInVault(sampleVault, "API_KEY");
    expect(result).not.toMatch(/^API_KEY=/);
    expect(result).toMatch(/#archived:/);
    const entries = parseArchivedEntries(result);
    expect(entries[0].key).toBe("API_KEY");
    expect(entries[0].value).toBe("abc123");
  });

  it("preserves other keys after archiving", () => {
    const result = archiveKeyInVault(sampleVault, "DB_PASS");
    expect(result).toContain("API_KEY=abc123");
    expect(result).toContain("DEBUG=true");
    expect(result).not.toMatch(/^DB_PASS=/m);
  });

  it("throws if key not found", () => {
    expect(() => archiveKeyInVault(sampleVault, "MISSING_KEY")).toThrow(
      'Key "MISSING_KEY" not found in vault.'
    );
  });
});

describe("restoreKeyFromArchive", () => {
  it("restores an archived key back to active", () => {
    const archived = archiveKeyInVault(sampleVault, "API_KEY");
    const restored = restoreKeyFromArchive(archived, "API_KEY");
    expect(restored).toContain("API_KEY=abc123");
    expect(restored).not.toMatch(/#archived:.*API_KEY/);
  });

  it("throws if archived key not found", () => {
    expect(() => restoreKeyFromArchive(sampleVault, "GHOST")).toThrow(
      'Archived key "GHOST" not found.'
    );
  });

  it("does not affect other archived entries when restoring one", () => {
    let vault = archiveKeyInVault(sampleVault, "API_KEY");
    vault = archiveKeyInVault(vault, "DEBUG");
    const restored = restoreKeyFromArchive(vault, "API_KEY");
    const remaining = parseArchivedEntries(restored);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].key).toBe("DEBUG");
  });
});
