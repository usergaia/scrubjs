import { readFile } from "fs/promises";
import { getParser } from "../parser.js";
import { extractFindings } from "../rules/index.js";

/**
 * A file's debug statements, or null when it has none.
 * @param {string} filePath file to read and scan
 * @param {object} [options] rule toggles passed to the detectors
 * @returns {Promise<object[]|null>} the findings, or null
 */
export async function processFile(filePath, options) {
  const content = await readFile(filePath, "utf8");
  const ast = getParser(content, filePath);
  const findings = extractFindings(ast, content, options);
  return findings.length > 0 ? findings : null;
}
