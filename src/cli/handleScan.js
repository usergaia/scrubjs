import { readFile } from "fs/promises";
import ora from "ora";
import chalk from "chalk";
import { scanPath, modify } from "../scan.js";
import { renderList, renderFileDiff, ok } from "../ui.js";
import { chooseKinds, choosePicks, chooseTask } from "./prompts/index.js";
import { getKindCount, filterByKind, flattenFileResult, groupByFile } from "./filters/index.js";
// Interactive scans look for all of these so the include prompt can offer them.
const BROAD_METHODS = ["log", "info", "debug", "warn", "error"];

/**
 * Picks the console methods to target from the flags and mode.
 * @param {object} options parsed CLI options
 * @param {boolean} methodsExplicit whether `-m` was passed on the CLI
 * @param {boolean} interactive whether the scan prompts for a selection
 * @returns {string[]} the methods to detect
 */
function resolveMethods(options, methodsExplicit, interactive) {
  if (methodsExplicit) {
    return options.methods.split(",").map((method) => method.trim()).filter(Boolean);
  }
  if (interactive) {
    return BROAD_METHODS;
  }
  return ["log"];
}

/**
 * Runs the `scan` command: scan, then comment or remove selected findings.
 * @param {string} scanTarget file or directory to scan
 * @param {object} options parsed CLI options
 * @param {import("commander").Command} command the command, for option sources
 * @returns {Promise<void>}
 */
export async function handleScan(scanTarget, options, command) {
  const methodsExplicit = command.getOptionValueSource("methods") === "cli";
  const interactive = !options.all;
  const methods = resolveMethods(options, methodsExplicit, interactive);

  // A non-TTY spinner leaks a stray frame into piped output.
  const spinner = process.stdout.isTTY ? ora("Scanning…").start() : null;
  let fileResults = await scanPath(scanTarget, {
    methods: methods,
    debugger: options.debugger,
  });
  if (spinner) spinner.stop();

  if (fileResults.length === 0) {
    console.log(chalk.dim("No debug statements found."));
    return;
  }

  // Without explicit methods, let the user pick which kinds to include.
  if (interactive && !methodsExplicit) {
    const counts = getKindCount(fileResults);
    if (counts.size > 1) {
      const included = await chooseKinds(counts);
      if (included.length === 0) {
        console.log(chalk.dim("Nothing selected. No changes made."));
        return;
      }
      fileResults = filterByKind(fileResults, new Set(included));
    }
  }

  const flat = flattenFileResult(fileResults);

  const fileWord = fileResults.length === 1 ? "file" : "files";
  const word = flat.length === 1 ? "statement" : "statements";
  console.log(
    `${chalk.bold(flat.length)} debug ${word} in ${chalk.bold(fileResults.length)} ${fileWord}\n`,
  );

  const task = await chooseTask(options);
  if (!task) {
    console.log(chalk.dim("No changes made."));
    return;
  }

  const selected = options.all ? flat : await choosePicks(fileResults, flat, task);

  if (selected.length === 0) {
    console.log(chalk.dim("Nothing selected. No changes made."));
    return;
  }

  const byFile = groupByFile(selected);

  if (options.dryRun) {
    for (const [filePath, findings] of byFile) {
      const content = await readFile(filePath, "utf8");
      console.log(renderFileDiff(filePath, content, findings, task) + "\n");
    }
    console.log(chalk.dim("Dry run. No files changed."));
    return;
  }

  // With --all there is no pick list, so the pending changes are listed first.
  if (options.all) console.log(renderList(fileResults) + "\n");

  for (const [filePath, findings] of byFile) {
    const content = await readFile(filePath, "utf8");
    await modify(filePath, content, findings, task);
  }

  const verb = task === "remove" ? "Removed" : "Commented out";
  const count = selected.length;
  console.log(ok(`${verb} ${count} statement${count === 1 ? "" : "s"}.`));
}
