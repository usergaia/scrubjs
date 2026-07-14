/**
 * Flattens per-file findings into `{ filePath, finding }` entries.
 * @param {Array} fileResults `[[findings, filePath], ...]`
 * @returns {Array<{filePath: string, finding: object}>} the flat entries
 */
export function flattenFileResult(fileResults) {
  const flat = [];
  for (const [findings, filePath] of fileResults) {
    for (const finding of findings) {
      flat.push({ filePath: filePath, finding: finding });
    }
  }
  return flat;
}
