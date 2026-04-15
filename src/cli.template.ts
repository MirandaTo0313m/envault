import { Command } from "commander";
import { runTemplate } from "./commands/template";

/**
 * Registers the `template` command with the CLI.
 *
 * The template command generates a `.env.template` file from the current vault,
 * listing all keys with empty values — useful for onboarding new team members.
 *
 * Usage:
 *   envault template [options]
 *
 * Options:
 *   -v, --vault <path>     Path to the vault file (default: .env.vault)
 *   -o, --output <path>    Output path for the template file (default: .env.template)
 *   --overwrite            Overwrite the output file if it already exists
 */
export function registerTemplateCommand(program: Command): void {
  program
    .command("template")
    .description(
      "Generate a .env.template file from the vault with keys and empty values"
    )
    .option("-v, --vault <path>", "Path to the vault file", ".env.vault")
    .option("-o, --output <path>", "Output path for the template file", ".env.template")
    .option("--overwrite", "Overwrite the output file if it already exists", false)
    .action(async (options) => {
      await runTemplate({
        vaultPath: options.vault,
        outputPath: options.output,
        overwrite: options.overwrite,
      });
    });
}
