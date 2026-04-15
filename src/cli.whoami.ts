import { Command } from "commander";
import { runWhoami } from "./commands/whoami";

export function registerWhoamiCommand(program: Command): void {
  program
    .command("whoami")
    .description(
      "Display the current user identity — public key path and fingerprint"
    )
    .action(() => {
      runWhoami(process.cwd());
    });
}
