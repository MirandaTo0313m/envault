import fs from "fs";
import path from "path";
import { runRotate } from "./rotate";
import * as keyPairModule from "../crypto/keyPair";
import * as encryptModule from "../crypto/encrypt";
import { ENVAULT_DIR, ENCRYPTED_ENV_FILE, PUBLIC_KEY_FILE, PRIVATE_KEY_FILE } from "../constants";

jest.mock("fs");
jest.mock("../crypto/keyPair");
jest.mock("../crypto/encrypt");

const mockFs = fs as jest.Mocked<typeof fs>;

describe("runRotate", () => {
  const encryptedFilePath = path.join(ENVAULT_DIR, ENCRYPTED_ENV_FILE);
  const privateKeyPath = path.join(ENVAULT_DIR, PRIVATE_KEY_FILE);

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
  });

  it("exits if no encrypted file exists", async () => {
    mockFs.existsSync.mockReturnValue(false);
    await expect(runRotate()).rejects.toThrow("exit");
  });

  it("exits if private key is missing", async () => {
    mockFs.existsSync
      .mockReturnValueOnce(true)  // encrypted file exists
      .mockReturnValueOnce(false); // private key missing
    await expect(runRotate()).rejects.toThrow("exit");
  });

  it("rotates keys and re-encrypts successfully", async () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync
      .mockReturnValueOnce("encrypted-data")
      .mockReturnValueOnce("old-private-key");

    (encryptModule.decryptWithPrivateKey as jest.Mock).mockReturnValue("PLAIN=text");
    (keyPairModule.generateKeyPair as jest.Mock).mockReturnValue({
      publicKey: "new-pub",
      privateKey: "new-priv",
    });
    (keyPairModule.loadPublicKey as jest.Mock).mockReturnValue("new-pub");
    (encryptModule.encryptWithPublicKey as jest.Mock).mockReturnValue("new-encrypted");

    await runRotate();

    expect(keyPairModule.generateKeyPair).toHaveBeenCalled();
    expect(keyPairModule.saveKeyPair).toHaveBeenCalledWith("new-pub", "new-priv");
    expect(encryptModule.encryptWithPublicKey).toHaveBeenCalledWith("PLAIN=text", "new-pub");
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(encryptedFilePath, "new-encrypted", "utf-8");
    expect(mockFs.renameSync).toHaveBeenCalledTimes(2);
  });

  it("exits if decryption fails during rotation", async () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync
      .mockReturnValueOnce("bad-data")
      .mockReturnValueOnce("old-private-key");

    (encryptModule.decryptWithPrivateKey as jest.Mock).mockImplementation(() => {
      throw new Error("decryption failed");
    });

    await expect(runRotate()).rejects.toThrow("exit");
  });
});
