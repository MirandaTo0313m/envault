import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { renameKeyInVault, runRename } from "./rename";

function createTempVault(content: string): string {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "envault-rename-"));
  const vaultPath = path.join(tmpDir, ".env.vault");
  fs.writeFileSync(vaultPath, content, "utf-8");
  return vaultPath;
}

describe("renameKeyInVault", () => {
  it("renames an existing key", () => {
    const vaultPath = createTempVault("API_KEY=abc123\nDB_HOST=localhost\n");
    renameKeyInVault(vaultPath, "API_KEY", "API_TOKEN");
    const content = fs.readFileSync(vaultPath, "utf-8");
    expect(content).toContain("API_TOKEN=abc123");
    expect(content).not.toContain("API_KEY=");
  });

  it("preserves other keys when renaming", () => {
    const vaultPath = createTempVault("API_KEY=abc123\nDB_HOST=localhost\n");
    renameKeyInVault(vaultPath, "API_KEY", "API_TOKEN");
    const content = fs.readFileSync(vaultPath, "utf-8");
    expect(content).toContain("DB_HOST=localhost");
  });

  it("throws if key does not exist", () => {
    const vaultPath = createTempVault("API_KEY=abc123\n");
    expect(() => renameKeyInVault(vaultPath, "MISSING_KEY", "NEW_KEY")).toThrow(
      'Key "MISSING_KEY" not found in vault.'
    );
  });

  it("throws if vault file does not exist", () => {
    expect(() =>
      renameKeyInVault("/nonexistent/.env.vault", "KEY", "NEW_KEY")
    ).toThrow("Vault file not found");
  });

  it("preserves comment lines", () => {
    const vaultPath = createTempVault("# comment\nAPI_KEY=abc123\n");
    renameKeyInVault(vaultPath, "API_KEY", "API_TOKEN");
    const content = fs.readFileSync(vaultPath, "utf-8");
    expect(content).toContain("# comment");
  });

  it("handles values containing equals signs", () => {
    const vaultPath = createTempVault("TOKEN=base64==\n");
    renameKeyInVault(vaultPath, "TOKEN", "AUTH_TOKEN");
    const content = fs.readFileSync(vaultPath, "utf-8");
    expect(content).toContain("AUTH_TOKEN=base64==");
  });
});

describe("runRename", () => {
  it("logs success message on valid rename", () => {
    const vaultPath = createTempVault("API_KEY=secret\n");
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    runRename("API_KEY", "API_TOKEN", vaultPath);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Renamed "API_KEY" to "API_TOKEN"')
    );
    consoleSpy.mockRestore();
  });

  it("exits with error when old and new keys are the same", () => {
    const vaultPath = createTempVault("API_KEY=secret\n");
    const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => runRename("API_KEY", "API_KEY", vaultPath)).toThrow("exit");
    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
