import { detectConsole } from "./consoleRule.js";
import { detectDebugger } from "./debuggerRule.js";

const KEEP_MARKER = /\bscrubjs-keep\b/;

/**
 * Lines protected by a `scrubjs-keep` comment. A trailing marker (code before it
 * on the line) protects its own line; a marker alone on its line protects the
 * line below it.
 * @param {Array} comments the AST's collected comments
 * @param {string} content source the comments came from
 * @returns {Set<number>} the protected 1-based line numbers
 */
function keptLines(comments, content) {
  const sourceLines = content.split(/\r\n|\r|\n/);
  const lines = new Set();
  for (const comment of comments ?? []) {
    if (!KEEP_MARKER.test(comment.value)) continue;
    const line = comment.loc.start.line;
    const before = (sourceLines[line - 1] ?? "").slice(0, comment.loc.start.column);
    lines.add(before.trim() === "" ? line + 1 : line);
  }
  return lines;
}

/**
 * Collects the enabled rules' findings, minus any a `scrubjs-keep` comment
 * protects, start-sorted.
 * @param {object} ast acorn Program AST to walk
 * @param {string} content source the AST was parsed from
 * @param {object} [options] `{ methods, debugger }` rule toggles
 * @returns {object[]} the merged findings
 */
export function extractFindings(ast, content, options = {}) {
  const methods = options.methods ?? ["log"];
  const includeDebugger = options.debugger !== false;

  const findings = detectConsole(ast, content, methods);
  if (includeDebugger) findings.push(...detectDebugger(ast, content));

  const kept = keptLines(ast.comments, content);
  return findings
    .filter((finding) => !kept.has(finding.line))
    .sort((a, b) => a.start - b.start);
}
