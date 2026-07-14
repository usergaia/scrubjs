// Splice targeted statements out of the original string, back-to-front. A
// statement alone on its line takes the whole line (and its newline) so no blank
// line is left; one sharing a line with other code is removed on its own.
export function removeLogs(content, logsToModify) {
  const removable = logsToModify
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
      // Statement occupies its own line — drop the whole line and its newline.
      from = lineStart;
      to = lineEnd < result.length ? lineEnd + 1 : lineEnd;
    }

    result = result.slice(0, from) + result.slice(to);
  }

  return result;
}
