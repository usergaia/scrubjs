/**
 * Prefixes every physical line of each match with "// ", back-to-front.
 * @param {string} content source to edit
 * @param {object[]} findings findings to comment out
 * @returns {string} the edited source
 */
export function commentOut(content, findings) {
  const sorted = [...findings].sort((a, b) => b.start - a.start);
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
