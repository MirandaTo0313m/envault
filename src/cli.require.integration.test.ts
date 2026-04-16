import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { execSync } from "child_process";

function setup() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "envault-req-int-"));
  const vault = path.join(dir, ".env.vault");
  const req = path.join(dir, ".env.required");
  return { dir, vault, req };
}

describe("require integration", () => {
  it("exits 0 when all required keys are present", () => {
    const { vault, req } = setup();
    fs.writeFileSync(vault, "API_KEY=abc\nDB_URL=postgres://localhost\n");
    fs.writeFileSync(req, "API_KEY\nDB_URL\n");
    const result = execSync(
      `npx ts-node src/cli.ts require ${req} --vault ${vault}`,
      { encoding: "utf-8" }
    );
    expect(result).toContain("All required keys are present");
  });

  it("exits 1 when a key is missing", () => {
    const { vault, req } = setup();
    fs.writeFileSync(vault, "API_KEY=abc\n");
    fs.writeFileSync(req, "API_KEY\nMISSING_KEY\n");
    expect(() =>
      execSync(`npx ts-node src/cli.ts require ${req} --vault ${vault}`, {
        encoding: "utf-8",
      })
    ).toThrow();
  });

  it("exits 1 when a key is empty", () => {
    const { vault, req } = setup();
    fs.writeFileSync(vault, "API_KEY=\n");
    fs.writeFileSync(req, "API_KEY\n");
    expect(() =>
      execSync(`npx ts-node src/cli.ts require ${req} --vault ${vault}`, {
        encoding: "utf-8",
      })
    ).toThrow();
  });
});
