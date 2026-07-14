#!/usr/bin/env node
import { readFile } from "fs/promises";
import { Command } from "commander";
import { select, checkbox, Separator } from "@inquirer/prompts";
import chalk from "chalk";
import ora from "ora";
import { scanPath, modifyLogs } from "./logs.js";
import {
  displayPath,
  formatLogLabel,
  renderList,
  renderContext,
  renderFileDiff,
  ok,
} from "./ui.js";

const program = new Command();

// Run a prompt that also cancels on Esc: a keypress listener aborts the signal,
// which makes @inquirer reject with AbortPromptError (handled like Ctrl+C below).
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

// Append "esc cancel" to a prompt's help line, matching its default styling.
function helpTipWithEsc(keys) {
  return [...keys, ["esc", "cancel"]]
    .map(([key, action]) => `${chalk.bold(key)} ${chalk.dim(action)}`)
    .join(chalk.dim(" • "));
}

program
  .command("scan <path>")
  .description("Scan a file or directory for console.log statements")
  .option("-r, --remove", "Remove logs")
  .option("-c, --comment", "Comment out logs")
  .option("-a, --all", "Apply to every detected log without prompting for a selection")
  .option("-d, --dry-run", "Show what would change without writing any files")
  .action(async (scanTarget, options) => {
    // Spinner only on a TTY — otherwise it leaks a frame into piped/CI output.
    const spinner = process.stdout.isTTY ? ora("Scanning…").start() : null;
    const logList = await scanPath(scanTarget);
    if (spinner) spinner.stop();

    if (logList.length === 0) {
      console.log(chalk.dim("No console.log statements found."));
      return;
    }

    const flat = [];
    for (const [logDetails, filePath] of logList) {
      for (const log of logDetails) {
        flat.push({ filePath: filePath, log: log });
      }
    }

    const fileWord = logList.length === 1 ? "file" : "files";
    const logWord = flat.length === 1 ? "statement" : "statements";
    console.log(
      `${chalk.bold(flat.length)} console.log ${logWord} in ${chalk.bold(logList.length)} ${fileWord}\n`,
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
      for (const [logDetails, filePath] of logList) {
        const content = await readFile(filePath, "utf8");
        choices.push(new Separator(chalk.underline(displayPath(filePath))));
        for (const log of logDetails) {
          choices.push({
            name: `${chalk.dim(log.line)}  ${formatLogLabel(log.code)}`,
            value: index,
            checked: true,
            description: "\n" + renderContext(content, log, task),
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
      console.log(chalk.dim("Nothing selected — no changes made."));
      return;
    }

    // Regroup the selected logs by file so each file is read/written once.
    const byFile = new Map();
    for (const { filePath, log } of selected) {
      if (!byFile.has(filePath)) byFile.set(filePath, []);
      byFile.get(filePath).push(log);
    }

    if (options.dryRun) {
      for (const [filePath, logs] of byFile) {
        const content = await readFile(filePath, "utf8");
        console.log(renderFileDiff(filePath, content, logs, task) + "\n");
      }
      console.log(chalk.dim("Dry run — no files changed."));
      return;
    }

    // With --all there's no pick list, so show what's about to change first.
    if (options.all) console.log(renderList(logList) + "\n");

    for (const [filePath, logs] of byFile) {
      const content = await readFile(filePath, "utf8");
      await modifyLogs(filePath, content, logs, task);
    }

    const verb = task === "remove" ? "Removed" : "Commented out";
    const count = selected.length;
    console.log(ok(`${verb} ${count} log${count === 1 ? "" : "s"}.`));
  });

// Not top-level await: a pending top-level await when a prompt is aborted makes
// Node print an "unsettled top-level await" warning.
program.parseAsync(process.argv).catch((error) => {
  // Esc aborts the signal (AbortPromptError); Ctrl+C throws ExitPromptError.
  if (error && (error.name === "AbortPromptError" || error.name === "ExitPromptError")) {
    console.log(chalk.dim("Cancelled. No changes made."));
    process.exit(130);
  }
  console.error(error);
  process.exit(1);
});
