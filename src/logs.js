import { readdir, writeFile, stat } from "fs/promises";
import path from "path";
import { processFile, commentOutLogs, removeLogs } from "./helper/index.js";

// Recursively collect console.log statements from a file or directory (skipping
// dotfolders and node_modules), returning [[logDetails, filePath], ...].
export async function scanPath(scanTarget) {
  const logs = [];
  const supportedExtensions = [".js", ".ts", ".tsx", ".jsx"];
  const fileStats = await stat(scanTarget);

  function isFileValid(filePath) {
    return supportedExtensions.some((ext) => filePath.endsWith(ext));
  }

  async function handleFile() {
    if (isFileValid(scanTarget)) {
      const logDetails = await processFile(scanTarget);
      if (logDetails) logs.push([logDetails, scanTarget]);
    }
  }

  async function handleDirectory() {
    const files = await readdir(scanTarget, { withFileTypes: true });
    for (const file of files) {
      const filePath = path.join(scanTarget, file.name);
      if (file.isDirectory()) {
        if (!file.name.startsWith(".") && file.name !== "node_modules") {
          const nestedLogs = await scanPath(filePath);
          logs.push(...nestedLogs);
        }
      } else if (isFileValid(filePath)) {
        const logDetails = await processFile(filePath);
        if (logDetails) logs.push([logDetails, filePath]);
      }
    }
  }

  if (fileStats.isDirectory()) {
    await handleDirectory();
  } else if (fileStats.isFile()) {
    await handleFile();
  }

  return logs;
}

// Comment out or remove the targeted logs and write the file. Both modes splice
// `content` directly, so only the targeted statements change; formatting and
// line endings are preserved.
export async function modifyLogs(filePath, content, logsToModify, mode) {
  const result =
    mode === "comment"
      ? commentOutLogs(content, logsToModify)
      : removeLogs(content, logsToModify);

  await writeFile(filePath, result, "utf8");
}
