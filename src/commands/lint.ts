import * as fs from "fs";
import * as path from "path";

export interface LintIssue {
  line: number;
  key: string;
  message: string;
  severity: "error" | "warning";
}

export interface LintResult {
  file: string;
  issues: LintIssue[];
  valid: boolean;
}

const KEY_PATTERN = /^[A-Z][A-Z0-9_]*$/;
const BLANK_VALUE_PATTERN = /^\s*$/;

export function lintEnvFile(filePath: string): LintResult {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const issues: LintIssue[] = [];
  const seenKeys = new Set<string>();

  lines.forEach((raw, idx) => {
    const line = raw.trim();
    const lineNum = idx + 1;

    if (line === "" || line.startsWith("#")) return;

    const eqIdx = line.indexOf("=");
    if (eqIdx === -1) {
      issues.push({ line: lineNum, key: line, message: "Missing '=' separator", severity: "error" });
      return;
    }

    const key = line.slice(0, eqIdx).trim();
    const value = line.slice(eqIdx + 1).trim();

    if (!KEY_PATTERN.test(key)) {
      issues.push({ line: lineNum, key, message: `Key '${key}' should be UPPER_SNAKE_CASE`, severity: "warning" });
    }

    if (BLANK_VALUE_PATTERN.test(value)) {
      issues.push({ line: lineNum, key, message: `Key '${key}' has an empty value`, severity: "warning" });
    }

    if (seenKeys.has(key)) {
      issues.push({ line: lineNum, key, message: `Duplicate key '${key}'`, severity: "error" });
    } else {
      seenKeys.add(key);
    }
  });

  return { file: path.basename(filePath), issues, valid: issues.filter(i => i.severity === "error").length === 0 };
}

export function runLint(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const result = lintEnvFile(filePath);

  if (result.issues.length === 0) {
    console.log(`✅ ${result.file}: No issues found.`);
    return;
  }

  result.issues.forEach(issue => {
    const icon = issue.severity === "error" ? "❌" : "⚠️";
    console.log(`${icon} Line ${issue.line} [${issue.key}]: ${issue.message}`);
  });

  if (!result.valid) {
    console.error(`\n${result.file} has lint errors.`);
    process.exit(1);
  } else {
    console.warn(`\n${result.file} has warnings.`);
  }
}
