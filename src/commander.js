#!/usr/bin/env node
import { readFileSync } from "fs";
import { Command } from "commander";
import chalk from "chalk";
import { handleScan } from "./cli/index.js";

const pkg = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);

const program = new Command();

program
  .name("scrubjs")
  .description("Safely remove or comment out leftover debug statements.")
  .version(pkg.version);

program
  .command("scan [path]")
  .description("Scan a file or directory for debug statements")
  .option("-r, --remove", "Remove statements")
  .option("-c, --comment", "Comment out statements")
  .option("-a, --all", "Apply to every detected statement without prompting for a selection")
  .option("-d, --dry-run", "Show what would change without writing any files")
  .option("-s, --staged", "Scan only git-staged files")
  .option("--check", "Exit non-zero if any statements are found, and make no changes")
  .option("-m, --methods <list>", "console methods to target, comma-separated", "log")
  .option("--no-debugger", "Leave debugger statements alone")
  .action(handleScan);

// Top-level await would make Node warn when a prompt is aborted.
program.parseAsync(process.argv).catch((error) => {
  // Esc aborts the signal (AbortPromptError); Ctrl+C throws ExitPromptError.
  if (error && (error.name === "AbortPromptError" || error.name === "ExitPromptError")) {
    console.log(chalk.dim("Cancelled. No changes made."));
    process.exit(130);
  }
  console.error(chalk.red(error?.message ?? error));
  process.exit(1);
});
