import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

function setup() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-cmp-'));
  const a = path.join(dir, 'a.env');
  const b = path.join(dir, 'b.env');
  fs.writeFileSync(a, 'SHARED=same\nONLY_A=1\nDIFF=old\n');
  fs.writeFileSync(b, 'SHARED=same\nONLY_B=2\nDIFF=new\n');
  return { dir, a, b };
}

const CLI = path.resolve(__dirname, '../dist/cli.js');
const canRun = fs.existsSync(CLI);

(canRun ? describe : describe.skip)('compare integration', () => {
  it('shows keys only in A and only in B', () => {
    const { a, b } = setup();
    const out = execSync(`node ${CLI} compare ${a} ${b}`).toString();
    expect(out).toContain('ONLY_A');
    expect(out).toContain('ONLY_B');
  });

  it('shows different keys', () => {
    const { a, b } = setup();
    const out = execSync(`node ${CLI} compare ${a} ${b}`).toString();
    expect(out).toContain('DIFF');
  });

  it('outputs valid JSON with --json flag', () => {
    const { a, b } = setup();
    const out = execSync(`node ${CLI} compare --json ${a} ${b}`).toString();
    const parsed = JSON.parse(out);
    expect(parsed).toHaveProperty('onlyInA');
    expect(parsed).toHaveProperty('onlyInB');
    expect(parsed).toHaveProperty('different');
    expect(parsed).toHaveProperty('same');
  });

  it('exits with code 1 for missing file', () => {
    expect(() =>
      execSync(`node ${CLI} compare /no/such/a.env /no/such/b.env`, { stdio: 'pipe' })
    ).toThrow();
  });
});
