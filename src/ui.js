import path from "path";
import chalk from "chalk";
import { commentOut } from "./helper/index.js";

// chalk auto-disables color for non-TTY output and when NO_COLOR is set.

/**
 * A path relative to the cwd when that is shorter, else the original.
 * @param {string} filePath absolute path to shorten
 * @returns {string} the display path
 */
export function displayPath(filePath) {
  const relative = path.relative(process.cwd(), filePath);
  return relative && relative.length < filePath.length ? relative : filePath;
}

/**
 * A finding's code collapsed to one capped line for list labels.
 * @param {string} code source snippet of the finding
 * @returns {string} the single-line label
 */
export function formatLabel(code) {
  const oneLine = code.replace(/\s+/g, " ").trim();
  return oneLine.length > 70 ? oneLine.slice(0, 67) + "…" : oneLine;
}

/**
 * A dimmed, right-aligned line-number gutter.
 * @param {number|string} line line number, or blank for continuation
 * @returns {string} the styled gutter
 */
function gutter(line) {
  return chalk.dim(String(line).padStart(4));
}

/**
 * A success line prefixed with a green check.
 * @param {string} text message to show
 * @returns {string} the styled line
 */
export function ok(text) {
  return `${chalk.green("✓")} ${text}`;
}

/**
 * Lists every finding for the --all preview, grouped by file.
 * @param {Array} fileResults `[[findings, filePath], ...]` to list
 * @returns {string} the rendered listing
 */
export function renderList(fileResults) {
  const out = [];
  for (const [findings, filePath] of fileResults) {
    out.push(chalk.underline(displayPath(filePath)));
    for (const finding of findings) {
      out.push(`${gutter(finding.line)}  ${chalk.cyan(formatLabel(finding.code))}`);
    }
  }
  return out.join("\n");
}

/**
 * Shows a finding in surrounding code with its change, for the checkbox panel.
 * @param {string} content full source of the file
 * @param {object} finding the finding to preview
 * @param {string} task "comment" or "remove"
 * @param {number} [contextLines] lines of context on each side
 * @returns {string} the rendered panel
 */
export function renderContext(content, finding, task, contextLines = 2) {
  const lines = content.split(/\r\n|\r|\n/);
  const startLine = finding.line;
  const span = content.slice(finding.stmtStart, finding.stmtEnd);
  const endLine = startLine + (span.match(/\n/g) || []).length;
  const from = Math.max(1, startLine - contextLines);
  const to = Math.min(lines.length, endLine + contextLines);
  const after =
    task === "comment"
      ? commentOut(content, [finding]).split(/\r\n|\r|\n/)
      : null;

  const out = [];
  for (let line = from; line <= to; line += 1) {
    const original = lines[line - 1];
    const isTarget = line >= startLine && line <= endLine;
    if (!isTarget) {
      out.push(`${gutter(line)} ${chalk.dim("  " + original)}`);
    } else {
      out.push(`${gutter(line)} ${chalk.red("- " + original)}`);
      if (task === "comment") {
        out.push(`${gutter("")} ${chalk.green("+ " + after[line - 1])}`);
      }
    }
  }
  return out.join("\n");
}

/**
 * A colored preview of one file's change, written nowhere.
 * @param {string} filePath file being previewed
 * @param {string} content full source of the file
 * @param {object[]} findings findings selected for the file
 * @param {string} task "comment" or "remove"
 * @returns {string} the rendered diff
 */
export function renderFileDiff(filePath, content, findings, task) {
  const lines = content.split(/\r\n|\r|\n/);
  const out = [chalk.underline(displayPath(filePath))];

  if (task === "comment") {
    // Comment mode keeps the line count, so comparing by index is exact.
    const after = commentOut(content, findings).split(/\r\n|\r|\n/);
    for (let i = 0; i < lines.length; i += 1) {
      if (lines[i] !== after[i]) {
        out.push(`${gutter(i + 1)} ${chalk.red("- " + lines[i])}`);
        out.push(`${gutter("")} ${chalk.green("+ " + after[i])}`);
      }
    }
  } else {
    // Remove shifts later lines, so removed lines come from the spans.
    const removed = new Set();
    for (const finding of findings) {
      const span = content.slice(finding.stmtStart, finding.stmtEnd);
      const extra = (span.match(/\n/g) || []).length;
      for (let line = finding.line; line <= finding.line + extra; line += 1) {
        removed.add(line);
      }
    }
    for (const line of [...removed].sort((a, b) => a - b)) {
      out.push(`${gutter(line)} ${chalk.red("- " + lines[line - 1])}`);
    }
  }

  return out.join("\n");
}
