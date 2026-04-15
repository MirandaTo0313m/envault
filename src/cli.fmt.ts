import type { Command } from "commander";
import { runFmt } from "./commands/fmt";
import { DEFAULT_VAULT_FILE } from "./constants";

export function registerFmtCommand(program: Command): void {
  program
    .command("fmt")
    .description(
      "Format the vault file: sort keys alphabetically and normalize spacing"
    )
    .option(
      "-v, --vault <path>",
      "Path to the vault file",
      DEFAULT_VAULT_FILE
    )
    .option(
      "--check",
      "Check formatting without writing changes (exits with 1 if unformatted)",
      false
    )
    .action((opts: { vault: string; check: boolean }) => {
      runFmt(opts.vault, opts.check);
    });
}
