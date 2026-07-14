import { select } from "@inquirer/prompts";
import { promptWithEsc } from "./esc.js";

/**
 * Resolves the task from flags, or prompts to comment, remove, or cancel.
 * @param {object} options parsed CLI options
 * @returns {Promise<"comment"|"remove"|null>} the chosen task
 */
export async function chooseTask(options) {
  if (options.remove || options.comment) {
    return options.remove ? "remove" : "comment";
  }
  return await promptWithEsc((signal) =>
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