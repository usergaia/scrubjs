/**
 * Keeps only findings whose kind is in `kinds`, dropping emptied files.
 * @param {Array} fileResults `[[findings, filePath], ...]`
 * @param {Set<string>} kinds kinds to keep
 * @returns {Array} the filtered results
 */
export function filterByKind(fileResults, kinds) {
  const out = [];
  for (const [findings, filePath] of fileResults) {
    const kept = findings.filter((finding) => kinds.has(finding.kind));
    if (kept.length) out.push([kept, filePath]);
  }
  return out;
}