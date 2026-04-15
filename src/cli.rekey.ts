import { Command } from "commander";
import * as path from "path";
import { VAULT_FILE } from "./constants";
import { runRekey } from "./commands/rekey";

export function registerRekeyCommand(program: Command): void {
  program
    .command("rekey")
    .description(
      "Re-encrypt the vault with a new public key (e.g. after key rotation for a new team member)"
    )
    .option("-v, --vault <path>", "Path to vault file", VAULT_FILE)
    .requiredOption(
      "--old-private-key <path>",
      "Path to the old private key used to decrypt current vault entries"
    )
    .requiredOption(
      "--new-public-key <path>",
      "Path to the new public key to re-encrypt entries with"
    )
    .action(async (opts) => {
      try {
        await runRekey(
          path.resolve(opts.vault),
          path.resolve(opts.oldPrivateKey),
          path.resolve(opts.newPublicKey)
        );
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
