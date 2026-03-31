#!/usr/bin/env node
import { readFile } from "fs/promises";
import { Command } from "commander";
import inquirer from "inquirer";

const program = new Command();

program
  .command("scan-logs")
  .description("Scan and delete logs")
  .option("-y, --yes", "Confirm log removal")
  .action(async (options) => {
    let { scanDirectory, removeLogs } = await import("./remove-logs.js");
    let logList = await scanDirectory("./src");

    if (logList.length > 0) {
      console.log("Found logs:", logList);

      let confirm = options.yes;

      if (!confirm) {
        const answer = await inquirer.prompt([
          {
            type: "input",
            name: "confirm",
            message: "Do you want to remove all console.log statements? (y/n)",
            validate: (input) => {
              const val = input.trim().toLowerCase();
              return val === "y" || val === "n"
                ? true
                : "Please enter 'y' or 'n'";
            },
          },
        ]);
        confirm = answer.confirm.trim().toLowerCase() === "y";
      }

      if (confirm) {
        for (const [matches, filePath] of logList) {
          if (matches.length > 0) {
            const content = await readFile(filePath, "utf8");
            await removeLogs(filePath, content); // iagl this might be computationally expensive
          }
        }
        console.log("Logs removed.");
      } else {
        console.log("Logs not removed.");
      }
    }
  });

await program.parseAsync(process.argv);
