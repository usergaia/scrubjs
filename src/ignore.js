import { readFileSync } from "fs";
import path from "path";
import ignore from "ignore";

/**
 * A matcher built from `<baseDir>/.scrubjsignore`, or null when the file is absent.
 * @param {string} baseDir directory holding the ignore file
 * @returns {object|null} an `ignore` matcher, or null
 */
export function loadIgnore(baseDir) {
  try {
    const contents = readFileSync(path.join(baseDir, ".scrubjsignore"), "utf8");
    return ignore().add(contents);
  } catch {
    return null;
  }
}

/**
 * Whether a path is excluded by the matcher, using its path relative to baseDir.
 * @param {string} filePath file or directory being considered
 * @param {object|null} matcher an `ignore` matcher, or null
 * @param {string} baseDir directory the patterns are relative to
 * @param {boolean} [isDir] add a trailing slash so directory patterns match
 * @returns {boolean} true when the path should be skipped
 */
export function isIgnored(filePath, matcher, baseDir, isDir = false) {
  if (!matcher) return false;
  const relative = path.relative(baseDir, filePath);
  // Paths outside the base (or the base itself) cannot be matched by globs.
  if (!relative || relative.startsWith("..")) return false;
  const posix = relative.split(path.sep).join("/");
  return matcher.ignores(isDir ? posix + "/" : posix);
}
