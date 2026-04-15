import { Command } from "commander";
import { runArchive } from "./commands/archive";

export function registerArchiveCommand(program: Command): void {
  const archive = program
    .command("archive")
    .description("Archive or restore vault keys without permanently deleting them");

  archive
    .command("add <key>")
    .description("Archive a key (removes from active vault, keeps as hidden entry)")
    .option("-v, --vault <path>", "Path to vault file")
    .action((key: string, opts: { vault?: string }) => {
      runArchive("archive", key, opts.vault);
    });

  archive
    .command("restore <key>")
    .description("Restore an archived key back to the active vault")
    .option("-v, --vault <path>", "Path to vault file")
    .action((key: string, opts: { vault?: string }) => {
      runArchive("restore", key, opts.vault);
    });

  archive
    .command("list")
    .description("List all archived keys")
    .option("-v, --vault <path>", "Path to vault file")
    .action((opts: { vault?: string }) => {
      runArchive("list", undefined, opts.vault);
    });
}
