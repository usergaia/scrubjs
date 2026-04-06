import { readFile } from "fs/promises";
import { getParser } from "../parser.js";
import { extractLogs } from "./extractLogs.js";

/**
 * Reads a file, parses it, and extracts all console.log statements.
 *
 * @async
 * @param {string} filePath - The path to the file to process
 * @returns {Promise<Array|null>} An array of console.log details if found, otherwise null
 */
export async function processFile(filePath) {
  const content = await readFile(filePath, "utf8");
  const ast = getParser(content, filePath);
  const logDetails = extractLogs(ast, content);
  return logDetails.length > 0 ? logDetails : null;
}
