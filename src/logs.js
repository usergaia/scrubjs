import { readdir, writeFile, stat } from "fs/promises";
import path from "path";
import { print, visit } from "recast";
import {
  processFile,
  checkTargetedConsoleLog,
  rescueLeadingComments,
  commentOutLogs,
} from "./helper/index.js";
import { getParser } from "./parser.js";

/***
 * Scans a directory or file for JavaScript/TypeScript(wip) files, parses them, and extracts all console.log statements along with their positions.
 *
 * @param {string} path - The directory or file path to scan
 * @returns {Promise<Array>} - A list of console.log statements with their positions and file paths
 */
export async function scanPath(scanTarget) {
  const logs = [];
  const supportedExtensions = [".js", ".ts", ".tsx", ".jsx"]; // react/ts wip
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

/***
 * Modifies the source code of a file by either removing or commenting out specified console.log statements based on the provided mode.
 *
 * @param {string} filePath - The path to the file to modify
 * @param {string} content - The original source code of the file
 * @param {Array<{start: number, end: number}>} logsToModify - An array of objects containing the start and end character offsets of console.log statements to modify
 * @param {string} mode - The modification mode, either "remove" to delete the statements or "comment" to comment them out
 */
export async function modifyLogs(filePath, content, logsToModify, mode) {
  function handleVisitExpressionStatement(nodePath) {
    if (checkTargetedConsoleLog(nodePath.node, callSet)) {
      rescueLeadingComments(nodePath);
      nodePath.prune();
      return false;
    }
    this.traverse(nodePath);
  }

  if (mode === "comment") {
    const result = commentOutLogs(content, logsToModify);
    await writeFile(filePath, result, "utf8");
    return;
  }

  // mode === "remove" (defaults to remove; might change in future if more modes are added)
  const ast = getParser(content, filePath);
  const callSet = new Set(logsToModify.map((l) => `${l.start},${l.end}`));

  visit(ast, {
    visitExpressionStatement: handleVisitExpressionStatement,
  });

  const { code } = print(ast, { reuseWhitespace: true });
  await writeFile(filePath, code, "utf8");
}
