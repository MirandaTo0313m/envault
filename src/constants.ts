import path from 'path';

export const ENVAULT_DIR = path.resolve('.envault');
export const PUBLIC_KEY_FILE = path.join(ENVAULT_DIR, 'key.pub');
export const PRIVATE_KEY_FILE = path.join(ENVAULT_DIR, 'key.priv');
export const ENCRYPTED_ENV_FILE = path.join(ENVAULT_DIR, 'env.enc');
export const GITIGNORE_FILE = path.resolve('.gitignore');

export const ENVAULT_GITIGNORE_ENTRIES = [
  '.envault/key.priv',
  '*.env',
  '.env',
];
