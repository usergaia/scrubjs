/**
 * Comments out specified log statements in the source code by prefixing their lines with "// ".
 *
 * @param {string} content - The source code as a string.
 * @param {Array<{start: number, end: number}>} logsToModify - Array of objects with start and end character offsets for each log to comment out.
 * @returns {string} The commented source code with specified logs commented out.
 */

export function commentOutLogs(content, logsToModify) {
  const sorted = [...logsToModify].sort((a, b) => b.start - a.start);
  let result = content;

  for (const { start, end, isJSXExpression } of sorted) {
    const logCode = result.slice(start, end);

    const replacement = isJSXExpression ? `/* ${logCode} */` : `// ${logCode}`;

    result = result.slice(0, start) + replacement + result.slice(end);
  }

  return result;
}
