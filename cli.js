#!/usr/bin/env node
import { readFile } from "fs/promises";
import { InteractiveCommand, InteractiveOption } from "interactive-commander";

const program = new InteractiveCommand();

program
  .command("scan-logs")
  .description("Scan and delete logs")
  .addOption(new InteractiveOption("-y, --yes", "Confirm log removal"))
  .action(async (options) => {
    let { scanDirectory, removeLogs } = await import("./remove-logs.js");
    let logList = await scanDirectory("./src");

    if (logList.length > 0) {
      console.log("Found logs:", logList);

      if (options.yes) {
        for (const [matches, filePath] of logList) {
          if (matches) {
            const content = await readFile(filePath, "utf8");
            await removeLogs(filePath, content);
          }
        }
        console.log("Logs removed.");
      } else {
        console.log("Logs not removed.");
      }
    }
  });


await program
  // Enables interactive mode (when -i or --interactive is passed in)
  // This should almost always be called on the root command right before
  // calling parseAsync
  .interactive("-i, --interactive", "interactive mode")
  .parseAsync(process.argv);

