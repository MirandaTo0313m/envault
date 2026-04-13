import { Command } from "commander";
import { runEnv } from "./commands/env";
import { VAULT_FILE } from "./constants";

export function registerEnvCommand(program: Command): void {
  program
    .command("env")
    .description(
      "Decrypt and print all vault entries as environment variables"
    )
    .option("-v, --vault <path>", "Path to vault file", VAULT_FILE)
    .option(
      "-f, --format <format>",
      "Output format: plain or export",
      "plain"
    )
    .action(async (opts: { vault: string; format: string }) => {
      const format = opts.format === "export" ? "export" : "plain";
      try {
        await runEnv(opts.vault, format);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
