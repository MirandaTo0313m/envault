import { Command } from "commander";
import { runLint } from "./commands/lint";
import { DEFAULT_ENV_FILE } from "./constants";

export function registerLintCommand(program: Command): void {
  program
    .command("lint [file]")
    .description("Lint a .env file for common issues (duplicate keys, bad naming, empty values)")
    .option("--strict", "Treat warnings as errors")
    .action((file: string | undefined, opts: { strict?: boolean }) => {
      const target = file ?? DEFAULT_ENV_FILE;
      if (opts.strict) {
        process.env._ENVAULT_LINT_STRICT = "1";
      }
      runLint(target);
    });
}
