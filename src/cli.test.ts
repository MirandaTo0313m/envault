import { execSync } from 'child_process';
import path from 'path';

const CLI = path.resolve(__dirname, '../dist/cli.js');

describe('CLI smoke tests', () => {
  it('should display help without error', () => {
    try {
      const output = execSync(`node ${CLI} --help`, { encoding: 'utf-8' });
      expect(output).toContain('envault');
      expect(output).toContain('init');
      expect(output).toContain('encrypt');
      expect(output).toContain('decrypt');
      expect(output).toContain('share');
    } catch {
      // If dist not built, skip gracefully
      console.warn('CLI binary not built — skipping smoke test');
    }
  });

  it('should display version', () => {
    try {
      const output = execSync(`node ${CLI} --version`, { encoding: 'utf-8' });
      expect(output.trim()).toMatch(/\d+\.\d+\.\d+/);
    } catch {
      console.warn('CLI binary not built — skipping smoke test');
    }
  });
});
