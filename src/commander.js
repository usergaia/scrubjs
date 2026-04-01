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
    let logList = await scanDirectory(path);

    if (logList.length > 0) {
      for (const [logDetails, filePath] of logList) {
        console.log(`File: ${filePath}`);
        for (const log of logDetails) {
          console.log(`   Line#: ${log.code}`);
        }
        console.log("\n");
      }

      let action = null;

      if (options.remove) {
        action = "remove";
      } else if (options.comment) {
        action = "comment";
      } else {
        // only prompt if no option was passed
        const task = await inquirer.prompt([
          {
            type: "select",
            name: "action",
            message: "What do you want to do?",
            choices: [
              { name: "Remove logs", value: "remove" },
              { name: "Comment out logs", value: "comment" },
              { name: "Cancel", value: "skip" },
            ],
          },
        ]);
        action = task.action;
      }

      if (action === "remove") {
        const answer = await inquirer.prompt([
          {
            type: "input",
            name: "confirm",
            message:
              "Are you sure you want to remove all console.log statements? (y/n)",
            validate: (input) => {
              const val = input.trim().toLowerCase();
              return val === "y" || val === "n"
                ? true
                : "Please enter 'y' or 'n'";
            },
          },
        ]);
        let confirm = answer.confirm.trim().toLowerCase() === "y";
        if (confirm) {
          for (const [logDetails, filePath] of logList) {
            if (logDetails.length > 0) {
              const content = await readFile(filePath, "utf8");
              await modifyLogs(filePath, content, logDetails, "remove");
            }
          }
          console.log("Logs removed.");
        } else {
          console.log("Logs not removed.");
        }
      } else if (action === "comment") {
        const answer = await inquirer.prompt([
          {
            type: "input",
            name: "confirm",
            message:
              "Are you sure you want to comment all console.log statements? (y/n)",
            validate: (input) => {
              const val = input.trim().toLowerCase();
              return val === "y" || val === "n"
                ? true
                : "Please enter 'y' or 'n'";
            },
          },
        ]);
        let confirm = answer.confirm.trim().toLowerCase() === "y";
        if (confirm) {
          for (const [logDetails, filePath] of logList) {
            if (logDetails.length > 0) {
              const content = await readFile(filePath, "utf8");
              await modifyLogs(filePath, content, logDetails, "comment");
            }
          }
          console.log("Logs commented out.");
        } else {
          console.log("Logs not commented out.");
        }
      } else {
        console.log("No changes made.");
      }
    }
  });
await program.parseAsync(process.argv);
