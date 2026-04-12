import * as fs from "fs";
import { removeFromVault, runRemove } from "./remove";

jest.mock("fs");

const mockFs = fs as jest.Mocked<typeof fs>;

describe("removeFromVault", () => {
  const vaultPath = "/fake/.env.vault";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should remove an existing key and return true", () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(
      JSON.stringify({ DB_HOST: "enc1", API_KEY: "enc2" })
    );
    const result = removeFromVault("DB_HOST", vaultPath);
    expect(result).toBe(true);
    const written = JSON.parse(
      (mockFs.writeFileSync as jest.Mock).mock.calls[0][1] as string
    );
    expect(written).not.toHaveProperty("DB_HOST");
    expect(written).toHaveProperty("API_KEY");
  });

  it("should return false when key does not exist", () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(
      JSON.stringify({ API_KEY: "enc2" })
    );
    const result = removeFromVault("MISSING_KEY", vaultPath);
    expect(result).toBe(false);
    expect(mockFs.writeFileSync).not.toHaveBeenCalled();
  });

  it("should throw if vault file does not exist", () => {
    mockFs.existsSync.mockReturnValue(false);
    expect(() => removeFromVault("ANY_KEY", vaultPath)).toThrow(
      "Vault file not found"
    );
  });
});

describe("runRemove", () => {
  const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should remove key with force flag", async () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(
      JSON.stringify({ SECRET: "enc_secret" })
    );
    await runRemove("SECRET", true);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Removed \"SECRET\"")
    );
  });

  it("should warn if key not found in vault", async () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(JSON.stringify({}));
    await runRemove("GHOST_KEY", true);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("not found in vault")
    );
  });
});
