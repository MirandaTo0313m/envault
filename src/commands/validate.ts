import * as fs from "fs";
import * as path from "path";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const VALID_KEY_PATTERN = /^[A-Z][A-Z0-9_]*$/;
const SUSPICIOUS_VALUE_PATTERN = /^(true|false|null|undefined|NaN|Infinity)$/i;
const EMPTY_VALUE_PATTERN = /^\s*$/;

export function validateEnvFile(filePath: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!fs.existsSync(filePath)) {
    return { valid: false, errors: [`File not found: ${filePath}`], warnings };
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const seenKeys = new Set<string>();

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) return;

    if (!trimmed.includes("=")) {
      errors.push(`Line ${lineNum}: missing '=' separator — "${trimmed}"`);
      return;
    }

    const eqIndex = trimmed.indexOf("=");
    const key = trimmed.substring(0, eqIndex).trim();
    const value = trimmed.substring(eqIndex + 1).trim();

    if (!key) {
      errors.push(`Line ${lineNum}: empty key`);
      return;
    }

    if (!VALID_KEY_PATTERN.test(key)) {
      warnings.push(
        `Line ${lineNum}: key "${key}" does not follow UPPER_SNAKE_CASE convention`
      );
    }

    if (seenKeys.has(key)) {
      errors.push(`Line ${lineNum}: duplicate key "${key}"`);
    } else {
      seenKeys.add(key);
    }

    if (EMPTY_VALUE_PATTERN.test(value)) {
      warnings.push(`Line ${lineNum}: key "${key}" has an empty value`);
    }

    if (SUSPICIOUS_VALUE_PATTERN.test(value)) {
      warnings.push(
        `Line ${lineNum}: key "${key}" has a suspicious literal value "${value}"`
      );
    }
  });

  return { valid: errors.length === 0, errors, warnings };
}

export function runValidate(filePath: string): void {
  const resolved = path.resolve(filePath);
  const result = validateEnvFile(resolved);

  if (result.errors.length === 0 && result.warnings.length === 0) {
    console.log(`✅ ${filePath} is valid with no issues.`);
    return;
  }

  if (result.errors.length > 0) {
    console.error(`❌ Errors in ${filePath}:`);
    result.errors.forEach((e) => console.error(`  • ${e}`));
  }

  if (result.warnings.length > 0) {
    console.warn(`⚠️  Warnings in ${filePath}:`);
    result.warnings.forEach((w) => console.warn(`  • ${w}`));
  }

  if (!result.valid) {
    process.exit(1);
  }
}
