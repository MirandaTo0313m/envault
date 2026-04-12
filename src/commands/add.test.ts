import fs from "fs";
import path from "path";
import { runAdd } from "./add";
import { generateKeyPair, saveKeyPair } from "../crypto/keyPair";
import { decryptWithPrivateKey } from "../crypto/encrypt";
import { ENV_FILE, ENCRYPTED_FILE } from "../constants";

const TEST_DIR = path.resolve(__dirname, "__add_test_tmp__");
const origCwd = process.cwd;

beforeEach(() => {
  fs.mkdirSync(TEST_DIR, { recursive: true });
  jest.spyOn(process, "cwd").mockReturnValue(TEST_DIR);
});

afterEach(() => {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
  jest.restoreAllMocks();
});

describe("runAdd", () => {
  it("creates .env file with the new variable", async () => {
    await runAdd("API_KEY", "secret123");
    const envPath = path.join(TEST_DIR, ENV_FILE);
    expect(fs.existsSync(envPath)).toBe(true);
    const content = fs.readFileSync(envPath, "utf-8");
    expect(content).toContain("API_KEY=secret123");
  });

  it("appends to existing .env without overwriting other keys", async () => {
    const envPath = path.join(TEST_DIR, ENV_FILE);
    fs.writeFileSync(envPath, "EXISTING_KEY=value1\n", "utf-8");
    await runAdd("NEW_KEY", "value2");
    const content = fs.readFileSync(envPath, "utf-8");
    expect(content).toContain("EXISTING_KEY=value1");
    expect(content).toContain("NEW_KEY=value2");
  });

  it("re-encrypts the .env.vault file when it already exists", async () => {
    const { publicKey, privateKey } = generateKeyPair();
    saveKeyPair(publicKey, privateKey, TEST_DIR);

    const encryptedPath = path.join(TEST_DIR, ENCRYPTED_FILE);
    // Create a placeholder encrypted file so runAdd triggers re-encryption
    fs.writeFileSync(encryptedPath, "placeholder", "utf-8");

    await runAdd("DB_URL", "postgres://localhost/db");

    const encryptedContent = fs.readFileSync(encryptedPath, "utf-8");
    expect(encryptedContent).not.toBe("placeholder");

    const decrypted = decryptWithPrivateKey(privateKey, encryptedContent);
    const parsed = JSON.parse(decrypted);
    expect(parsed["DB_URL"]).toBe("postgres://localhost/db");
  });

  it("exits with error for invalid variable names", async () => {
    const mockExit = jest.spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });
    await expect(runAdd("123INVALID", "value")).rejects.toThrow("process.exit(1)");
    mockExit.mockRestore();
  });
});
