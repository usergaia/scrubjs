import { readdir, writeFile, stat } from "fs/promises";
import path from "path";
import { processFile, commentOut, removeStatements } from "./helper/index.js";
import { loadIgnore, isIgnored } from "./ignore.js";

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
  const supportedExtensions = [".js", ".ts", ".tsx", ".jsx"];
  const fileStats = await stat(scanTarget);

  function isFileValid(filePath) {
    return supportedExtensions.some((ext) => filePath.endsWith(ext));
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
