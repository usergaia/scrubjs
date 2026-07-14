/**
 * Groups selected entries by file path so each file is touched once.
 * @param {Array<{filePath: string, finding: object}>} selected chosen entries
 * @returns {Map<string, object[]>} file path to its findings
 */
export function groupByFile(selected) {
  const byFile = new Map();
  for (const { filePath, finding } of selected) {
    if (!byFile.has(filePath)) byFile.set(filePath, []);
    byFile.get(filePath).push(finding);
  }
  return byFile;
}
