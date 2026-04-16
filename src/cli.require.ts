import { Command } from "commander";
import * as path from "path";
import { VAULT_FILE } from "./constants";
import { runRequire } from "./commands/require";

export function registerRequireCommand(program: Command): void {
  program
    .command("require <requireFile>")
    .description(
      "Check that all keys listed in a require file exist and have values in the vault"
    )
    .option("-v, --vault <path>", "Path to vault file", VAULT_FILE)
    .action((requireFile: string, opts: { vault: string }) => {
      runRequire(path.resolve(opts.vault), path.resolve(requireFile));
    });
}
