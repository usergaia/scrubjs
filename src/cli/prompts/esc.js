import chalk from "chalk";

/**
 * Runs a prompt that Esc cancels by aborting its signal.
 * @param {(signal: AbortSignal) => Promise<any>} run starts the prompt with a signal
 * @returns {Promise<any>} the prompt's answer
 */
export async function promptWithEsc(run) {
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
export function helpTipWithEsc(keys) {
  return [...keys, ["esc", "cancel"]]
    .map(([key, action]) => `${chalk.bold(key)} ${chalk.dim(action)}`)
    .join(chalk.dim(" • "));
}
