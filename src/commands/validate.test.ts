import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { validateEnvFile } from "./validate";

function writeTmp(content: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "envault-validate-"));
  const file = path.join(dir, ".env");
  fs.writeFileSync(file, content, "utf-8");
  return file;
}

describe("validateEnvFile", () => {
  it("returns valid for a well-formed env file", () => {
    const file = writeTmp("API_KEY=abc123\nDB_HOST=localhost\n");
    const result = validateEnvFile(file);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it("returns error for file not found", () => {
    const result = validateEnvFile("/nonexistent/.env");
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/File not found/);
  });

  it("reports error for missing = separator", () => {
    const file = writeTmp("INVALID_LINE\n");
    const result = validateEnvFile(file);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("missing '='")));
  });

  it("reports error for duplicate keys", () => {
    const file = writeTmp("API_KEY=one\nAPI_KEY=two\n");
    const result = validateEnvFile(file);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("duplicate key"))).toBe(true);
  });

  it("reports warning for non-UPPER_SNAKE_CASE keys", () => {
    const file = writeTmp("myKey=value\n");
    const result = validateEnvFile(file);
    expect(result.warnings.some((w) => w.includes("UPPER_SNAKE_CASE"))).toBe(
      true
    );
  });

  it("reports warning for empty values", () => {
    const file = writeTmp("API_KEY=\n");
    const result = validateEnvFile(file);
    expect(result.warnings.some((w) => w.includes("empty value"))).toBe(true);
  });

  it("reports warning for suspicious literal values", () => {
    const file = writeTmp("DEBUG=true\n");
    const result = validateEnvFile(file);
    expect(
      result.warnings.some((w) => w.includes("suspicious literal value"))
    ).toBe(true);
  });

  it("ignores comment lines and blank lines", () => {
    const file = writeTmp("# This is a comment\n\nAPI_KEY=secret\n");
    const result = validateEnvFile(file);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("reports error for empty key", () => {
    const file = writeTmp("=nokey\n");
    const result = validateEnvFile(file);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("empty key"))).toBe(true);
  });
});
