/**
 * Splices each match out of `content`, back-to-front.
 * @param {string} content source to edit
 * @param {object[]} findings findings carrying a `stmtStart`/`stmtEnd` span
 * @returns {string} the edited source
 */
export function removeStatements(content, findings) {
  const removable = findings
    .filter((log) => typeof log.stmtStart === "number")
    .sort((a, b) => b.stmtStart - a.stmtStart);

  let result = content;

  for (const { stmtStart, stmtEnd } of removable) {
    let from = stmtStart;
    let to = stmtEnd;

    const lineStart = result.lastIndexOf("\n", stmtStart - 1) + 1;
    let lineEnd = result.indexOf("\n", stmtEnd);
    if (lineEnd === -1) lineEnd = result.length;

    const before = result.slice(lineStart, stmtStart);
    const after = result.slice(stmtEnd, lineEnd);

    if (before.trim() === "" && after.trim() === "") {
      // A statement alone on its line takes the whole line, so no blank remains.
      from = lineStart;
      to = lineEnd < result.length ? lineEnd + 1 : lineEnd;
    }

    result = result.slice(0, from) + result.slice(to);
  }

  return result;
}
