import * as path from 'path';
import * as fs from 'fs';
import { generateKeyPair, saveKeyPair } from '../crypto/keyPair';

export interface InitOptions {
  outputDir?: string;
  force?: boolean;
}

export interface InitResult {
  publicKeyPath: string;
  privateKeyPath: string;
}

export function runInit(options: InitOptions = {}): InitResult {
  const outputDir = options.outputDir ?? process.cwd();
  const publicKeyPath = path.join(outputDir, 'envault_public.pem');
  const privateKeyPath = path.join(outputDir, 'envault_private.pem');

  if (!options.force) {
    if (fs.existsSync(publicKeyPath) || fs.existsSync(privateKeyPath)) {
      throw new Error(
        'Key files already exist in this directory. Use --force to overwrite.'
      );
    }
  }

  console.log('🔐 Generating RSA-4096 key pair...');
  const keyPair = generateKeyPair();

  const paths = saveKeyPair(keyPair, outputDir);

  appendToGitignore(outputDir);

  console.log(`✅ Public key saved:  ${paths.publicKeyPath}`);
  console.log(`✅ Private key saved: ${paths.privateKeyPath}`);
  console.log('');
  console.log('⚠️  Keep your private key secret. Share only the public key with teammates.');

  return paths;
}

function appendToGitignore(dir: string): void {
  const gitignorePath = path.join(dir, '.gitignore');
  const entry = 'envault_private.pem';

  if (fs.existsSync(gitignorePath)) {
    const content = fs.readFileSync(gitignorePath, 'utf8');
    if (!content.includes(entry)) {
      fs.appendFileSync(gitignorePath, `\n# envault private key\n${entry}\n`);
      console.log(`📝 Added ${entry} to .gitignore`);
    }
  } else {
    fs.writeFileSync(gitignorePath, `# envault private key\n${entry}\n`);
    console.log(`📝 Created .gitignore with ${entry}`);
  }
}
