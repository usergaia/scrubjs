import path from "path";
import chalk from "chalk";
import { commentOutLogs } from "./helper/index.js";

// chalk auto-disables color for non-TTY output and when NO_COLOR is set.

export function displayPath(filePath) {
  const relative = path.relative(process.cwd(), filePath);
  return relative && relative.length < filePath.length ? relative : filePath;
}

export function formatLogLabel(code) {
  const oneLine = code.replace(/\s+/g, " ").trim();
  return oneLine.length > 70 ? oneLine.slice(0, 67) + "…" : oneLine;
}

function gutter(line) {
  return chalk.dim(String(line).padStart(4));
}

export function ok(text) {
  return `${chalk.green("✓")} ${text}`;
}

// Grouped, colored listing of every detected log — used for the --all preview.
export function renderList(logList) {
  const out = [];
  for (const [logDetails, filePath] of logList) {
    out.push(chalk.underline(displayPath(filePath)));
    for (const log of logDetails) {
      out.push(`${gutter(log.line)}  ${chalk.cyan(formatLogLabel(log.code))}`);
    }
  }
  return out.join("\n");
}

// One log shown in its surrounding code with the colored change — used as the
// checkbox description panel so each choice is reviewed in context.
export function renderContext(content, log, task, contextLines = 2) {
  const lines = content.split(/\r\n|\r|\n/);
  const startLine = log.line;
  const span = content.slice(log.stmtStart, log.stmtEnd);
  const endLine = startLine + (span.match(/\n/g) || []).length;
  const from = Math.max(1, startLine - contextLines);
  const to = Math.min(lines.length, endLine + contextLines);
  const after =
    task === "comment"
      ? commentOutLogs(content, [log]).split(/\r\n|\r|\n/)
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

// Colored diff of what a change would do to one file, without writing it.
// Comment mode keeps the line count, so a line-index compare is exact; remove
// mode drops whole lines, so the removed lines are taken straight from the spans.
export function renderFileDiff(filePath, content, logs, task) {
  const lines = content.split(/\r\n|\r|\n/);
  const out = [chalk.underline(displayPath(filePath))];

  if (task === "comment") {
    const after = commentOutLogs(content, logs).split(/\r\n|\r|\n/);
    for (let i = 0; i < lines.length; i += 1) {
      if (lines[i] !== after[i]) {
        out.push(`${gutter(i + 1)} ${chalk.red("- " + lines[i])}`);
        out.push(`${gutter("")} ${chalk.green("+ " + after[i])}`);
      }
    }
  } else {
    const removed = new Set();
    for (const log of logs) {
      const span = content.slice(log.stmtStart, log.stmtEnd);
      const extra = (span.match(/\n/g) || []).length;
      for (let line = log.line; line <= log.line + extra; line += 1) {
        removed.add(line);
      }
    }
    for (const line of [...removed].sort((a, b) => a - b)) {
      out.push(`${gutter(line)} ${chalk.red("- " + lines[line - 1])}`);
    }
  }

  return out.join("\n");
}
