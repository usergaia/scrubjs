import { readFile } from "fs/promises";
import { getParser } from "../parser.js";
import { extractLogs } from "./extractLogs.js";

// Read, parse, and extract a file's console.log statements (null if none).
export async function processFile(filePath) {
  const content = await readFile(filePath, "utf8");
  const ast = getParser(content, filePath);
  const logDetails = extractLogs(ast, content);
  return logDetails.length > 0 ? logDetails : null;
}
