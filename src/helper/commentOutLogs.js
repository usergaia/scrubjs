/**
 * Comments out specified log statements in the source code by prefixing their lines with "// ".
 *
 * @param {string} content - The source code as a string.
 * @param {Array<{start: number, end: number}>} logsToModify - Array of objects with start and end character offsets for each log to comment out.
 * @returns {string} The commented source code with specified logs commented out.
 */

export function commentOutLogs(content, logsToModify) {
  const lines = content.split("\n");

  const lineRanges = logsToModify.map(({ start, end }) => {
    const startLine = offsetToLine(content, start);
    const endLine = offsetToLine(content, end);
    return { startLine, endLine };
  });

  lineRanges.sort((a, b) => b.startLine - a.startLine);

  for (const { startLine, endLine } of lineRanges) {
    for (let i = startLine; i <= endLine; i++) {
      lines[i] = "// " + lines[i];
    }
  }

  return lines.join("\n");
}

/**
 * Converts a character offset to a 0-based line index.
 *
 * @param {string} content - The source code as a string.
 * @param {number} offset - The character offset to convert.
 * @returns {number} The 0-based line index corresponding to the character offset.
 */
function offsetToLine(content, offset) {
  let line = 0;
  for (let i = 0; i < offset; i++) {
    if (content[i] === "\n") line++;
  }
  return line;
}
