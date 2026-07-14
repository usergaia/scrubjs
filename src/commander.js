#!/usr/bin/env node
import { readFile } from "fs/promises";
import { readFileSync } from "fs";
import { Command } from "commander";
import { select, checkbox, Separator } from "@inquirer/prompts";
import chalk from "chalk";
import ora from "ora";
import { scanPath, scanStaged, modify } from "./scan.js";
import {
  displayPath,
  formatLabel,
  renderList,
  renderContext,
  renderFileDiff,
  ok,
} from "./ui.js";

const pkg = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);

// Interactive scans look for all of these so the include prompt can offer them.
const BROAD_METHODS = ["log", "info", "debug", "warn", "error"];

const program = new Command();

program
  .name("scrubjs")
  .description("Safely remove or comment out leftover debug statements.")
  .version(pkg.version);

/**
 * Runs a prompt that Esc cancels by aborting its signal.
 * @param {(signal: AbortSignal) => Promise<any>} run starts the prompt with a signal
 * @returns {Promise<any>} the prompt's answer
 */
async function promptWithEsc(run) {
  const controller = new AbortController();
  function onKeypress(_chunk, key) {
    if (key && key.name === "escape") controller.abort();
  }
  process.stdin.on("keypress", onKeypress);
  try {
    return await run(controller.signal);
  } finally {
    process.stdin.off("keypress", onKeypress);
  }
}

/**
 * The prompt's help line with an added "esc cancel" hint.
 * @param {Array<[string, string]>} keys default key/action pairs
 * @returns {string} the help line
 */
function helpTipWithEsc(keys) {
  return [...keys, ["esc", "cancel"]]
    .map(([key, action]) => `${chalk.bold(key)} ${chalk.dim(action)}`)
    .join(chalk.dim(" • "));
}

/**
 * Counts findings by kind across all files, in first-seen order.
 * @param {Array} fileResults `[[findings, filePath], ...]`
 * @returns {Map<string, number>} kind to count
 */
function kindCounts(fileResults) {
  const counts = new Map();
  for (const [findings] of fileResults) {
    for (const finding of findings) {
      counts.set(finding.kind, (counts.get(finding.kind) ?? 0) + 1);
    }
  }
  return counts;
}

/**
 * Keeps only findings whose kind is in `kinds`, dropping emptied files.
 * @param {Array} fileResults `[[findings, filePath], ...]`
 * @param {Set<string>} kinds kinds to keep
 * @returns {Array} the filtered results
 */
function filterByKinds(fileResults, kinds) {
  const out = [];
  for (const [findings, filePath] of fileResults) {
    const kept = findings.filter((finding) => kinds.has(finding.kind));
    if (kept.length) out.push([kept, filePath]);
  }
  return out;
}

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
  .action(async (scanTarget, options, command) => {
    const methodsExplicit = command.getOptionValueSource("methods") === "cli";
    // --check and --all never prompt, so they use the plain default methods.
    const interactive = !options.all && !options.check;

    let methods;
    if (methodsExplicit) {
      methods = options.methods.split(",").map((method) => method.trim()).filter(Boolean);
    } else if (interactive) {
      methods = BROAD_METHODS;
    } else {
      methods = ["log"];
    }

    const scanOptions = { methods: methods, debugger: options.debugger };

    // A non-TTY spinner leaks a stray frame into piped output.
    const spinner = process.stdout.isTTY ? ora("Scanning…").start() : null;
    let fileResults = options.staged
      ? await scanStaged(scanOptions)
      : await scanPath(scanTarget ?? ".", scanOptions);
    if (spinner) spinner.stop();

    if (fileResults.length === 0) {
      console.log(chalk.dim("No debug statements found."));
      return;
    }

    // --check reports and sets a failing exit code without changing anything.
    if (options.check) {
      const total = fileResults.reduce((sum, [findings]) => sum + findings.length, 0);
      console.log(renderList(fileResults) + "\n");
      const word = total === 1 ? "statement" : "statements";
      console.log(`${chalk.bold(total)} debug ${word} found.`);
      process.exitCode = 1;
      return;
    }

    // Without explicit methods, let the user pick which kinds to include.
    if (interactive && !methodsExplicit) {
      const counts = kindCounts(fileResults);
      if (counts.size > 1) {
        const choices = [...counts]
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([kind, count]) => ({
            name: `${kind} ${chalk.dim(`(${count})`)}`,
            value: kind,
            checked: kind === "console.log" || kind === "debugger",
          }));

        const included = await promptWithEsc((signal) =>
          checkbox(
            {
              message: "What should scrubjs look for?",
              loop: false,
              choices: choices,
              theme: {
                style: {
                  renderSelectedChoices: (selection) =>
                    chalk.dim(`${selection.length} selected`),
                  keysHelpTip: helpTipWithEsc,
                },
              },
            },
            { signal: signal },
          ),
        );

        if (included.length === 0) {
          console.log(chalk.dim("Nothing selected. No changes made."));
          return;
        }
        fileResults = filterByKinds(fileResults, new Set(included));
      }
    }

    const flat = [];
    for (const [findings, filePath] of fileResults) {
      for (const finding of findings) {
        flat.push({ filePath: filePath, finding: finding });
      }
    }

    const fileWord = fileResults.length === 1 ? "file" : "files";
    const word = flat.length === 1 ? "statement" : "statements";
    console.log(
      `${chalk.bold(flat.length)} debug ${word} in ${chalk.bold(fileResults.length)} ${fileWord}\n`,
    );

    let task;
    if (options.remove || options.comment) {
      task = options.remove ? "remove" : "comment";
    } else {
      task = await promptWithEsc((signal) =>
        select(
          {
            message: "What do you want to do?",
            choices: [
              { name: "Comment out", value: "comment" },
              { name: "Remove", value: "remove" },
              { name: "Cancel", value: null },
            ],
          },
          { signal: signal },
        ),
      );
    }

    if (!task) {
      console.log(chalk.dim("No changes made."));
      return;
    }

    let selected;
    if (options.all) {
      selected = flat;
    } else {
      const choices = [];
      let index = 0;
      for (const [findings, filePath] of fileResults) {
        const content = await readFile(filePath, "utf8");
        choices.push(new Separator(chalk.underline(displayPath(filePath))));
        for (const finding of findings) {
          choices.push({
            name: `${chalk.dim(finding.line)}  ${formatLabel(finding.code)}`,
            value: index,
            checked: true,
            description: "\n" + renderContext(content, finding, task),
          });
          index += 1;
        }
      }

      const picks = await promptWithEsc((signal) =>
        checkbox(
          {
            message: `Select which to ${task}:`,
            loop: false,
            pageSize: 10,
            choices: choices,
            theme: {
              style: {
                renderSelectedChoices: (selection) =>
                  chalk.dim(`${selection.length} selected`),
                keysHelpTip: helpTipWithEsc,
              },
            },
          },
          { signal: signal },
        ),
      );
      selected = picks.map((picked) => flat[picked]);
    }

    if (selected.length === 0) {
      console.log(chalk.dim("Nothing selected. No changes made."));
      return;
    }

    // Grouping by file reads and writes each file once.
    const byFile = new Map();
    for (const { filePath, finding } of selected) {
      if (!byFile.has(filePath)) byFile.set(filePath, []);
      byFile.get(filePath).push(finding);
    }

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
  });

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
