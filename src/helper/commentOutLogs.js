// Comment out each log by prefixing every physical line of its source range with
// "// " (back-to-front so earlier offsets stay valid). Prefixing each line keeps
// multiline calls fully commented.
export function commentOutLogs(content, logsToModify) {
  const sorted = [...logsToModify].sort((a, b) => b.start - a.start);
  let result = content;

  for (const { start, end } of sorted) {
    const logCode = result.slice(start, end);

    const replacement = logCode
      .split("\n")
      .map((line) => `// ${line}`)
      .join("\n");

    result = result.slice(0, start) + replacement + result.slice(end);
  }

  return result;
}
