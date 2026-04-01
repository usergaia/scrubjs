#!/usr/bin/env node
import { readFile } from "fs/promises";
import { Command } from "commander";
import inquirer from "inquirer";

const program = new Command();

program
  .command("scan <path>")
  .description("Scan and delete logs")
  .option("-y, --yes", "Confirm log removal")
  .action(async (path, options) => {
    let { scanDirectory, modifyLogs } = await import("./logs.js");
    let logList = await scanDirectory(path); //returns [code,start,end], filePath

    if (logList.length > 0) {
      // console.log("Found logs:", logList[0]);
      for (const [logDetails, filePath] of logList) {
        console.log(`File: ${filePath}`);
        for (const log of logDetails) {
          console.log(`   Line#: ${log.code}`);
        }
        console.log("\n");
      }
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
        for (const [logDetails, filePath] of logList) {
          if (logDetails.length > 0) {
            const content = await readFile(filePath, "utf8");
            await modifyLogs(filePath, content, logDetails); // Pass logDetails here!
          }
        }
        console.log("Logs removed.");
      } else {
        console.log("Logs not removed.");
      }
    }
  });

await program.parseAsync(process.argv);
