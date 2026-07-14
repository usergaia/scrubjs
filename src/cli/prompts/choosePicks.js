import chalk from "chalk";
import { checkbox, Separator } from "@inquirer/prompts";
import { displayPath, formatLabel, renderContext } from "../../ui.js";
import { promptWithEsc, helpTipWithEsc } from "./esc.js";
import { readFile } from "node:fs/promises";

/**
 * Prompts for which findings to act on, with a per-finding preview.
 * @param {Array} fileResults `[[findings, filePath], ...]`
 * @param {Array<{filePath: string, finding: object}>} flat flattened entries
 * @param {string} task "comment" or "remove", shown in the message and preview
 * @returns {Promise<Array<{filePath: string, finding: object}>>} the chosen entries
 */
export async function choosePicks(fileResults, flat, task) {
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
  return picks.map((picked) => flat[picked]);
}
