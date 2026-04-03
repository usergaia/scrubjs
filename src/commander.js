#!/usr/bin/env node
import { readFile } from "fs/promises";
import { Command } from "commander";
import inquirer from "inquirer";

const program = new Command();

program
  .command("scan <path>")
  .description("Scan a directory for console.log statements")
  .option("-s, --show", "Show logs") // default behavior is to show logs, this is just an explicit option for it
  .option("-r, --remove", "Remove logs")
  .option("-c, --comment", "Comment out logs")
  .action(async (path, options) => {
    let { scanDirectory, modifyLogs } = await import("./logs.js");
    let logList = await scanDirectory(path); // returns [[code, start, end], filePath]

    if (logList.length > 0) {
      for (const [logDetails, filePath] of logList) {
        console.log(`File: ${filePath}`);
        for (const log of logDetails) {
          console.log(`   Line#: ${log.code}`);
        }
        console.log("\n");
      }

      let task;
      const hasTask = options.remove || options.comment;

      if (hasTask) {
        task = options.remove ? "remove" : "comment";
      } else {
        const taskPrompt = await inquirer.prompt([
          {
            type: "select",
            name: "task",
            message: "What do you want to do?",
            choices: [
              { name: "Remove logs", value: "remove" },
              { name: "Comment out logs", value: "comment" },
              { name: "Cancel", value: null },
            ],
          },
        ]);
        task = taskPrompt.task;
      }

      if (task) {
        const confirmPrompt = await inquirer.prompt([
          {
            type: "input",
            name: "confirm",
            message: `Are you sure you want to ${task} all console.log statements? (y/n)`,
            validate: (input) => {
              const val = input.trim().toLowerCase();
              return val === "y" || val === "n"
                ? true
                : "Please enter 'y' or 'n'";
            },
          },
        ]);

        let confirm = confirmPrompt.confirm.trim().toLowerCase() === "y";

        if (confirm) {
          for (const [logDetails, filePath] of logList) {
            if (logDetails.length > 0) {
              const content = await readFile(filePath, "utf8");
              await modifyLogs(filePath, content, logDetails, task);
            }
          }
          console.log(`Logs modified.`);
        } else {
          console.log(`Logs not modified.`);
        }
      } else {
        console.log("No changes made.");
      }
    }
  });

await program.parseAsync(process.argv);
