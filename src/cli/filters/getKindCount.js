/**
 * Counts findings by kind across all files, in first-seen order.
 * @param {Array} fileResults `[[findings, filePath], ...]`
 * @returns {Map<string, number>} kind to count
 */
export function getKindCount(fileResults) {
  const counts = new Map();
  for (const [findings] of fileResults) {
    for (const finding of findings) {
      counts.set(finding.kind, (counts.get(finding.kind) ?? 0) + 1);
    }
  }
  return counts;
}