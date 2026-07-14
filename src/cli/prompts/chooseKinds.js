import chalk from "chalk";
import { checkbox } from "@inquirer/prompts";
import { promptWithEsc, helpTipWithEsc } from "./esc.js";

/**
 * Prompts for which finding kinds to include, pre-checking log and debugger.
 * @param {Map<string, number>} counts kind to count
 * @returns {Promise<string[]>} the selected kinds
 */
export async function chooseKinds(counts) {
  const choices = [...counts]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([kind, count]) => ({
      name: `${kind} ${chalk.dim(`(${count})`)}`,
      value: kind,
      checked: kind === "console.log" || kind === "debugger",
    }));

  return await promptWithEsc((signal) =>
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
}
