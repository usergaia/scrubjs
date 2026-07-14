import { readdir, writeFile, stat } from "fs/promises";
import { execFileSync } from "child_process";
import path from "path";
import { processFile, commentOut, removeStatements } from "./helper/index.js";
import { loadIgnore, isIgnored } from "./ignore.js";

const SUPPORTED = [".js", ".ts", ".tsx", ".jsx"];

/**
 * Findings for each supported file under a path, skipping node_modules,
 * dotfolders, and anything matched by `.scrubjsignore`.
 * @param {string} scanTarget file or directory to scan
 * @param {object} [options] rule toggles passed to the detectors
 * @returns {Promise<Array>} `[[findings, filePath], ...]`
 */
export async function scanPath(scanTarget, options = {}) {
  const base = options.cwd ?? process.cwd();
  // Load the ignore file once, then thread it through the recursion.
  const matcher = options.ignore !== undefined ? options.ignore : loadIgnore(base);
  const opts = { ...options, cwd: base, ignore: matcher };

  const results = [];
  const fileStats = await stat(scanTarget);

  function isFileValid(filePath) {
    return SUPPORTED.some((ext) => filePath.endsWith(ext));
  }

  async function handleFile() {
    if (isFileValid(scanTarget) && !isIgnored(scanTarget, matcher, base)) {
      const findings = await processFile(scanTarget, opts);
      if (findings) results.push([findings, scanTarget]);
    }
  }

  async function handleDirectory() {
    const files = await readdir(scanTarget, { withFileTypes: true });
    for (const file of files) {
      const filePath = path.join(scanTarget, file.name);
      if (file.isDirectory()) {
        if (
          !file.name.startsWith(".") &&
          file.name !== "node_modules" &&
          !isIgnored(filePath, matcher, base, true)
        ) {
          const nested = await scanPath(filePath, opts);
          results.push(...nested);
        }
      } else if (isFileValid(filePath) && !isIgnored(filePath, matcher, base)) {
        const findings = await processFile(filePath, opts);
        if (findings) results.push([findings, filePath]);
      }
    }
  }

  if (fileStats.isDirectory()) {
    await handleDirectory();
  } else if (fileStats.isFile()) {
    await handleFile();
  }

  return results;
}

/**
 * Findings for the git-staged files, read from their current content on disk.
 * @param {object} [options] rule toggles passed to the detectors
 * @returns {Promise<Array>} `[[findings, filePath], ...]`
 */
export async function scanStaged(options = {}) {
  const base = options.cwd ?? process.cwd();
  const matcher = options.ignore !== undefined ? options.ignore : loadIgnore(base);
  const opts = { ...options, cwd: base, ignore: matcher };

  // stderr is silenced so git's own "not a git repository" line does not leak.
  const gitOptions = { cwd: base, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] };
  let root;
  let staged;
  try {
    root = execFileSync("git", ["rev-parse", "--show-toplevel"], gitOptions).trim();
    staged = execFileSync(
      "git",
      ["diff", "--cached", "--name-only", "--diff-filter=ACMR"],
      gitOptions,
    );
  } catch {
    throw new Error("--staged requires a git repository.");
  }

  const results = [];
  for (const line of staged.split("\n")) {
    const relative = line.trim();
    if (!SUPPORTED.some((ext) => relative.endsWith(ext))) continue;
    const filePath = path.join(root, relative);
    if (isIgnored(filePath, matcher, base)) continue;
    try {
      const findings = await processFile(filePath, opts);
      if (findings) results.push([findings, filePath]);
    } catch {
      // Skip files that cannot be read or parsed.
    }
  }
  return results;
}

/**
 * Splices `content` for either mode, preserving formatting and line endings.
 * @param {string} filePath file to overwrite
 * @param {string} content current source of the file
 * @param {object[]} findings findings to comment or remove
 * @param {string} mode "comment" or "remove"
 * @returns {Promise<void>}
 */
export async function modify(filePath, content, findings, mode) {
  const result =
    mode === "comment"
      ? commentOut(content, findings)
      : removeStatements(content, findings);

  await writeFile(filePath, result, "utf8");
}
