import * as fs from "fs";
import * as path from "path";
import { parseVaultFile, runList } from "./list";
import * as keyPair from "../crypto/keyPair";
import * as encrypt from "../crypto/encrypt";

jest.mock("fs");
jest.mock("../crypto/keyPair");
jest.mock("../crypto/encrypt");

const mockFs = fs as jest.Mocked<typeof fs>;
const mockKeyPair = keyPair as jest.Mocked<typeof keyPair>;
const mockEncrypt = encrypt as jest.Mocked<typeof encrypt>;

describe("parseVaultFile", () => {
  it("should parse a valid vault JSON file", () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(
      JSON.stringify({ KEY1: "enc1", KEY2: "enc2" })
    );
    const result = parseVaultFile("/some/vault.json");
    expect(result).toEqual({ KEY1: "enc1", KEY2: "enc2" });
  });

  it("should throw if vault file does not exist", () => {
    mockFs.existsSync.mockReturnValue(false);
    expect(() => parseVaultFile("/missing/vault.json")).toThrow(
      "Vault file not found"
    );
  });
});

describe("runList", () => {
  const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should list keys without values", async () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(
      JSON.stringify({ DB_HOST: "enc_db", API_KEY: "enc_api" })
    );
    await runList(false);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("2"));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("DB_HOST"));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("API_KEY"));
  });

  it("should list keys with decrypted values when showValues=true", async () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(
      JSON.stringify({ SECRET: "enc_secret" })
    );
    mockKeyPair.loadPrivateKey.mockReturnValue("private-key");
    mockEncrypt.decryptWithPrivateKey.mockReturnValue("mysecretvalue");
    await runList(true);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("SECRET=mysecretvalue")
    );
  });

  it("should print message when vault is empty", async () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(JSON.stringify({}));
    await runList(false);
    expect(consoleSpy).toHaveBeenCalledWith(
      "No variables stored in vault."
    );
  });
});
