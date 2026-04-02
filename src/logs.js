import { readdir, readFile, writeFile } from "fs/promises";
import path from "path";
import recast from "recast";
import {
  extractLogs,
  isTargetedConsoleLog,
  rescueLeadingComments,
  commentOutLogs,
} from "./helper/index.js";

const { parse, print, visit } = recast;
const acornParse = (await import("acorn")).parse;

const parseOptions = {
  parser: {
    parse(src) {
      const comments = [];
      const ast = acornParse(src, {
        ecmaVersion: "latest",
        sourceType: "module",
        locations: true,
        ranges: true,
        onComment: comments,
      });
      ast.comments = comments;
      return ast;
    },
  },
};

/***
 * Scans a directory for JavaScript/TypeScript(wip) files, parses them, and extracts all console.log statements along with their positions.
 *
 * @param {string} dir - The directory to scan
 * @returns {Promise<Array>} - A list of console.log statements with their positions and file paths
 */
export async function scanDirectory(dir) {
  const files = await readdir(dir);
  const logs = [];
  for (const file of files) {
    const filePath = path.join(dir, file);
    const content = await readFile(filePath, "utf8");
    const ast = parse(content, parseOptions);
    const logDetails = extractLogs(ast, content);
    logs.push([logDetails, filePath]);
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
  if (mode === "comment") {
    const result = commentOutLogs(content, logsToModify);
    await writeFile(filePath, result, "utf8");
    return;
  }

  // mode === "remove" (defaults to remove; might change in future if more modes are added)
  const ast = parse(content, parseOptions);
  const callSet = new Set(logsToModify.map((l) => `${l.start},${l.end}`));

  visit(ast, {
    visitExpressionStatement(nodePath) {
      if (isTargetedConsoleLog(nodePath.node, callSet)) {
        rescueLeadingComments(nodePath);
        nodePath.prune();
        return false;
      }
      this.traverse(nodePath);
    },
  });

  const { code } = print(ast, { reuseWhitespace: true });
  await writeFile(filePath, code, "utf8");
}
