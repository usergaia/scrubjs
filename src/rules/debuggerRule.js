import { ancestor, base } from "./walk.js";

/**
 * Finds `debugger` statements, which are always standalone.
 * @param {object} ast acorn Program AST to walk
 * @param {string} content source the AST was parsed from
 * @returns {object[]} the detected findings
 */
export function detectDebugger(ast, content) {
  const findings = [];

  ancestor(
    ast,
    {
      DebuggerStatement: function (node) {
        findings.push({
          kind: "debugger",
          code: content.slice(node.start, node.end),
          start: node.start,
          end: node.end,
          line: node.loc?.start.line,
          stmtStart: node.start,
          stmtEnd: node.end,
        });
      },
    },
    base,
  );

  return findings;
}
