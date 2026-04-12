import fs from "fs";
import path from "path";
import { listKeyBackups, pruneOldBackups } from "./keyBackup";
import { ENVAULT_DIR, PUBLIC_KEY_FILE, PRIVATE_KEY_FILE } from "../constants";

jest.mock("fs");

const mockFs = fs as jest.Mocked<typeof fs>;

describe("listKeyBackups", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns empty array if ENVAULT_DIR does not exist", () => {
    mockFs.existsSync.mockReturnValue(false);
    expect(listKeyBackups()).toEqual([]);
  });

  it("returns matched backup pairs sorted by timestamp descending", () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readdirSync.mockReturnValue([
      `${PUBLIC_KEY_FILE}.1000.bak`,
      `${PRIVATE_KEY_FILE}.1000.bak`,
      `${PUBLIC_KEY_FILE}.2000.bak`,
      `${PRIVATE_KEY_FILE}.2000.bak`,
      "unrelated.txt",
    ] as unknown as fs.Dirent[]);

    const result = listKeyBackups();
    expect(result).toHaveLength(2);
    expect(result[0].timestamp).toBe(2000);
    expect(result[1].timestamp).toBe(1000);
    expect(result[0].publicKeyFile).toBe(path.join(ENVAULT_DIR, `${PUBLIC_KEY_FILE}.2000.bak`));
  });

  it("ignores incomplete pairs (missing private key)", () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readdirSync.mockReturnValue([
      `${PUBLIC_KEY_FILE}.9999.bak`,
    ] as unknown as fs.Dirent[]);

    const result = listKeyBackups();
    expect(result).toHaveLength(0);
  });
});

describe("pruneOldBackups", () => {
  beforeEach(() => jest.clearAllMocks());

  it("deletes backups beyond keepCount", () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readdirSync.mockReturnValue([
      `${PUBLIC_KEY_FILE}.3000.bak`, `${PRIVATE_KEY_FILE}.3000.bak`,
      `${PUBLIC_KEY_FILE}.2000.bak`, `${PRIVATE_KEY_FILE}.2000.bak`,
      `${PUBLIC_KEY_FILE}.1000.bak`, `${PRIVATE_KEY_FILE}.1000.bak`,
    ] as unknown as fs.Dirent[]);

    pruneOldBackups(2);

    expect(mockFs.unlinkSync).toHaveBeenCalledTimes(2);
    expect(mockFs.unlinkSync).toHaveBeenCalledWith(
      path.join(ENVAULT_DIR, `${PUBLIC_KEY_FILE}.1000.bak`)
    );
    expect(mockFs.unlinkSync).toHaveBeenCalledWith(
      path.join(ENVAULT_DIR, `${PRIVATE_KEY_FILE}.1000.bak`)
    );
  });

  it("does nothing if backups are within keepCount", () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readdirSync.mockReturnValue([
      `${PUBLIC_KEY_FILE}.1000.bak`, `${PRIVATE_KEY_FILE}.1000.bak`,
    ] as unknown as fs.Dirent[]);

    pruneOldBackups(3);
    expect(mockFs.unlinkSync).not.toHaveBeenCalled();
  });
});
