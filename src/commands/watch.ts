import * as fs from 'fs';
import * as path from 'path';
import { DEFAULT_ENV_FILE, DEFAULT_VAULT_FILE } from '../constants';
import { loadPublicKey } from '../crypto/keyPair';
import { encryptWithPublicKey } from '../crypto/encrypt';

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function debounceEncrypt(
  envPath: string,
  vaultPath: string,
  delay = 500
): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    try {
      const publicKey = loadPublicKey();
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const encrypted = encryptWithPublicKey(envContent, publicKey);
      fs.writeFileSync(vaultPath, encrypted, 'utf-8');
      console.log(`[envault] Vault updated at ${new Date().toLocaleTimeString()}`);
    } catch (err: any) {
      console.error(`[envault] Failed to encrypt: ${err.message}`);
    }
  }, delay);
}

export function runWatch(
  envPath: string = DEFAULT_ENV_FILE,
  vaultPath: string = DEFAULT_VAULT_FILE
): () => void {
  const resolvedEnv = path.resolve(envPath);
  const resolvedVault = path.resolve(vaultPath);

  if (!fs.existsSync(resolvedEnv)) {
    throw new Error(`Env file not found: ${resolvedEnv}`);
  }

  console.log(`[envault] Watching ${resolvedEnv} for changes...`);

  const watcher = fs.watch(resolvedEnv, (eventType) => {
    if (eventType === 'change') {
      console.log(`[envault] Change detected in ${path.basename(resolvedEnv)}`);
      debounceEncrypt(resolvedEnv, resolvedVault);
    }
  });

  watcher.on('error', (err) => {
    console.error(`[envault] Watcher error: ${err.message}`);
  });

  return () => {
    watcher.close();
    console.log('[envault] Stopped watching.');
  };
}
